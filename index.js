const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const session = require("cookie-session");
const auth = require("./src/utilities/auth");

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
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    name: "session",
    resave: false, // Don"t save session if unmodified
    saveUninitialized: false, // Don"t create session until something stored
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

// Restricted - API Route
app.get("/api", restrict, function (req, res) {
    res.send("Wahoo! restricted area, click to <a href='/logout'>logout</a>");
});

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
        // Regenerate session when signing in to prevent fixation
        req.session.user = requestData.username;
        req.session.success = "SUCCESS: User Authenticated!";
        res.redirect("/api");
    } else {
        req.session.error = "ERROR: Authentication Failed";
        res.redirect("/login");
    }
});

// Listen for connections
app.listen(process.env.PORT || process.env.API_PORT);