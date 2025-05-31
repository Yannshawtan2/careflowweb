import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
var admin = require("firebase-admin");
// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  var serviceAccount = require("../careflow-317ed-firebase-adminsdk-fbsvc-14c4666af5.json");
   
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or invalid.');
  }

  admin.initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();