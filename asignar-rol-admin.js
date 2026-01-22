// Script para asignar rol ADMIN a un usuario
// Ejecutar con: node asignar-rol-admin.js

const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./padondeloschamos-464be-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// UID del usuario al que quieres asignar rol ADMIN
const userUID = 'mLLg4XKBWoVVrSNUcIuwt01PXds1'; // Reemplaza con el UID de tu usuario

async function asignarRolAdmin() {
  try {
    // Asignar custom claim
    await admin.auth().setCustomUserClaims(userUID, { rol: 'ADMIN' });
    
    // Actualizar Firestore
    await admin.firestore().collection('usuarios').doc(userUID).update({
      rol: 'ADMIN',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Rol ADMIN asignado correctamente');
    console.log('El usuario debe cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

asignarRolAdmin();
