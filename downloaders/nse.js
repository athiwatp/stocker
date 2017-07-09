let request = require('request');
let moment = require('moment');
let fs = require('fs');
let path = require('path');
const NSE_API_END_POINT = 'https://www.nseindia.com/archives/equities/bhavcopy/pr/PR';
const SUFFIX = '.zip';
let ZIP_FILES_FOLDER = path.join('D:', 'nse-archives');
let DOWNLOAD_DELAY = 2000;

let downloadFile = (date, current, total, onDone) => {
    let targetDate = date.format('DDMMYY');
    let url = `${NSE_API_END_POINT}${targetDate}${SUFFIX}`;
    let options = {
        url: url,
        headers: {
            'User-Agent': 'request'
        }
    };
    let zipFileName = path.join(ZIP_FILES_FOLDER, `${targetDate}.zip`);
    console.log(`Downloading ${current + 1} / ${total} file...`);
    let stream = request(options).pipe(fs.createWriteStream(zipFileName));
    stream.on('finish', onDone);
};


let download = (dates = [], outFolder, onDone) => {

    let noOfDates = dates.length;
    let d = 0;
    let onDownloadDone = () => {
        d += 1;
        if (d >= noOfDates) {
            onDone();
        } else {
            console.log(`Delaying ${DOWNLOAD_DELAY / 1000} seconds`);
            setTimeout(() => {
                downloadFile(dates[d], d, noOfDates, onDownloadDone);
            }, DOWNLOAD_DELAY);
        }
    };

    downloadFile(dates[d], d, noOfDates, onDownloadDone);
};


module.exports = download;