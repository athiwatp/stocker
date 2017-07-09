/*
 download -> process -> parse -> upload
 */
let path = require('path');
let downloaders = require('./downloaders');
let processors = require('./processors');
let parsers = require('./parsers');
let uploaders = require('./uploaders');
let DB = require('./db');
let moment = require('moment');

const WORKSPACE = path.join('D:', 'temp', 'stocker');
const ZIP_FOLDER = path.join(WORKSPACE, 'archives');
const EXTRACTED_FOLDER = path.join(WORKSPACE, 'extracted');
const DATE_FORMAT = 'DDMMYY';
const SUNDAY = 0;
const SATURDAY = 6;

let execute = () => {

    let db = null;
    let archiveDates = [];

    DB.connect((dbConnection) => {

        db = dbConnection;
        let worklog = db.collection('worklog');
        worklog.findOne({exchange: 'nse'}, (err, item) => {
            let archiveDate = moment(item.archiveDate, DATE_FORMAT);
            let date = moment();

            while (date.isAfter(archiveDate)) {
                let nextDate = moment(date);
                let day = nextDate.weekday();
                if (day !== SUNDAY && day !== SATURDAY) {
                    archiveDates.push(moment(date));
                }
                date = date.subtract(1, 'day');
            }
            downloaders.NSE(archiveDates, WORKSPACE, onDownloadDone);
        });

    });

    let onDownloadDone = () => {
        console.log('Downloaded all files');
        onExecuteDone();
    };

    let onExecuteDone = () => {
        db.close();
        console.log('Closed DB');
    };
};

execute();

module.exports = execute;