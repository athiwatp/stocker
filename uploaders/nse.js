let path = require('path');
let Q = require('q');
let parsers = require('../parsers');


let upload = (db, files = [], onDone) => {

    let noOfFiles = files.length;
    let uploadedFiles = 0;

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
        let noOfStocks = parsed.length;
        let uploadedStocks = 0;

        parsed.forEach((stock) => {
            Q.all([uploadMeta(stock, nseMetaCollection),
                uploadTrade(stock, nseTradeCollection)]).then(() => {
                uploadedStocks += 1;
                if (uploadedStocks >= noOfStocks) {
                    onFileUploadDone();
                }
            })
        });

    };

    let onFileUploadDone = () => {
        uploadedFiles += 1;
        if (uploadedFiles >= noOfFiles) {
            onDone();
        }
    };

    files.forEach((file) => {
        parsers.NSE(file, onParseDone);
    });
};

module.exports = upload;