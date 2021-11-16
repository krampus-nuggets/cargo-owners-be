const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config();
const connectURI = process.env.DB_URL;
const client = new MongoClient(connectURI);

const collections = {
    transporter: "transporter-rates",
    average: "average-rates"
}

async function checkConnection() {
    let checkState = false;

    try {
        await client.connect();
        await client.db(process.env.DB_NAME).command({ ping: 1 });
        checkState = true;
    } catch (err) {
        console.error();
    } finally {
        await client.close();
        return checkState;
    }
}

async function queryAllRates(ID, rateType) {
    let documents = [];

    try {
        await client.connect();

        const database = client.db(process.env.DB_NAME);
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
