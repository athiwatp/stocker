let request = require('request');
let moment = require('moment');
let fs = require('fs');
let path = require('path');
const NSE_API_END_POINT = 'https://www.nseindia.com/archives/equities/bhavcopy/pr/';
const SUFFIX = '.zip';
let ZIP_FILES_FOLDER = path.join('D:', 'nse-archives');
let zipFileName = path.join(ZIP_FILES_FOLDER, 'nse.zip');

let download = (dates = [], outFolder, onDone) => {

    let noOfDates = dates.length;
    let downloadedDates = 0;

    let options = {
        url: NSE_API_END_POINT,
        headers: {
            'User-Agent': 'request'
        }
    };

    console.log(dates);

    dates.forEach((date) => {
        let targetDate = date.format('DDMMYY');
        let url = `${NSE_API_END_POINT}${targetDate}${SUFFIX}`;
        console.log(url);
        onDownloadDone();
    });

    let onDownloadDone = () => {
        downloadedDates += 1;
        if (downloadedDates >= noOfDates) {
            onDone();
        }
    };

    request(options).pipe(fs.createWriteStream(zipFileName));
};


module.exports = download;