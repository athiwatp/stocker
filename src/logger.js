let winston = require('winston');
let path = require('path');

let INFO_LOG_FILE = path.join(__dirname, '..', 'logs', 'info.log');
let ERROR_LOG_FILE = path.join(__dirname, '..', 'logs', 'error.log');
let logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new (winston.transports.File)({
            name: 'info-file',
            filename: INFO_LOG_FILE,
            level: 'info'
        }),
        new (winston.transports.File)({
            name: 'error-file',
            filename: ERROR_LOG_FILE,
            level: 'error'
        })
    ]
});

module.exports = logger;