let csv = require('fast-csv');
let fs = require('fs');

const PARSER_MODE = {
    TRADE: 'TRADE',
    SECURITIES: 'SECURITIES'
};


const FIELD_MAPPINGS = {
    SYMBOL: 'symbol',
    DATE1: 'date',
    PREV_CLOSE: 'previous',
    OPEN_PRICE: 'open',
    HIGH_PRICE: 'high',
    LOW_PRICE: 'low',
    LAST_PRICE: 'last',
    CLOSE_PRICE: 'close',
    AVG_PRICE: 'average',
    TTL_TRD_QNTY: 'tradeQuantity',
    TURNOVER_LACS: 'turnOver',
    NO_OF_TRADES: 'noOfTrades',
    DELIV_QTY: 'delivered',
    DELIV_PER: 'deliveredPercent'
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

    reader(file, (nseStocks) => {
        let cleaned = cleaner(nseStocks);
        let mapped = mapper(cleaned);
        onDone(mapped);
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