let path = require('path');
let Q = require('q');
let nseProcessor = require('../processors').NSE;
let nseParser = require('../parsers').NSE;
let parserOptions = {mode: nseParser.PARSER_MODE.TRADE};

let NSE_ARCHIVES = path.join('D:', 'nse-archives');

let uploader = () => {

    let noOfFiles = 0;
    let uploadedFiles = 0;
    let db = null;

    let onDBConnection = (connectedDB) => {
        db = connectedDB;
        nseProcessor(NSE_ARCHIVES, onProcessDone);
    };

    let onProcessDone = (files = []) => {
        if (files && files.length > 0) {
            noOfFiles = files.length;
            files.forEach((file) => {
                nseParser.parse(file, parserOptions, onParseDone);
            })
        }
    };

    let uploadTrade = (stock, collection) => {
        let trade = (({
                          symbol,
                          date,
                          previous,
                          open,
                          high,
                          low,
                          close,
                          netTradeValue,
                          netTradeQuantity,
                          trades
                      }) => ({
            symbol,
            date,
            previous,
            open,
            high,
            low,
            close,
            netTradeValue,
            netTradeQuantity,
            trades
        }))(stock);
        return collection.updateOne(
            {
                symbol: trade.symbol,
                date: trade.date
            },
            {
                $set: trade
            },
            {
                upsert: true
            }
        );

    };

    let uploadMeta = (stock, collection) => {
        let meta = (({
                         symbol,
                         security,
                         high52,
                         low52
                     }) => ({
            symbol,
            security,
            high52,
            low52
        }))(stock);
        return collection.updateOne(
            {
                symbol: stock.symbol
            },
            {
                $set: meta
            },
            {
                upsert: true
            }
        );
    };

    let onParseDone = (parsed) => {

        let nseTradeCollection = db.collection('tradeNSE');
        let nseMetaCollection = db.collection('metaNSE');
        let noOftocks = parsed.length;
        let uploadedStocks = 0;

        parsed.forEach((stock) => {
            Q.all([uploadMeta(stock, nseMetaCollection),
                uploadTrade(stock, nseTradeCollection)]).then(() => {
                uploadedStocks += 1;
                if (uploadedStocks >= noOftocks) {
                    onFileUploadDone();
                }
            })
        });

    };

    let onFileUploadDone = () => {
        uploadedFiles += 1;
        if (uploadedFiles >= noOfFiles) {
            console.log('Uploaded all data. Closing..');
            db.close();
        }
    };
    require('../db')(onDBConnection);
};

uploader();