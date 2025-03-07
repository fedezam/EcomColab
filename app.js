// app.js
import { auth, db } from './firebase-config.js';

// Elementos del DOM
const registerBtn = document.getElementById('registerBtn');
const googleBtn = document.getElementById('googleBtn');
const loginBtn = document.getElementById('loginBtn');
const registerModal = document.getElementById('registerModal');
const closeModal = document.getElementById('closeModal');
const submitRegister = document.getElementById('submitRegister');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const closeToast = document.getElementById('closeToast'); // Botón para cerrar notificación

// Verificar autenticación y redirigir si es necesario
auth.onAuthStateChanged(user => {
  if (user) {
    window.location.href = '/dashboard';
  }
});

// Mostrar notificaciones
function showToast(message, isError = false) {
  toastMessage.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.toggle('bg-green-500', !isError);
  toast.classList.toggle('bg-red-500', isError);
}

// Cerrar notificación manualmente
closeToast.addEventListener('click', () => {
  toast.classList.add('hidden');
});

// Abrir y cerrar modal de registro
registerBtn.addEventListener('click', () => registerModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => registerModal.classList.add('hidden'));

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', (e) => {
  if (e.target === registerModal) {
    registerModal.classList.add('hidden');
  }
});

// Registro manual
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
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Guardar datos en Firestore
    await db.collection('usuarios').doc(user.uid).set({
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
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const user = result.user;

    // Guardar datos en Firestore si es un nuevo usuario
    const userDoc = await db.collection('usuarios').doc(user.uid).get();
    if (!userDoc.exists) {
      await db.collection('usuarios').doc(user.uid).set({
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
