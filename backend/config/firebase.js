const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "supabyte-platform.appspot.com"
});

/*
  FIRESTORE DATABASE
*/
const db = admin.firestore();

/*
  FIREBASE STORAGE
*/
const bucket = admin.storage().bucket();

module.exports = { db, bucket };