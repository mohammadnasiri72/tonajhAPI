const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.MAINDOMAIN);

module.exports = client;
