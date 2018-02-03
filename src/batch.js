/*
 download -> process -> parse -> upload
 */
let path = require('path');
let mkdirp = require('mkdirp');
let minimist = require('minimist');
let util = require('./util');
let downloaders = require('./downloaders');
let processors = require('./processors');
let parsers = require('./parsers');
let uploaders = require('./uploaders');
let DB = require('./db');
let moment = require('moment');
let logger = require('./logger');

const DATE_FORMAT = 'DDMMYY';
const SUNDAY = 0;
const SATURDAY = 6;

let WORKSPACE = null;
let ZIP_FOLDER = null;
let EXTRACTED_FOLDER = null;

let makeWorkspace = () => {
    util.log.start('Creating workspace.');
    let args = minimist(process.argv.slice(2));
    WORKSPACE = args.dir || path.join("D:", "temp", "stocker");
    ZIP_FOLDER = path.join(WORKSPACE, 'archives');
    EXTRACTED_FOLDER = path.join(WORKSPACE, 'extracted');
    mkdirp.sync(WORKSPACE);
    mkdirp.sync(ZIP_FOLDER);
    mkdirp.sync(EXTRACTED_FOLDER);
    util.log.end('Creating workspace.');
};

let onDBConnect = (dbConnection) => {
    logger.info('Successfully connected to database.');
    return;
    let db = dbConnection;
    let archiveDates = [];

    makeWorkspace();

    let worklog = db.collection('worklog');
    worklog.findOne({exchange: 'nse'}, (err, item) => {

        let archiveDate;

        if (!item) {
            util.log.msg('Worklog not found. Defaulting to previous date to process.');
            archiveDate = moment().subtract(1, 'day');
        } else {
            archiveDate = moment(item.archiveDate, DATE_FORMAT);
        }
        let today = moment();
        while (today.isAfter(archiveDate)) {
            let nextDate = moment(today);
            let day = nextDate.weekday();
            if (day !== SUNDAY && day !== SATURDAY) {
                archiveDates.push(moment(today));
            }
            today = today.subtract(1, 'day');
        }
        downloaders.NSE(archiveDates, ZIP_FOLDER, onDownloadDone);
    });
};
let onDBFail = () => {
    logger.error('Failed to connect to database. Exiting');
    process.exit();
};
let onDownloadDone = (downloaded) => {
    if (downloaded === null) {
        onExecuteDone();
    } else {
        processors.NSE(ZIP_FOLDER, EXTRACTED_FOLDER, onProcessDone);
    }

};

let onProcessDone = (extractedFiles = []) => {
    uploaders.NSE(db, extractedFiles, onUploadDone);
};

let onUploadDone = () => {
    onExecuteDone();
};

let onExecuteDone = () => {
    util.log.end('Completed all operations. Closing.');
    db.close();
};

let execute = () => {
    logger.info('Starting the batch');
    DB.connect(onDBConnect, onDBFail);
};

execute();

module.exports = execute;