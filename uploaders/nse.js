let Q = require('q');
let parsers = require('../parsers');
let util = require('../util');


let upload = (db, files = [], onDone) => {

    let noOfFiles = files.length;
    let uploadedFiles = 0;

    if (noOfFiles === 0) {
        util.log.error('No files to upload to database. Exiting.');
        onDone(null);
        return;
    }

    util.log.start(`Uploading ${files.length} files to database`);
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

    let onParseDone = (parsed, date) => {
        let nseTradeCollection = db.collection('tradeNSE');
        let nseMetaCollection = db.collection('metaNSE');
        let noOfStocks = parsed.length;
        let uploadedStocks = 0;
        util.log.start(`${date} - Uploading ${parsed.length} stocks.`);
        parsed.forEach((stock) => {
            Q.all([uploadMeta(stock, nseMetaCollection),
                uploadTrade(stock, nseTradeCollection)]).then(() => {
                uploadedStocks += 1;
                if (uploadedStocks >= noOfStocks) {
                    util.log.end(`${date} - Uploaded ${uploadedStocks} stocks.`);
                    onFileUploadDone();
                }
            })
        });

    };

    let onFileUploadDone = () => {
        uploadedFiles += 1;
        if (uploadedFiles >= noOfFiles) {
            util.log.end(`Uploaded ${noOfFiles} files to database`);
            onDone();
        }
    };

    files.forEach((file) => {
        parsers.NSE(file, onParseDone);
    });
};

module.exports = upload;