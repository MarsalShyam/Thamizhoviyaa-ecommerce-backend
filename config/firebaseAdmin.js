// backend/config/firebaseAdmin.js
import dotenv from "dotenv";
dotenv.config();

import admin from 'firebase-admin';
console.log("PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
} = process.env;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Private key often has \n in .env, so we fix that:
      privateKey: FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export default admin;
