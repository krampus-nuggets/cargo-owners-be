const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("cookie-session");
const asyncHandler = require("express-async-handler");
const auth = require("./src/utilities/auth");
const dbModule = require("./src/modules/database");

// Initialize
const app = express();
dotenv.config();

// Dummy User Database
const users = {
    oc: {
        username: process.env.DUMMY_USERNAME,
        password: process.env.DUMMY_PASSWORD,
        salt: process.env.HASH_SALT
    }
}

// Apply Middleware
app.set("trust proxy", 1),
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    name: "session",
    maxAge: 24 * 60 * 60 * 1000,
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SECRET
}));

// Generate Password Hash
(function () {
    users.oc["hash"] = auth.hash(users.oc.password, users.oc.salt)["hashedpassword"];
}());

// Apply Session-Persisted Middleware
app.use(function (req, res, next) {
    let err = req.session.error;
    let msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = "";
    if (err) res.locals.message = "<p class='msg error'>" + err + "</p>";
    if (msg) res.locals.message = "<p class='msg success'>" + msg + "</p>";
    next();
});


// Apply CORS Headers
app.use(function (req, res, next) {

    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST");
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);

    next();
});

// FUNC: Authenticate The Session
function authenticate(user, pass) {
    let userCheck = false;
    let passwordCheck = false;
    let authState = false;

    if (users.oc.username === user) { userCheck = true }
    if (auth.compare(pass, { salt: users.oc.salt, hash: users.oc.hash })) { passwordCheck = true }
    if (userCheck && passwordCheck === true) { authState = true }

    return authState
}

// Restrict Access Without Authentication
function restrict(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = "Access denied!";
        res.redirect("/");
    }
}

// Root Response
app.get("/", function (req, res) {
    res.send("Cargo-Owners API v1");
});

// Restricted - API Route | GET Response
app.get("/api", restrict, async function (req, res) {
    res.send("Login Successful | You can now access the API");
});

// Restricted - API Route | POST Request Handler
app.post("/api", restrict, asyncHandler(async(req, res) => {
    /*

        queryString Object | Value Types
        ================================

        userID: int
        rateType: str
        actionType: str
        mutationType: str

        Query Request => ?userid=0&ratetype=transporter&actiontype=query

    */

    let queryString = {
        userID: Number(req.query.userid),
        rateType: req.query.ratetype || null,
        actionType: req.query.actiontype || null,
        mutationType: req.query.mutationtype || null
    }

    if (queryString.actionType === "query") {
        const data = await dbModule.queryAllRates(queryString.userID, queryString.rateType).then(function(result){
            return result
        });

        res.json(data);
    } else if (queryString.actionType === "mutate") {
        // pass
    } else {
        res.end();
    }
}));

// Terminate User Session
app.get("/logout", function (req, res) {
    req.session = null;
    res.redirect("/");
});

// GET - API Login Response
app.get("/login", function (req, res) {
    res.send("Cargo-Owners API | Login Response");
});

// POST - API Login Response
app.post("/login", function (req, res) {
    const requestData = {
        username: req.body.username,
        password: req.body.password
    }

    if (authenticate(requestData.username, requestData.password)) {
        req.session.user = requestData.username;
        req.session.success = "SUCCESS: User Authenticated!";
        res.status(200).send("OK");
    } else {
        req.session.error = "ERROR: Authentication Failed";
        res.redirect("/login");
    }
});

// Listen for connections | Ports vary between local and prod
app.listen(process.env.PORT || process.env.API_PORT);