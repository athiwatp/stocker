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

let db;

let makeWorkspace = () => {
    logger.info('Making workspace folders');
    let args = minimist(process.argv.slice(2));
    WORKSPACE = args.dir || path.join("D:", "temp", "stocker");
    ZIP_FOLDER = path.join(WORKSPACE, 'archives');
    EXTRACTED_FOLDER = path.join(WORKSPACE, 'extracted');
    mkdirp.sync(WORKSPACE);
    mkdirp.sync(ZIP_FOLDER);
    mkdirp.sync(EXTRACTED_FOLDER);
    logger.info('Completed making workspace folders');
};

let onDBConnect = (dbConnection) => {
    logger.info('Successfully connected to database.');

    db = dbConnection;

    let archiveDates = [];
    makeWorkspace();

    let worklog = db.collection('worklog');
    worklog.findOne({exchange: 'nse'}, (err, item) => {
        let lastArchivedDate;
        if (!item) {
            logger.info('Worklog not found. Defaulting to previous date to process.');
            lastArchivedDate = moment().subtract(1, 'day');
        } else {
            logger.info(`Last archived date is [${item.lastArchiveDate}]`);
            lastArchivedDate = moment(item.lastArchiveDate, DATE_FORMAT);
        }
        let today = moment();
        while (lastArchivedDate.isBefore(today)) {
            let nextDate = lastArchivedDate.add(1, 'day');
            let day = nextDate.weekday();
            if (day !== SUNDAY && day !== SATURDAY) {
                archiveDates.push(moment(today));
            }
            lastArchivedDate = nextDate;
        }
        if (archiveDates.length > 0) {
            logger.info(`Number of days to process is ${archiveDates.length}`);
            downloaders.NSE(archiveDates, ZIP_FOLDER, onDownloadDone);
        } else {
            logger.info('Number of days to process is zero. Exiting');
            onExecuteDone();
        }

    });
};
let onDBFail = () => {
    logger.error('Failed to connect to database. Exiting');
    onExecuteDone();
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
    db && db.close();
    process.exit();
};

let execute = () => {
    logger.info('Starting the batch');
    DB.connect(onDBConnect, onDBFail);
};

execute();

module.exports = execute;