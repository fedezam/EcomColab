// script.js
import { auth, db } from "./firebase-config.js";
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    setDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const userInfo = document.getElementById("userInfo");

    const provider = new GoogleAuthProvider();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            userInfo.innerHTML = `<p>Bienvenido, ${user.displayName}</p>`;
            loginBtn.style.display = "none";
            logoutBtn.style.display = "block";
            await verificarUsuario(user);
        } else {
            userInfo.innerHTML = "";
            loginBtn.style.display = "block";
            logoutBtn.style.display = "none";
        }
    });

    loginBtn.addEventListener("click", () => {
        signInWithPopup(auth, provider)
            .catch((error) => {
                console.error("Error al iniciar sesión", error);
            });
    });

    logoutBtn.addEventListener("click", () => {
        signOut(auth).catch((error) => {
            console.error("Error al cerrar sesión", error);
        });
    });
});

async function verificarUsuario(user) {
    const userRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            nombre: user.displayName,
            email: user.email,
            fechaRegistro: new Date()
        });
    }
}
