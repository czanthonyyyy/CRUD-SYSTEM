/**
 * ========================================
 * Sistema CRUD con Firebase Firestore
 * Operaciones CRUD
 * ========================================
 * 
 * Este archivo contiene todas las operaciones CRUD
 * para gestionar productos en Firestore.
 */

// Importar la instancia de Firestore desde la configuración
import { db, COLLECTION_NAME } from './firebase-config.js';

// Importar funciones necesarias de Firestore SDK v9+
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

/**
 * ========================================
 * OPERACIONES CRUD
 * ========================================
 */

/**
 * CREATE - Crear un nuevo producto
 * 
 * @param {Object} productData - Datos del producto a crear
 * @param {string} productData.name - Nombre del producto
 * @param {string} productData.description - Descripción del producto
 * @param {number} productData.price - Precio del producto
 * @param {string} productData.category - Categoría del producto
 * @returns {Promise<string>} - ID del documento creado
 */
export const createProduct = async (productData) => {
    try {
        // Validar datos de entrada
        if (!productData || typeof productData !== 'object') {
            throw new Error('Los datos del producto son requeridos');
        }

        const { name, description, price, category } = productData;

        // Validaciones específicas
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('El nombre del producto es requerido');
        }

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            throw new Error('La descripción del producto es requerida');
        }

        if (typeof price !== 'number' || price < 0) {
            throw new Error('El precio debe ser un número válido mayor o igual a 0');
        }

        if (!category || typeof category !== 'string' || category.trim().length === 0) {
            throw new Error('La categoría del producto es requerida');
        }

        // Preparar datos para Firestore
        const productToSave = {
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price),
            category: category.trim(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Agregar documento a la colección
        const docRef = await addDoc(collection(db, COLLECTION_NAME), productToSave);
        
        console.log('✅ Producto creado exitosamente:', docRef.id);
        return docRef.id;

    } catch (error) {
        console.error('❌ Error al crear producto:', error);
        throw error;
    }
};

/**
 * READ - Obtener todos los productos con listener en tiempo real
 * 
 * @param {Function} callback - Función callback que se ejecuta cuando cambian los datos
 * @returns {Function} - Función para cancelar el listener
 */
export const getAllProducts = (callback) => {
    try {
        // Crear query ordenada por fecha de creación (más recientes primero)
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc')
        );

        // Configurar listener en tiempo real
        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const products = [];
                snapshot.forEach((doc) => {
                    products.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                console.log('📦 Productos obtenidos:', products.length);
                callback(products);
            },
            (error) => {
                console.error('❌ Error en listener de productos:', error);
                callback([], error);
            }
        );

        return unsubscribe;

    } catch (error) {
        console.error('❌ Error al configurar listener de productos:', error);
        throw error;
    }
};

/**
 * READ - Obtener todos los productos (una sola vez)
 * 
 * @returns {Promise<Array>} - Array de productos
 */
export const getProductsOnce = async () => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const products = [];

        snapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('📦 Productos obtenidos (una vez):', products.length);
        return products;

    } catch (error) {
        console.error('❌ Error al obtener productos:', error);
        throw error;
    }
};

/**
 * UPDATE - Actualizar un producto existente
 * 
 * @param {string} productId - ID del producto a actualizar
 * @param {Object} productData - Nuevos datos del producto
 * @returns {Promise<void>}
 */
export const updateProduct = async (productId, productData) => {
    try {
        // Validar ID del producto
        if (!productId || typeof productId !== 'string') {
            throw new Error('El ID del producto es requerido');
        }

        // Validar datos de entrada
        if (!productData || typeof productData !== 'object') {
            throw new Error('Los datos del producto son requeridos');
        }

        const { name, description, price, category } = productData;

        // Validaciones específicas
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            throw new Error('El nombre del producto es requerido');
        }

        if (!description || typeof description !== 'string' || description.trim().length === 0) {
            throw new Error('La descripción del producto es requerida');
        }

        if (typeof price !== 'number' || price < 0) {
            throw new Error('El precio debe ser un número válido mayor o igual a 0');
        }

        if (!category || typeof category !== 'string' || category.trim().length === 0) {
            throw new Error('La categoría del producto es requerida');
        }

        // Preparar datos para actualización
        const updateData = {
            name: name.trim(),
            description: description.trim(),
            price: parseFloat(price),
            category: category.trim(),
            updatedAt: serverTimestamp()
        };

        // Actualizar documento
        const productRef = doc(db, COLLECTION_NAME, productId);
        await updateDoc(productRef, updateData);

        console.log('✅ Producto actualizado exitosamente:', productId);

    } catch (error) {
        console.error('❌ Error al actualizar producto:', error);
        throw error;
    }
};

