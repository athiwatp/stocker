let MongoClient = require('mongodb').MongoClient;
let URL = 'mongodb://localhost:27017/stocker';


module.exports = (onConnect) => {
    MongoClient.connect(URL).then(onConnect).catch(() => {
        console.log('Unable to connect to database')
    });
};