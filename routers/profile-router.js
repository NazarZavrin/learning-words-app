const express = require('express');
const profileRouter = express.Router();
const path = require('path');

// ↓ connecting to the database
const { MongoClient, ServerApiVersion } = require('mongodb');
let database;
async function connectToDb(req, res, next) {
    // console.log("Connect to db if needed. URL: " + req.originalUrl);
    if (database === undefined) {
        let uri = "mongodb+srv://nazar:learnwords@main-cluster.dlb856s.mongodb.net/?retryWrites=true&w=majority";
        let client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        try {
            await client.connect();
            database = client.db("userData");
            // console.log("Connected to the db.");
        } catch (error) {
            console.log(error);
            await client.close();
            res.send("Database connection error.");
        }
    }
    next();
}
profileRouter.use(connectToDb);

profileRouter.get("/:passkey", async (req, res) => {
    let cursor = database.collection("users").find({passkey: req.params.passkey});
    let result = await cursor.toArray();
    cursor.close();
    if (result.length === 1) {
        // res.send(result.pop());
        res.render("profile", {user: result.pop(), });
    } else {
        res.render("error", {
            message: "Log in error. Try again.", 
            linkText: "To the main page",
            divStyle: `font:20px"Calibri",monospace;margin-bottom:3px`
        });
    }
})
profileRouter.patch("/:passkey/change/:infoPart", (req, res, next) => {
    express.text({
        limit: req.get('content-length'),
    })(req, res, next);
}, async (req, res) => {
    console.log(req.body);
    console.log(req.params.infoPart);
    // if infoPart is userId or email check if new value is unique
    if (req.params.infoPart === 'userId') {
        // ↓ userId check
        let numOfDocsWithId = await database.collection("users").countDocuments({userId: req.body});
        if (numOfDocsWithId !== 0) {
            res.json({success: false, message: "This ID is already taken. Please, provide another."});
            return;
        }
    } else if (req.params.infoPart === 'email'){
        // ↓ email check
        let numOfDocsWithEmail = await database.collection("users").countDocuments({email: req.body});
        if (numOfDocsWithEmail !== 0) {
            res.json({success: false, message: "User with such email already exists. Please, provide another email."});
            return;
        }
    } else if (req.params.infoPart !== "username") {
        res.json({success: false, message: "Wrong characteristic: " + req.params.infoPart + "."});
        return;
    }
    let updateResult = await database.collection("users").updateOne({passkey: req.params.passkey}, {$set: {[req.params.infoPart]: req.body}});
    if (updateResult.acknowledged) {
        res.json({success: true, newValue: req.body});
    } else {
        res.json({success: false});
    }
})

module.exports.profileRouter = profileRouter;