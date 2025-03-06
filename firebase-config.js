const firebaseConfig = {
  apiKey: "AIzaSyAgIPuOIfvYp191JZI9cKLRkKXfGwdaCxM",
  authDomain: "trueque-28b33.firebaseapp.com",
  projectId: "trueque-28b33",
  storageBucket: "trueque-28b33.firebasestorage.app",
  messagingSenderId: "6430433157",
  appId: "1:6430433157:web:1e6cf47ee1ed80b127eeec",
  measurementId: "G-JMDRX032BS"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar la instancia de autenticación y Firestore
export const auth = firebase.auth();
export const db = firebase.firestore();
