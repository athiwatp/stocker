let csv = require('fast-csv');
let fs = require('fs');

const PARSER_MODE = {
    TRADE: 'TRADE',
    SECURITIES: 'SECURITIES'
};


const FIELD_MAPPINGS = {
    SYMBOL: 'symbol',
    SERIES: 'series',
    SECURITY: 'security',
    PREV_CL_PR: 'previous',
    OPEN_PRICE: 'open',
    HIGH_PRICE: 'high',
    LOW_PRICE: 'low',
    CLOSE_PRICE: 'close',
    NET_TRDVAL: 'netTradeValue',
    NET_TRDQTY: 'netTradeQuantity',
    TRADES: 'trades',
    HI_52_WK: 'high52',
    LO_52_WK: 'low52'
};


let reader = (file, onDone) => {
    let stream = fs.createReadStream(file);
    let nseStocks = [];
    csv.fromStream(stream, {headers: true}).on("data", (data) => {
        nseStocks.push(data);
    }).on("end", () => {
        onDone(nseStocks);
    })
};


let parseTrade = (file, onDone) => {

    /**
     * This method cleans the raw objects from CSV
     *  It trims the key, values and ignores the heading lines and other unwanted information.
     *  It considers only the data which has the symbol information.
     * @param stocks
     * @returns {Array}
     */
    let cleaner = (stocks = []) => {
        return stocks.map((stock) => {
            let cleaned = Object.assign({}, stock);
            Object.keys(stock).forEach((key) => {
                let val = stock[key];
                cleaned[key.trim()] = val.trim();
            });
            return cleaned;
        });
    };

    let mapper = (stocks = []) => {
        return stocks.map((stock) => {
            let mappedStock = {};
            Object.keys(FIELD_MAPPINGS).forEach((originalKey) => {
                let mappedKey = FIELD_MAPPINGS[originalKey];
                mappedStock[mappedKey] = stock[originalKey] || null;
            });
            return mappedStock;
        });
    };

    let filter = (stocks = []) => {
        return stocks.filter((stock) => stock.series === 'EQ');
    };

    reader(file, (nseStocks) => {
        let cleaned = cleaner(nseStocks);
        let mapped = mapper(cleaned);
        let filtered = filter(mapped);
        onDone(filtered);
    });
};

let parse = (file, options, onDone) => {
    let {mode} = options;
    if (mode === PARSER_MODE.TRADE) {
        parseTrade(file, onDone);
    }
};

module.exports = {
    PARSER_MODE,
    parse
};