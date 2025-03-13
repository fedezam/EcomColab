// Configuración de Firebase - Reemplazar con tus credenciales
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "tu-messaging-sender-id",
    appId: "tu-app-id"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
const authButtons = document.getElementById('auth-buttons');
const backLogin = document.getElementById('back-login');
const backRegister = document.getElementById('back-register');

// Estado global
let currentUser = null;
let userDocRef = null;
let userUnsubscribe = null;

// Event Listeners
loginBtn.addEventListener('click', () => {
    showLoginForm();
});

registerBtn.addEventListener('click', () => {
    showRegisterForm();
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

backLogin.addEventListener('click', () => {
    loginForm.classList.add('hidden');
});

backRegister.addEventListener('click', () => {
    registerForm.classList.add('hidden');
});

loginFormElements.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    loginUser(email, password);
});

registerFormElements.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    registerUser(name, email, password);
});

// Escuchar cambios en el estado de autenticación
auth.onAuthStateChanged(async (user) => {
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
        await auth.signInWithEmailAndPassword(email, password);
        loginForm.classList.add('hidden');
        showNotification('Inicio de sesión exitoso', 'success');
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    }
}

async function registerUser(name, email, password) {
    try {
        // Crear usuario en Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Crear documento de usuario en Firestore
        await db.collection('usuarios').doc(user.uid).set({
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
    
    // Ocultar la notificación después de 3 segundos
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Manejo de usuario autenticado
async function handleUserLoggedIn(user) {
    // Actualizar UI para usuario autenticado
    userInfo.classList.remove('hidden');
    anunciosContainer.classList.remove('hidden');
    authContainer.classList.add('hidden');
    loginBtn.classList.add('hidden');
    registerBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    
    // Configurar referencia a documento de usuario
    userDocRef = db.collection('usuarios').doc(user.uid);
    
    // Escuchar cambios en el documento de usuario
    userUnsubscribe = userDocRef.onSnapshot((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            userName.textContent = userData.nombre;
            userTqc.textContent = userData.tqc;
        } else {
            // Si el documento no existe, crearlo
            userDocRef.set({
                nombre: user.displayName || 'Usuario',
                email: user.email,
                tqc: 0
            });
        }
    }, (error) => {
        console.error("Error escuchando cambios en el documento de usuario:", error);
    });
    
    // Cargar anuncios
    loadAnuncios();
}

function handleUserLoggedOut() {
    // Limpiar el estado
    if (userUnsubscribe) {
        userUnsubscribe();
        userUnsubscribe = null;
    }
    currentUser = null;
    userDocRef = null;
    
    // Actualizar UI para usuario no autenticado
    userInfo.classList.add('hidden');
    anunciosContainer.classList.add('hidden');
    loginBtn.classList.remove('hidden');
    registerBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    authContainer.classList.remove('hidden');
    
    // Limpiar anuncios
    anunciosList.innerHTML = '<div class="loading-spinner">Inicia sesión para ver anuncios</div>';
}

// Funciones de anuncios
async function loadAnuncios() {
    try {
        anunciosList.innerHTML = '<div class="loading-spinner">Cargando anuncios...</div>';
        
        const anunciosSnapshot = await db.collection('clientes').get();
        
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
        
        // Agregar event listeners a los enlaces de anuncios
        document.querySelectorAll('.anuncio-link').forEach(link => {
            link.addEventListener('click', handleAnuncioClick);
        });
        
    } catch (error) {
        console.error("Error cargando anuncios:", error);
        anunciosList.innerHTML = `<p>Error cargando anuncios: ${error.message}</p>`;
    }
}

async function handleAnuncioClick(e) {
    e.preventDefault();
    
    const anuncioId = e.target.dataset.id;
    const reward = parseInt(e.target.dataset.reward);
    const link = e.target.dataset.link;
    
    if (!currentUser) {
        showNotification('Debes iniciar sesión para ganar puntos', 'error');
        return;
    }
    
    try {
        // Actualizar los puntos del usuario en Firestore
        await userDocRef.update({
            tqc: firebase.firestore.FieldValue.increment(reward)
        });
        
        showNotification(`¡Has ganado ${reward} P-TQC!`, 'success');
        
        // Abrir el enlace del anuncio en una nueva pestaña
        window.open(link, '_blank');
        
    } catch (error) {
        console.error("Error al actualizar puntos:", error);
        showNotification(`Error al actualizar puntos: ${error.message}`, 'error');
    }
}
