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
