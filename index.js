// Importar módulos de Firebase
import { auth, db } from "./firebase-config.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

const walletInput = document.getElementById("wallet-address");
const saveWalletButton = document.getElementById("save-wallet");
const continueButton = document.getElementById("continue-tasks");
const welcomeMessage = document.getElementById("welcome-message");
const tqcBalance = document.getElementById("tqc-balance");


// Elementos del DOM
const registerBtn = document.getElementById('registerBtn');
const googleBtn = document.getElementById('googleBtn');
const loginBtn = document.getElementById('loginBtn');
const registerModal = document.getElementById('registerModal');
const closeModal = document.getElementById('closeModal');
const submitRegister = document.getElementById('submitRegister');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Asegurar que el modal de registro esté oculto al inicio
document.addEventListener("DOMContentLoaded", () => {
    registerModal.classList.add('hidden');
});

// Verificar autenticación y redirigir si el usuario ya está logueado
auth.onAuthStateChanged(user => {
    if (user) {
        window.location.href = '/dashboard';
    }
});

// Función para mostrar notificaciones
function showToast(message, isError = false) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.toggle('bg-green-500', !isError);
    toast.classList.toggle('bg-red-500', isError);

    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Cerrar notificación manualmente (verifica si el botón existe)
const closeToast = document.getElementById('closeToast');
if (closeToast) {
    closeToast.addEventListener('click', () => {
        toast.classList.add('hidden');
    });
}

// Abrir y cerrar modal de registro
registerBtn.addEventListener('click', () => registerModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => registerModal.classList.add('hidden'));

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', (e) => {
    if (e.target === registerModal) {
        registerModal.classList.add('hidden');
    }
});

// Registro manual con Firebase Auth y Firestore
submitRegister.addEventListener('click', async () => {
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const password = document.getElementById('password').value;
    const repeatPassword = document.getElementById('repeatPassword').value;

    // Validación de campos vacíos
    if (!nombre || !apellido || !email || !telefono || !password || !repeatPassword) {
        showToast('Todos los campos son obligatorios', true);
        return;
    }

    if (password !== repeatPassword) {
        showToast('Las contraseñas no coinciden', true);
        return;
    }

    if (password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', true);
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guardar datos en Firestore
        await setDoc(doc(db, 'usuarios', user.uid), {
            nombre,
            apellido,
            email,
            telefono,
        });

        showToast('¡Registro exitoso!');
        registerModal.classList.add('hidden');
    } catch (error) {
        showToast('Error: ' + error.message, true);
    }
});

// Registro con Google
googleBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Verificar si el usuario ya existe en Firestore
        const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'usuarios', user.uid), {
                nombre: user.displayName || '',
                email: user.email,
            });
        }

        showToast('¡Inicio de sesión con Google exitoso!');
    } catch (error) {
        showToast('Error: ' + error.message, true);
    }
});

// Redirigir a login
loginBtn.addEventListener('click', () => {
    window.location.href = '/login';
});
