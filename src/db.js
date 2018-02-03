let config = require('./config');
let MongoClient = require('mongodb').MongoClient;

let URL = `mongodb://${config.DB_USER_NAME}:${config.DB_PASSWORD}@eqfolio-shard-00-00-yqauh.mongodb.net:27017,eqfolio-shard-00-01-yqauh.mongodb.net:27017,eqfolio-shard-00-02-yqauh.mongodb.net:27017/${config.DB_NAME}?ssl=true&replicaSet=eqfolio-shard-0&authSource=admin`;


let connect = (onConnect, onFail) => {
    MongoClient.connect(URL).then(onConnect).catch(onFail);
};

module.exports = {
    connect
};