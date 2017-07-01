/**
 * This File unzips the daily archive report from NSE and parses it.
 * File location: https://www.nseindia.com/archives/equities/bhavcopy/pr/PR300617.zip
 * @type {request}
 */
let fs = require('fs');
let path = require('path');
let unzip = require('unzip');

let ZIP_FILES_FOLDER = path.join('D:', 'nse-archives');
let WORKSPACE = path.join('D:', 'temp');

/**
 * Maps PRDDMMYY.zip to PdDDMMYY.csv
 */
let mapZipToCSVFileName = (zipFileName) => {
    let PATTERN = 'DDMMYY';
    let csvFileTemplate = 'PdDDMMYY.csv';
    let ddmmyy = zipFileName.substr(2, PATTERN.length);
    return csvFileTemplate.replace(PATTERN, ddmmyy);
}

let extract = (folder, source, toFolder) => {
    let fileToExtract = mapZipToCSVFileName(source);
    fs.createReadStream(path.join(folder, source))
        .pipe(unzip.Parse())
        .on('entry', (entry) => {
            let eFileName = entry.path;
            if (eFileName === fileToExtract) {
                entry.pipe(fs.createWriteStream(path.join(toFolder, eFileName)));
            } else {
                entry.autodrain();
            }
        });
};

let isAZipFile = (file) => {
    let parts = file.split('.');
    return parts[parts.length - 1] === 'zip';
};

let process = (folder, source) => {
    console.log(`Processing [${source}]`);
    extract(folder, source, WORKSPACE);
};

let parse = (folder) => {
    let zipFiles = fs.readdirSync(folder);
    let filesLen = zipFiles.length;

    for (let i = 0; i < filesLen; i++) {
        let file = zipFiles[i];
        if (isAZipFile(file)) {
            process(folder, file);
        } else {
            console.log('Not a zip file. Skipping');
        }
    }
};

parse(ZIP_FILES_FOLDER);
