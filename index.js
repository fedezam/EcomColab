// Importamos los módulos de Firebase
import { auth, db, googleProvider } from "./firebase-config.js";
import { getAuth, signInWithPopup, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// 📌 Función para guardar el usuario en Firestore
const saveUserToFirestore = async (user, additionalData = {}) => {
    if (!user) return;
    try {
        const userRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                nombre: user.displayName || additionalData.nombre || "Usuario",
                email: user.email,
                telefono: additionalData.telefono || "",
                foto: user.photoURL || "",
                tqc: 0
            });
            console.log("✅ Usuario guardado en Firestore.");
        } else {
            console.log("ℹ️ El usuario ya existía en Firestore.");
        }
    } catch (error) {
        console.error("❌ Error al guardar en Firestore:", error);
    }
};

// 📌 Registro con Google (corrigiendo el ID del botón)
document.getElementById("googleBtn").addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        await saveUserToFirestore(result.user);
        alert("Inicio de sesión con Google exitoso.");
        window.location.replace("home.html");
    } catch (error) {
        console.error("❌ Error con Google:", error);
        alert("Error: " + error.message);
    }
});

// 📌 Registro manual con email y contraseña (ajustando los IDs)
document.getElementById("submitRegister").addEventListener("click", async (event) => {
    event.preventDefault();
    
    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const repeatPassword = document.getElementById("repeatPassword").value;
    const telefono = document.getElementById("telefono").value;

    // Verificar que las contraseñas coincidan
    if (password !== repeatPassword) {
        alert("❌ Las contraseñas no coinciden.");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserToFirestore(userCredential.user, { nombre, telefono });
        alert("Registro exitoso.");
        window.location.replace("home.html");
    } catch (error) {
        console.error("❌ Error en el registro:", error);
        alert("Error: " + error.message);
    }
});

// 📌 Abrir y cerrar modal de registro
document.getElementById("registerBtn").addEventListener("click", () => {
    document.getElementById("registerModal").classList.remove("hidden");
});

document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("registerModal").classList.add("hidden");
});

// 📌 Detectar cambios en la autenticación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ Usuario autenticado:", user);
        await saveUserToFirestore(user);
    }
});
