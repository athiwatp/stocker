let path = require('path');
let parsers = require('./parsers');
let nseParser = parsers.NSE;
const CUR_DIR = __dirname;
const CSV_FILE = path.join(CUR_DIR, 'sec_bhavdata_full.csv');

require('./db')((db) => {
    console.log('Connected to database. Starting the parser.');
    nseParser.parse(CSV_FILE, {mode: nseParser.PARSER_MODE.TRADE}, (parsed) => {
        console.log(`Completed parsing. Number of stocks : ${parsed.length}`);
        console.log('Uploading...');
        let nseTradeCollection = db.collection('tradeNSE');
        let toUpload = parsed.length;
        let uploaded = 0;
        parsed.forEach((stock) => {
            nseTradeCollection.updateOne(
                {
                    symbol: stock.symbol,
                    date: stock.date
                },
                {
                    $set: stock
                },
                {
                    upsert: true
                }
            ).then(() => {
                uploaded += 1;
                if (uploaded >= toUpload) {
                    console.log(`Uploaded ${uploaded} records.`);
                    console.log('Completed uploading. Closing the DB connection.');
                    db.close();
                }
            });
        });
    });
});