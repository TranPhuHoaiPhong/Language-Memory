import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAmAjD8nvLgwUzeSQywq7XxL3D8j5oCm3Q",
    authDomain: "extention-f7140.firebaseapp.com",
    projectId: "extention-f7140",
    storageBucket: "extention-f7140.firebasestorage.app",
    messagingSenderId: "190605533008",
    appId: "1:190605533008:web:f197650d0e156e04245655",
    measurementId: "G-MG3FLR7EGG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();