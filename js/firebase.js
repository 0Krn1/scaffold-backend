import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

import { 
getAuth,
signInAnonymously,
signInWithCustomToken,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import {
getFirestore,
doc,
setDoc,
getDoc,
setLogLevel
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app, db, auth;

setLogLevel('debug');

try {

if (Object.keys(firebaseConfig).length > 0) {

app = initializeApp(firebaseConfig);
db = getFirestore(app);
auth = getAuth(app);

async function authenticate() {

let userId = 'loading...';

try {

if (initialAuthToken) {
await signInWithCustomToken(auth, initialAuthToken);
console.log("Firebase signed in with custom token.");
} else {
await signInAnonymously(auth);
console.log("Firebase signed in anonymously.");
}

 const currentUser = auth.currentUser;
 userId = currentUser?.uid || crypto.randomUUID();
 window.firestoreDB = db;
 window.firebaseAuth = auth;
 window.appUserId = userId; // Store ID globally for use in the script
 window.firebaseFirestore = { doc, setDoc, getDoc, onAuthStateChanged };

// Update profile page immediately after successful auth
updateProfilePage(userId);

} catch (error) {
console.error("Firebase authentication failed:", error);
 const fallbackId = crypto.randomUUID();
                        window.appUserId = fallbackId;
                        updateProfilePage(fallbackId, true);
                    }

}

authenticate();

}else{
 console.warn("Firebase configuration missing. Running application without persistence/auth.");
                 window.appUserId = 'N/A (No Firebase Config)';
                 updateProfilePage(window.appUserId, true);
}

} catch(e) {
 console.error("Firebase initialization failed:", e);
}

function updateProfilePage(userId, isFallback = false) {
             const userIdDisplay = document.getElementById('user-id-display');
             if (userIdDisplay) {
                 userIdDisplay.textContent = userId;
                 if (isFallback) {
                    userIdDisplay.classList.add('text-red-500');
                    userIdDisplay.textContent += " (Read-only session)";
                 }
             }
        }