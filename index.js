/*
 download -> process -> parse -> upload
 */
let path = require('path');
let mkdirp = require('mkdirp');
let minimist = require('minimist');
let downloaders = require('./downloaders');
let processors = require('./processors');
let parsers = require('./parsers');
let uploaders = require('./uploaders');
let DB = require('./db');
let moment = require('moment');

const DATE_FORMAT = 'DDMMYY';
const SUNDAY = 0;
const SATURDAY = 6;

let WORKSPACE = null;
let ZIP_FOLDER = null;
let EXTRACTED_FOLDER = null;

let execute = () => {

    let db = null;
    let archiveDates = [];

    DB.connect((dbConnection) => {

        makeWorkspace();

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
            downloaders.NSE(archiveDates, ZIP_FOLDER, onDownloadDone);
        });

    });

    let makeWorkspace = () => {
        let args = minimist(process.argv.slice(2));
        WORKSPACE = args.dir || path.join("D:", "temp", "stocker");
        ZIP_FOLDER = path.join(WORKSPACE, 'archives');
        EXTRACTED_FOLDER = path.join(WORKSPACE, 'extracted');
        mkdirp.sync(WORKSPACE);
        mkdirp.sync(ZIP_FOLDER);
        mkdirp.sync(EXTRACTED_FOLDER);
    };

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