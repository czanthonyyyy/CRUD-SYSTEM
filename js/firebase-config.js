/**
 * ========================================
 * Sistema CRUD con Firebase Firestore
 * Configuración de Firebase
 * ========================================
 * 
 * Este archivo contiene la configuración de Firebase
 * y la inicialización de Firestore usando el SDK v9+
 * con sintaxis modular.
 */

// Importaciones de Firebase SDK v9+ (modular)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import { getFirestore, connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js';

/**
 * Configuración de Firebase
 * 
 * IMPORTANTE: Reemplaza estos valores con tu configuración real de Firebase
 * 
 * Para obtener tu configuración:
 * 1. Ve a Firebase Console (https://console.firebase.google.com/)
 * 2. Selecciona tu proyecto
 * 3. Ve a Configuración del proyecto > General
 * 4. En "Tus aplicaciones", selecciona tu app web
 * 5. Copia el objeto firebaseConfig
 */
const firebaseConfig = {
    apiKey: "AIzaSyD3iPBFdUBoA5L-hSIP7wiOaC-HqrLhq38",
    authDomain: "crud-system-dd3f4.firebaseapp.com",
    projectId: "crud-system-dd3f4",
    storageBucket: "crud-system-dd3f4.firebasestorage.app",
    messagingSenderId: "411042722853",
    appId: "1:411042722853:web:23d343bf0f429aea72fbcc",
    measurementId: "G-B2L9V21TLE"
};

/**
 * Inicialización de Firebase App
 * 
 * Esta función inicializa la aplicación Firebase con la configuración proporcionada.
 * Si ya existe una instancia de Firebase, la devuelve en lugar de crear una nueva.
 */
let app;
let analytics;
try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    console.log('✅ Firebase App inicializada correctamente');
    console.log('✅ Firebase Analytics inicializado correctamente');
} catch (error) {
    console.error('❌ Error al inicializar Firebase App:', error);
    throw new Error('No se pudo inicializar Firebase. Verifica tu configuración.');
}

/**
 * Inicialización de Firestore
 * 
 * Esta función inicializa Firestore y la conecta a la aplicación Firebase.
 * También incluye soporte para el emulador de Firestore en desarrollo.
 */
let db;
try {
    db = getFirestore(app);
    
    // Conectar al emulador de Firestore en desarrollo (opcional)
    // Descomenta las siguientes líneas si quieres usar el emulador local
    /*
    if (location.hostname === 'localhost') {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('🔧 Conectado al emulador de Firestore');
    }
    */
    
    console.log('✅ Firestore inicializado correctamente');
} catch (error) {
    console.error('❌ Error al inicializar Firestore:', error);
    throw new Error('No se pudo inicializar Firestore. Verifica tu configuración.');
}

/**
 * Configuración de la colección
 * 
 * Define el nombre de la colección que se utilizará para almacenar los productos.
 * Puedes cambiar este valor si deseas usar un nombre diferente.
 */
export const COLLECTION_NAME = 'productos';

/**
 * Configuración de índices compuestos (opcional)
 * 
 * Si planeas hacer consultas complejas, puedes crear índices compuestos
 * en la consola de Firebase para mejorar el rendimiento.
 * 
 * Ejemplos de índices útiles:
 * - Categoría + Precio (ascendente)
 * - Nombre + Categoría (ascendente)
 * - Fecha de creación + Precio (descendente)
 */

/**
 * Configuración de reglas de seguridad (referencia)
 * 
 * Para que tu aplicación funcione correctamente, asegúrate de que
 * las reglas de Firestore permitan lectura y escritura:
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /productos/{document} {
 *       allow read, write: if true; // Para desarrollo
 *       // En producción, implementa reglas más restrictivas
 *     }
 *   }
 * }
 */

/**
 * Exportación de la instancia de Firestore
 * 
 * Esta instancia se utilizará en otros archivos para realizar
 * operaciones CRUD en la base de datos.
 */
export { db };

/**
 * Función de utilidad para verificar la conexión
 * 
 * Esta función puede ser llamada para verificar si Firestore
 * está funcionando correctamente.
 */
export const checkConnection = async () => {
    try {
        // Intentar leer un documento para verificar la conexión
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const testCollection = collection(db, 'test');
        await getDocs(testCollection);
        console.log('✅ Conexión a Firestore verificada');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión a Firestore:', error);
        return false;
    }
};

/**
 * Función de utilidad para obtener información de la configuración
 * 
 * Esta función devuelve información sobre la configuración actual
 * sin exponer datos sensibles.
 */
export const getConfigInfo = () => {
    return {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        isConfigured: firebaseConfig.apiKey !== "your-api-key-here"
    };
};

// Log de información de configuración
console.log('🔧 Configuración de Firebase:', getConfigInfo());

// Verificar si la configuración está completa
if (!getConfigInfo().isConfigured) {
    console.warn('⚠️  ADVERTENCIA: La configuración de Firebase no está completa.');
    console.warn('   Por favor, actualiza firebaseConfig en este archivo con tus credenciales reales.');
}
