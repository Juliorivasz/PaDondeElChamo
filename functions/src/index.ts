import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function para crear un nuevo usuario
 * Solo puede ser llamada por usuarios con rol ADMIN
 * Evita el problema de cerrar sesión del admin al crear usuarios
 */
export const crearNuevoUsuario = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Debes estar autenticado para crear usuarios'
    );
  }

  // Verificar que sea ADMIN
  const userDoc = await admin.firestore()
    .collection('usuarios')
    .doc(context.auth.uid)
    .get();
  
  if (!userDoc.exists || userDoc.data()?.rol !== 'ADMIN') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo los administradores pueden crear usuarios'
    );
  }

  const { nombre, email, password, rol } = data;

  // Validar datos
  if (!nombre || !email || !password || !rol) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Faltan datos obligatorios: nombre, email, password, rol'
    );
  }

  if (password.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'La contraseña debe tener al menos 6 caracteres'
    );
  }

  if (rol !== 'ADMIN' && rol !== 'EMPLEADO') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Rol inválido. Debe ser ADMIN o EMPLEADO'
    );
  }

  try {
    // Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre,
    });

    // Crear documento en Firestore
    await admin.firestore()
      .collection('usuarios')
      .doc(userRecord.uid)
      .set({
        nombre,
        email,
        rol,
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Asignar custom claims para el rol
    await admin.auth().setCustomUserClaims(userRecord.uid, { rol });

    console.log(`Usuario creado exitosamente: ${userRecord.uid} por ${context.auth.uid}`);

    return {
      success: true,
      userId: userRecord.uid,
      message: 'Usuario creado exitosamente',
    };
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError(
        'already-exists',
        'El email ya está en uso'
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      `Error al crear el usuario: ${error.message}`
    );
  }
});

/**
 * Cloud Function to set custom claims (roles) for users
 * Only callable by ADMIN users
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuario no autenticado'
    );
  }

  // Check if caller is ADMIN
  const callerDoc = await admin
    .firestore()
    .collection('usuarios')
    .doc(context.auth.uid)
    .get();

  if (!callerDoc.exists || callerDoc.data()?.rol !== 'ADMIN') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Solo administradores pueden asignar roles'
    );
  }

  const { uid, rol } = data;

  if (!uid || !rol) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'UID y rol son requeridos'
    );
  }

  if (rol !== 'ADMIN' && rol !== 'EMPLEADO') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Rol inválido. Debe ser ADMIN o EMPLEADO'
    );
  }

  try {
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { rol });

    // Update Firestore document
    await admin.firestore().collection('usuarios').doc(uid).update({
      rol,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Rol asignado correctamente' };
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new functions.https.HttpsError('internal', 'Error al asignar rol');
  }
});

/**
 * Trigger when a new user is created in Authentication
 * Automatically creates a Firestore document and sets default role
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    // Create user document in Firestore
    await admin.firestore().collection('usuarios').doc(user.uid).set({
      nombre: user.displayName || 'Usuario',
      email: user.email,
      rol: 'EMPLEADO', // Default role
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Set default custom claims
    await admin.auth().setCustomUserClaims(user.uid, { rol: 'EMPLEADO' });

    console.log(`User ${user.uid} created successfully`);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});

/**
 * Trigger when a user is deleted from Authentication
 * Removes the corresponding Firestore document
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  try {
    await admin.firestore().collection('usuarios').doc(user.uid).delete();
    console.log(`User ${user.uid} deleted successfully`);
  } catch (error) {
    console.error('Error deleting user document:', error);
  }
});

/**
 * Cloud Function to validate and process sales
 * This can be used for additional business logic validation
 */
export const procesarVenta = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuario no autenticado'
    );
  }

  const { detalles, tipoDescuento, descuento, porcentajeAplicado, metodoDePago } = data;

  // Validate data
  if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Detalles de venta requeridos'
    );
  }

  try {
    // Additional business logic can be added here
    // For example: applying category discounts, validating stock, etc.
    
    return {
      success: true,
      message: 'Venta procesada correctamente',
    };
  } catch (error) {
    console.error('Error processing sale:', error);
    throw new functions.https.HttpsError('internal', 'Error al procesar venta');
  }
});

/**
 * Scheduled function to generate daily reports
 * Runs every day at midnight
 */
export const generarReporteDiario = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/Argentina/Buenos_Aires')
  .onRun(async (context) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's sales
      const ventasSnapshot = await admin
        .firestore()
        .collection('ventas')
        .where('fechaHora', '>=', today)
        .where('fechaHora', '<', tomorrow)
        .get();

      const totalVentas = ventasSnapshot.size;
      const totalMonto = ventasSnapshot.docs.reduce(
        (sum, doc) => sum + (doc.data().total || 0),
        0
      );

      // Store report in Firestore
      await admin.firestore().collection('reportes').add({
        fecha: today,
        totalVentas,
        totalMonto,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Daily report generated: ${totalVentas} sales, $${totalMonto}`);
    } catch (error) {
      console.error('Error generating daily report:', error);
    }
  });

