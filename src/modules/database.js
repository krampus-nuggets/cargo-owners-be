/*

    Database Handler
    Query and Mutate functionality is handled in this module.

*/

const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

// Initialize Application
dotenv.config();
const connectURI = process.env.DB_URL || process.env.PROD_DB_URL;
const client = new MongoClient(connectURI);

// Object for Collection Names
const collections = {
    transporter: "transporter-rates",
    average: "average-rates"
}

// Check if application can connect to DB
async function checkConnection() {
    let checkState = false;

    try {
        await client.connect();
        await client.db(process.env.PROD_DB_NAME || process.env.DB_NAME).command({ ping: 1 });
        checkState = true;
    } catch (err) {
        console.error();
    } finally {
        await client.close();
        return checkState;
    }
}

// QUERY - Get all rates from collection | Rates retrieved are in relation to UserID and Collection Name
async function queryAllRates(ID, rateType) {
    let documents = [];

    try {
        await client.connect();

        const database = client.db(process.env.PROD_DB_NAME || process.env.DB_NAME);
        const collection = database.collection(collections[rateType]);
        const query = { userID: ID };
        const cursor = collection.find(query);

        await cursor.forEach(function (item) {
            documents.push(item);
        });
    } catch (err) {
        console.log("");
        return Promise.reject(err);
    } finally {
        await client.close();
        return Promise.resolve(documents);
    }
}

// MUTATE - Insert document into Transporter Rates collection
async function insertTransporter(documentObject) {
    try {
        await client.connect();

        const database = client.db(process.env.PROD_DB_NAME || process.env.DB_NAME);
        const collection = database.collection(collections["transporter"]);
        
        await collection.insertOne(documentObject);
    } catch (err) {
        console.error();
    } finally {
        await client.close();
    }
}

module.exports = {
    checkConnection,
    queryAllRates
}