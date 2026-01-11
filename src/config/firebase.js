
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Suas credenciais (copiadas do seu código original)
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCqNenQ_kMsO42OvFyAXHl5fdiwXygGWPs",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "egide-8c7c2.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "egide-8c7c2",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "egide-8c7c2.appspot.com",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "583438596528",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:583438596528:web:0a3380c5e45466b153fe75",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-X9H0MF1SWC"
};

// Inicialização
const app = initializeApp(firebaseConfig);

// EXPORTAÇÕES (Isso é crucial para os outros arquivos funcionarem)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'egide-8c7c2';