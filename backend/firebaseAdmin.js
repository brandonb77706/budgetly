import { db } from "@/FirebaseConfig";

var admin = require("firebase-admin");

var serviceAccount = require(".serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: db,
});

module.exports = admin;
