// Importar Firebase desde firebase-config.js
import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

// Referencias a elementos DOM
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const userTqc = document.getElementById('user-tqc');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginFormElements = document.getElementById('login-form-elements');
const registerFormElements = document.getElementById('register-form-elements');
const anunciosContainer = document.getElementById('anuncios-container');
const anunciosList = document.getElementById('anuncios-list');
const authContainer = document.getElementById('auth-container');
const backLogin = document.getElementById('back-login');
const backRegister = document.getElementById('back-register');

let currentUser = null;
let userDocRef = null;
let userUnsubscribe = null;

// Event Listeners
loginBtn.addEventListener('click', showLoginForm);
registerBtn.addEventListener('click', showRegisterForm);
logoutBtn.addEventListener('click', () => signOut(auth));
backLogin.addEventListener('click', () => loginForm.classList.add('hidden'));
backRegister.addEventListener('click', () => registerForm.classList.add('hidden'));

loginFormElements.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    await loginUser(email, password);
});

registerFormElements.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    await registerUser(name, email, password);
});

// Escuchar cambios en la autenticación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await handleUserLoggedIn(user);
    } else {
        handleUserLoggedOut();
    }
});

// Funciones de autenticación
async function loginUser(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginForm.classList.add('hidden');
        showNotification('Inicio de sesión exitoso', 'success');
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    }
}

async function registerUser(name, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Crear documento en Firestore
        const userRef = doc(db, "usuarios", user.uid);
        await setDoc(userRef, {
            nombre: name,
            email: email,
            tqc: 0
        });

        showNotification('Usuario registrado exitosamente', 'success');
        registerForm.classList.add('hidden');
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    }
}

// Funciones UI
function showLoginForm() {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    document.getElementById('login-email').focus();
}

function showRegisterForm() {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    document.getElementById('register-name').focus();
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Manejo de usuario autenticado
async function handleUserLoggedIn(user) {
    userInfo.classList.remove('hidden');
    anunciosContainer.classList.remove('hidden');
    authContainer.classList.add('hidden');
    loginBtn.classList.add('hidden');
    registerBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');

    userDocRef = doc(db, "usuarios", user.uid);

    userUnsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            userName.textContent = userData.nombre;
            userTqc.textContent = userData.tqc;
        } else {
            setDoc(userDocRef, {
                nombre: user.displayName || 'Usuario',
                email: user.email,
                tqc: 0
            });
        }
    }, (error) => {
        console.error("Error escuchando cambios en el documento de usuario:", error);
    });

    loadAnuncios();
}

function handleUserLoggedOut() {
    if (userUnsubscribe) {
        userUnsubscribe();
        userUnsubscribe = null;
    }
    currentUser = null;
    userDocRef = null;

    userInfo.classList.add('hidden');
    anunciosContainer.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    registerBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    authContainer.classList.remove('hidden');

    anunciosList.innerHTML = '<div class="loading-spinner">Inicia sesión para ver anuncios</div>';
}

// Funciones de anuncios
async function loadAnuncios() {
    try {
        anunciosList.innerHTML = '<div class="loading-spinner">Cargando anuncios...</div>';

        const anunciosSnapshot = await getDocs(collection(db, "clientes"));

        if (anunciosSnapshot.empty) {
            anunciosList.innerHTML = '<p>No hay anuncios disponibles</p>';
            return;
        }

        anunciosList.innerHTML = '';

        anunciosSnapshot.forEach((doc) => {
            const anuncio = doc.data();
            const anuncioId = doc.id;

            const anuncioElement = document.createElement('div');
            anuncioElement.className = 'anuncio-card';
            anuncioElement.innerHTML = `
                <h3>${anuncio.nombre}</h3>
                <div class="anuncio-reward">Recompensa: ${anuncio.asignedTQC} P-TQC</div>
                <p>Haz clic en el enlace para ganar puntos P-TQC visitando este anuncio.</p>
                <a href="#" class="anuncio-link" data-id="${anuncioId}" data-reward="${anuncio.asignedTQC}" data-link="${anuncio.enlace}">Visitar Anuncio</a>
            `;

            anunciosList.appendChild(anuncioElement);
        });

        document.querySelectorAll('.anuncio-link').forEach(link => {
            link.addEventListener('click', handleAnuncioClick);
        });

    } catch (error) {
        console.error("Error cargando anuncios:", error);
        anunciosList.innerHTML = `<p>Error cargando anuncios: ${error.message}</p>`;
    }
}
