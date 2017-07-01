/**
 * This File unzips the daily archive report from NSE and parses it.
 * File location: https://www.nseindia.com/archives/equities/bhavcopy/pr/PR300617.zip
 * @type {request}
 */
let fs = require('fs');
let path = require('path');
let unzip = require('unzip');

let ZIP_FILES_FOLDER = path.join('D:', 'nse-archives');
let TEMP_FOLDER = path.join('D:', 'temp');

/**
 * Maps PRDDMMYY.zip to PdDDMMYY.csv
 */
let mapZipToCSVFileName = (zipFileName) => {
    let PATTERN = 'DDMMYY';
    let csvFileTemplate = 'PdDDMMYY.csv';
    let ddmmyy = zipFileName.substr(2, PATTERN.length);
    return csvFileTemplate.replace(PATTERN, ddmmyy);
};

let createWorkSpace = () => {
    let workspace = 'st' + Date.now().toString();
    let dir = path.join(TEMP_FOLDER, workspace);
    fs.mkdirSync(dir);
    return dir;
};

let extract = (folder, source, toFolder, onDone) => {
    let fileToExtract = mapZipToCSVFileName(source);
    fs.createReadStream(path.join(folder, source))
        .pipe(unzip.Parse())
        .on('entry', (entry) => {
            let eFileName = entry.path;
            if (eFileName === fileToExtract) {
                let extractedFileName = path.join(toFolder, eFileName);
                entry.pipe(fs.createWriteStream(extractedFileName)).on('close', () => {
                    onDone(extractedFileName);
                })
            } else {
                entry.autodrain();
            }
        });
};

let isValidZipFile = (file) => {
    let parts = file.split('.');
    return parts[parts.length - 1] === 'zip';
};

let process = (folder, source, toFolder, onDone) => {
    console.log(`Processing [${source}]`);
    extract(folder, source, toFolder, onDone);
};

let parse = (folder, onDone) => {
    let zipFiles = fs.readdirSync(folder);
    let noOfFiles = zipFiles.length;
    let workspace = createWorkSpace();
    let processedFiles = [];

    let onProcessDone = (processedFileName) => {
        processedFiles.push(processedFileName);
        if (processedFiles.length >= noOfFiles) {
            onParseDone();
        }
    };

    let onParseDone = () => {
        if (onDone) {
            onDone(processedFiles);
        }
    };

    zipFiles.forEach((zipFile) => {
        if (isValidZipFile(zipFile)) {
            process(folder, zipFile, workspace, onProcessDone);
        }
    });
};
module.exports = parse;
