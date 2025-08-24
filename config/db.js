
const { MongoClient } = require("mongodb");

const connectionString = process.env.MAINDOMAIN || 'mongodb://localhost:27017/tonajh';

if (!connectionString) {
    console.error('MAINDOMAIN environment variable is not defined');
    process.exit(1);
}

const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// اتصال جهانی
let dbConnection;

async function connectToDatabase() {
    try {
        if (!dbConnection) {
            await client.connect();
            dbConnection = client.db(process.env.DBNAME);
            console.log('Connected to MongoDB successfully');
        }
        return dbConnection;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

module.exports = { connectToDatabase, client };