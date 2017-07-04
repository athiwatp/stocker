let path = require('path');
let nseProcessor = require('../processors').NSE;
let nseParser = require('../parsers').NSE;
let parserOptions = {mode: nseParser.PARSER_MODE.TRADE};

let NSE_ARCHIVES = path.join('D:', 'test-nse-archives');

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

    let onParseDone = (parsed) => {
        let nseTradeCollection = db.collection('tradeNSE');
        let nseMetaCollection = db.collection('metaNSE');
        parsed.forEach((stock) => {

            let {
                symbol,
                security,
                previous,
                open,
                high,
                low,
                close,
                netTradeValue,
                netTradeQuantity,
                trades,
                high52,
                low52
            } = stock;

            let meta = Object.assign({}, {
                symbol,
                security,
                high52,
                low52
            });
            let trade = Object.assign({}, {
                symbol,
                previous,
                open,
                high,
                low,
                close,
                netTradeValue,
                netTradeQuantity,
                trades
            });
            nseTradeCollection.updateOne(
                {
                    symbol: stock.symbol,
                    date: stock.date
                },
                {
                    $set: trade
                },
                {
                    upsert: true
                }
            ).then(() => {
                nseMetaCollection.updateOne(
                    {
                        symbol: stock.symbol
                    },
                    {
                        $set: meta
                    },
                    {
                        upsert: true
                    }
                ).then(() => {
                    uploadedFiles += 1;
                    if (uploadedFiles >= noOfFiles) {
                        console.log('Completed uploading. Closing the DB connection.');
                        db.close();
                    }
                });

            })

        });
    };

    let onUploadDone = () => {
        db.close();
    };

    require('../db')(onDBConnection);


};

uploader();


/**
 * Takes a set of stocks and splits it into two sets of stock objects, one containing trade
 * information and the other containing stock meta information.
 * stocks => (meta, trade)
 * symbol name will be the unique ID for these two objects.
 * @param stocks
 */
let splitter = (stocks) => {
    let metas = [],
        trades = [];
    for (let i = 0, stockLen = stocks.length; i < stockLen; i++) {


    }
};


