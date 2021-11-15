/*
    Auth
    Script used for generating SHA512 hashes and salts based on user password
    Also used for login credentials verfication on FE via API
*/

let crypto = require("crypto");

let generateSalt = rounds => {
    if (rounds >= 15) {
        throw new Error(`Argument - ${rounds} - must be less than 15`);
    }
    if (typeof rounds !== "number") {
        throw new Error("Argument must be of type int");
    }
    if (rounds == null) {
        rounds = 12;
    }
    return crypto.randomBytes(Math.ceil(rounds / 2)).toString("hex").slice(0, rounds);
};

let hasher = (password, salt) => {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    let value = hash.digest('hex');

    return {
        salt: salt,
        hashedpassword: value
    };
};

let hash = (password, salt) => {
    if (password == null || salt == null) {
        throw new Error('Required arguments have not been supplied');
    }
    if (typeof password !== 'string' || typeof salt !== 'string') {
        throw new Error('Argument password must be of type string || Argument salt must be of type int or a salt string');
    }
    return hasher(password, salt);
};

let compare = (password, hashData) => {
	let compareState = false

    if (password == null || hashData == null) {
        throw new Error('Required arguments have not been supplied');
    }

    if (typeof password !== 'string' || typeof hashData !== 'object') {
        throw new Error('Argument password must be of type string || Argument hashData must be of type object');
    }

    let passwordData = hasher(password, hashData.salt);

    if (passwordData.hashedpassword === hashData.hash) {
        compareState = true;
    }

    return compareState;
};

module.exports = {
    hash,
    compare
}
