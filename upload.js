let parsers = require('./parsers');
let nseParser = parsers.NSE;

let path = require('path');
let CUR_DIR = __dirname;
const CSV_FILE = path.join(CUR_DIR, 'sec_bhavdata_full.csv');

nseParser.parse(CSV_FILE, {mode: nseParser.PARSER_MODE.TRADE}, (parsed) => {
    console.log('Parsed successfully', parsed.length);
});