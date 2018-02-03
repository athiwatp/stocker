let request = require('request');
let moment = require('moment');
let fs = require('fs');
let path = require('path');
let util = require('../util');
let logger = require('../logger');
const NSE_API_END_POINT = 'https://www.nseindia.com/archives/equities/bhavcopy/pr/PR';
const SUFFIX = '.zip';
let DOWNLOAD_DELAY = 2000;

let downloadFile = (date, outFolder, current, total, onDone) => {
    let targetDate = date.format('DDMMYY');
    let url = `${NSE_API_END_POINT}${targetDate}${SUFFIX}`;
    let options = {
        url: url,
        headers: {
            'User-Agent': 'request'
        }
    };
    let zipFileName = path.join(outFolder, `PR${targetDate}.zip`);
    logger.info(`Downloading ${current + 1} / ${total} file to ${zipFileName}`);
    let stream = request(options).pipe(fs.createWriteStream(zipFileName));
    stream.on('finish', onDone);
};


let download = (dates = [], outFolder, onDone) => {
    if (dates.length > 0) {
        logger.info(`Downloading NSE archives for ${dates.length} days`);
        let noOfDates = dates.length;
        let d = 0;
        let onDownloadDone = () => {
            d += 1;
            if (d >= noOfDates) {
                logger.info(`Downloaded ${d} out of ${dates.length} files.`);
                onDone(d);
            } else {
                logger.info(`Delaying ${DOWNLOAD_DELAY / 1000} seconds`);
                setTimeout(() => {
                    downloadFile(dates[d], outFolder, d, noOfDates, onDownloadDone);
                }, DOWNLOAD_DELAY);
            }
        };
        downloadFile(dates[d], outFolder, d, noOfDates, onDownloadDone);
    } else {
        logger.info('Not downloading any archives, as there are no dates given. Exiting.');
        onDone(null);
    }
};


module.exports = download;