/**
 * DELETE - Eliminar un producto
 * 
 * @param {string} productId - ID del producto a eliminar
 * @returns {Promise<void>}
 */
export const deleteProduct = async (productId) => {
    try {
        // Validar ID del producto
        if (!productId || typeof productId !== 'string') {
            throw new Error('El ID del producto es requerido');
        }

        // Eliminar documento
        const productRef = doc(db, COLLECTION_NAME, productId);
        await deleteDoc(productRef);

        console.log('✅ Producto eliminado exitosamente:', productId);

    } catch (error) {
        console.error('❌ Error al eliminar producto:', error);
        throw error;
    }
};

/**
 * ========================================
 * FUNCIONES DE UTILIDAD
 * ========================================
 */

/**
 * Validar datos de producto
 * 
 * @param {Object} productData - Datos del producto a validar
 * @returns {Object} - Objeto con isValid y errors
 */
export const validateProductData = (productData) => {
    const errors = [];

    if (!productData || typeof productData !== 'object') {
        errors.push('Los datos del producto son requeridos');
        return { isValid: false, errors };
    }

    const { name, description, price, category } = productData;

    // Validar nombre
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('El nombre del producto es requerido');
    } else if (name.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres');
    } else if (name.trim().length > 100) {
        errors.push('El nombre no puede exceder 100 caracteres');
    }

    // Validar descripción
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        errors.push('La descripción del producto es requerida');
    } else if (description.trim().length < 10) {
        errors.push('La descripción debe tener al menos 10 caracteres');
    } else if (description.trim().length > 500) {
        errors.push('La descripción no puede exceder 500 caracteres');
    }

    // Validar precio
    if (typeof price !== 'number' || isNaN(price)) {
        errors.push('El precio debe ser un número válido');
    } else if (price < 0) {
        errors.push('El precio no puede ser negativo');
    } else if (price > 999999.99) {
        errors.push('El precio no puede exceder $999,999.99');
    }

    // Validar categoría
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
        errors.push('La categoría del producto es requerida');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Formatear precio para mostrar
 * 
 * @param {number} price - Precio a formatear
 * @returns {string} - Precio formateado
 */
export const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
        return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
};

/**
 * Formatear fecha para mostrar
 * 
 * @param {Object} timestamp - Timestamp de Firestore
 * @returns {string} - Fecha formateada
 */
export const formatDate = (timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    
    try {
        // Si es un timestamp de Firestore
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Si es una fecha normal
        if (timestamp instanceof Date) {
            return timestamp.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return 'Fecha no disponible';
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return 'Fecha no disponible';
    }
};

/**
 * Buscar productos por texto
 * 
 * @param {string} searchText - Texto a buscar
 * @param {Array} products - Array de productos donde buscar
 * @returns {Array} - Productos que coinciden con la búsqueda
 */
export const searchProducts = (searchText, products) => {
    if (!searchText || typeof searchText !== 'string') {
        return products;
    }

    const searchLower = searchText.toLowerCase().trim();
    
    return products.filter(product => {
        return (
            product.name.toLowerCase().includes(searchLower) ||
            product.description.toLowerCase().includes(searchLower) ||
            product.category.toLowerCase().includes(searchLower)
        );
    });
};

/**
 * Filtrar productos por categoría
 * 
 * @param {string} category - Categoría a filtrar
 * @param {Array} products - Array de productos donde filtrar
 * @returns {Array} - Productos de la categoría especificada
 */
export const filterProductsByCategory = (category, products) => {
    if (!category || typeof category !== 'string') {
        return products;
    }

    return products.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
    );
};

/**
 * Obtener estadísticas de productos
 * 
 * @param {Array} products - Array de productos
 * @returns {Object} - Estadísticas de los productos
 */
export const getProductStats = (products) => {
    if (!Array.isArray(products)) {
        return {
            total: 0,
            averagePrice: 0,
            categories: {},
            totalValue: 0
        };
    }

    const stats = {
        total: products.length,
        averagePrice: 0,
        categories: {},
        totalValue: 0
    };

    if (products.length === 0) {
        return stats;
    }

    let totalPrice = 0;
    let totalValue = 0;

    products.forEach(product => {
        // Calcular precio promedio
        totalPrice += product.price;
        totalValue += product.price;

        // Contar categorías
        if (stats.categories[product.category]) {
            stats.categories[product.category]++;
        } else {
            stats.categories[product.category] = 1;
        }
    });

    stats.averagePrice = totalPrice / products.length;
    stats.totalValue = totalValue;

    return stats;
};
