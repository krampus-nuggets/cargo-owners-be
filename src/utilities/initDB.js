/*
    Initial Database
    Script mainly used for seeding a local dev instance of MongoDB
    Note - Not used in prod
*/

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const MongoClient = require("mongodb").MongoClient;

// Initial Project
dotenv.config();
const url = process.env.PROD_DB_URL || process.env.DB_URL
const cwd = __dirname + "/"

// Define Models Directory Object
const models = {
    rate: cwd + "rates.json",
    route: cwd + "routes.json"
}

// Parser For Local JSON Files
function modelJSON(jsonFile) {
    let data = fs.readFileSync(jsonFile);
    let parsedData = JSON.parse(data);
    return parsedData;
}

// Seed Object for DB Data
const initialObject = {
    name: "cargo-owners-db",
    collections: {
        users: "users",
        transporters: "transporter-rates",
        averages: "average-rates"
    },
    documents: {
        user: {
            userID: 0,
            name: "Owner",
            surname: "Cargo"
        },
        transporterRate: modelJSON(models.rate)[0],
        averageRate: modelJSON(models.route)[0]
    }
}

// FUNC: Populate DB w/ Known Values
function initDB(initObject) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;

        let i = 0;
        let documentKeys = [];
        const database = db.db(initObject.name);
        initialObject.documents.transporterRate["userID"] = initialObject.documents.user.userID;
        initialObject.documents.averageRate["userID"] = initialObject.documents.user.userID;

        for (let key in initObject.documents) {
            documentKeys.push(key)
        }

        for (let key in initObject.collections) {
            database.collection(initObject.collections[key]).insertOne(initObject.documents[documentKeys[i]])
            i++;
        }
    });
}

function queryCollection(query, collectionName) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;

        const database = db.db(initialObject.name);
        const collection = database.collection(collectionName);

        collection.find(query).toArray(function(err, res) {
            if (err) throw err;
            console.log(res);
            db.close();
        });
    });
}
