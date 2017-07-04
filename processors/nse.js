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

let getFileDate = (file) => file.split('.')[0].substr(2);

let extract = (folder, source, toFolder, onDone) => {
    let fileToExtract = mapZipToCSVFileName(source);
    let fileDate = getFileDate(fileToExtract);

    fs.createReadStream(path.join(folder, source))
        .pipe(unzip.Parse())
        .on('entry', (entry) => {
            let ePath = path.parse(entry.path);
            let eFileName = ePath.base;
            if (eFileName.indexOf(fileToExtract) > -1) {
                let extractedFileName = path.join(toFolder, eFileName);
                entry.pipe(fs.createWriteStream(extractedFileName)).on('close', () => {
                    onDone({
                        date: fileDate,
                        name: extractedFileName
                    });
                })
            } else {
                entry.autodrain();
            }
        });
    // TODO Wire up close event to handle the case when there's no target files found.

};

let isValidZipFile = (file) => {
    let parts = file.split('.');
    return parts[parts.length - 1] === 'zip';
};

let process = (folder, onDone) => {
    let zipFiles = fs.readdirSync(folder);
    let noOfFiles = zipFiles.length;
    let workspace = createWorkSpace();
    let extractedFiles = [];

    let onExtractDone = (extractedFileName) => {
        extractedFiles.push(extractedFileName);
        if (extractedFiles.length >= noOfFiles) {
            onProcessDone();
        }
    };

    let onProcessDone = () => {
        if (onDone) {
            onDone(extractedFiles);
        }
    };

    zipFiles.forEach((zipFile) => {
        if (isValidZipFile(zipFile)) {
            extract(folder, zipFile, workspace, onExtractDone);
        }
    });
};
module.exports = process;
