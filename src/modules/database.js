const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

dotenv.config();
const connectURI = process.env.DB_URL;
const client = new MongoClient(connectURI);
