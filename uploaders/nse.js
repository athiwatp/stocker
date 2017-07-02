let path = require('path');
let nseProcessor = require('../processors').NSE;
let nseParser = require('../parsers').NSE;


let NSE_ARCHIVES = path.join('D:', 'nse-archives');

nseProcessor(NSE_ARCHIVES, (files = []) => {
    files = [files[0]];
    if (files && files.length > 0) {
        files.forEach((file) => {
            nseParser.parse(file, {
                mode: nseParser.PARSER_MODE.TRADE
            }, (parsed) => {
                console.log('Completed Parsing', parsed.length, parsed[0]);
            });
        })
    }
});


// require('./db')((db) => {
//     console.log('Connected to database. Starting the parser.');
//     nseParser.parse(CSV_FILE, {mode: nseParser.PARSER_MODE.TRADE}, (parsed) => {
//         console.log(`Completed parsing. Number of stocks : ${parsed.length}`);
//         console.log('Uploading...');
//         let nseTradeCollection = db.collection('tradeNSE');
//         let toUpload = parsed.length;
//         let uploaded = 0;
//         parsed.forEach((stock) => {
//             nseTradeCollection.updateOne(
//                 {
//                     symbol: stock.symbol,
//                     date: stock.date
//                 },
//                 {
//                     $set: stock
//                 },
//                 {
//                     upsert: true
//                 }
//             ).then(() => {
//                 uploaded += 1;
//                 if (uploaded >= toUpload) {
//                     console.log(`Uploaded ${uploaded} records.`);
//                     console.log('Completed uploading. Closing the DB connection.');
//                     db.close();
//                 }
//             });
//         });
//     });
// });