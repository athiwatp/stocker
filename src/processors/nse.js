/**
 * This File unzips the daily archive report from NSE and parses it.
 * File location: https://www.nseindia.com/archives/equities/bhavcopy/pr/PR300617.zip
 * @type {request}
 */
let fs = require('fs');
let path = require('path');
let unzip = require('unzip');
let util = require('../util');
const APP_PREFIX = 'st';
/**
 * Maps PRDDMMYY.zip to PdDDMMYY.csv
 */
let mapZipToCSVFileName = (zipFileName) => {
    let PATTERN = 'DDMMYY';
    let csvFileTemplate = 'PdDDMMYY.csv';
    let ddmmyy = zipFileName.substr(2, PATTERN.length);
    return csvFileTemplate.replace(PATTERN, ddmmyy);
};

let createWorkSpace = (outFolder) => {
    let workspace = APP_PREFIX + Date.now().toString();
    let dir = path.join(outFolder, workspace);
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
        })
        .on('error', (err) => {
            console.log('Error occured. Skipping...');
            onDone(null);
        });
    // TODO Wire up close event to handle the case when there's no target files found.

};

let isValidZipFile = (file) => {
    let parts = file.split('.');
    return parts[parts.length - 1] === 'zip';
};

let process = (inFolder, outFolder, onDone) => {
    util.log.start(`Processing files.`);
    let zipFiles = fs.readdirSync(inFolder);
    let noOfFiles = zipFiles.length;
    util.log.msg(`Number of zip files to extract is ${noOfFiles}`);
    let workspace = createWorkSpace(outFolder);
    let extractedFiles = [];
    let processedCount = 0;

    let onExtractDone = (extractedFileName) => {
        processedCount += 1;
        if (extractedFileName) {
            extractedFiles.push(extractedFileName);
            if (processedCount >= noOfFiles) {
                if (onDone) {
                    util.log.end(`Extracted ${processedCount} out of ${noOfFiles} files.`);
                    onDone(extractedFiles);
                }
            }
        }
    };

    zipFiles.forEach((zipFile) => {
        if (isValidZipFile(zipFile)) {
            extract(inFolder, zipFile, workspace, onExtractDone);
        } else {
            util.log.error(`${zipFile} is not a valid zip file`);
        }
    });
};
module.exports = process;
