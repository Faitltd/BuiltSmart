const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccount;

// Try to load service account from file path first
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    const serviceAccountPath = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('Loaded Firebase service account from file');
  } catch (error) {
    console.error('Error loading Firebase service account from file:', error);
  }
}

// Fall back to environment variable if file loading failed
if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('Loaded Firebase service account from environment variable');
  } catch (error) {
    console.error('Error parsing Firebase service account from environment variable:', error);
  }
}

// Initialize Firebase
if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  console.log('Firebase initialized successfully');
} else {
  console.error('Failed to initialize Firebase: No valid service account found');
}

const db = admin.firestore();

module.exports = { admin, db };
