/**
 * ========================================
 * Sistema CRUD con Firebase Firestore
 * Aplicación Principal
 * ========================================
 * 
 * Este archivo contiene la lógica principal de la aplicación,
 * manejo del DOM y eventos de usuario.
 */

// Importar funciones CRUD
import {
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    validateProductData,
    formatPrice,
    formatDate,
    searchProducts,
    filterProductsByCategory,
    getProductStats
} from './crud-operations.js';

/**
 * ========================================
 * VARIABLES GLOBALES
 * ========================================
 */

// Estado de la aplicación
let isEditing = false;
let currentEditId = null;
let allProducts = [];
let unsubscribeProducts = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Elementos del DOM
const elements = {
    // Formulario
    form: null,
    formTitle: null,
    submitBtn: null,
    submitText: null,
    cancelBtn: null,
    
    // Campos del formulario
    nameInput: null,
    descriptionInput: null,
    priceInput: null,
    categorySelect: null,
    
    // Contenedores de productos
    loading: null,
    emptyState: null,
    productsContainer: null,
    productsTbody: null,
    
    // Toast notifications
    toastContainer: null
};

/**
 * ========================================
 * INICIALIZACIÓN DE LA APLICACIÓN
 * ========================================
 */

/**
 * Inicializar la aplicación cuando el DOM esté listo
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando aplicación CRUD...');
    
    try {
        initializeElements();
        setupEventListeners();
        startRealTimeListener();
        console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
        showToast('Error al inicializar la aplicación', 'error');
    }
});

/**
 * Inicializar elementos del DOM
 */
const initializeElements = () => {
    // Formulario
    elements.form = document.getElementById('product-form');
    elements.formTitle = document.getElementById('form-title');
    elements.submitBtn = document.getElementById('submit-btn');
    elements.submitText = document.getElementById('submit-text');
    elements.cancelBtn = document.getElementById('cancel-btn');
    
    // Campos del formulario
    elements.nameInput = document.getElementById('product-name');
    elements.descriptionInput = document.getElementById('product-description');
    elements.priceInput = document.getElementById('product-price');
    elements.categorySelect = document.getElementById('product-category');
    
    // Contenedores de productos
    elements.loading = document.getElementById('loading');
    elements.emptyState = document.getElementById('empty-state');
    elements.productsContainer = document.getElementById('products-container');
    elements.productsTbody = document.getElementById('products-tbody');
    
    // Toast container
    elements.toastContainer = document.getElementById('toast-container');
    
    // Verificar que todos los elementos existen
    const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);
    
    if (missingElements.length > 0) {
        throw new Error(`Elementos del DOM no encontrados: ${missingElements.join(', ')}`);
    }
};

/**
 * Configurar event listeners
 */
const setupEventListeners = () => {
    // Event listener para el formulario
    elements.form.addEventListener('submit', handleFormSubmit);
    
    // Event listener para el botón cancelar
    elements.cancelBtn.addEventListener('click', handleCancelEdit);
    
    // Event listeners para validación en tiempo real
    elements.nameInput.addEventListener('blur', () => validateField('name'));
    elements.descriptionInput.addEventListener('blur', () => validateField('description'));
    elements.priceInput.addEventListener('blur', () => validateField('price'));
    elements.categorySelect.addEventListener('change', () => validateField('category'));
    
    // Event listener para limpiar errores al escribir
    elements.nameInput.addEventListener('input', () => clearFieldError('name'));
    elements.descriptionInput.addEventListener('input', () => clearFieldError('description'));
    elements.priceInput.addEventListener('input', () => clearFieldError('price'));
    elements.categorySelect.addEventListener('change', () => clearFieldError('category'));
};

/**
 * Iniciar listener en tiempo real de productos
 */
const startRealTimeListener = () => {
    try {
        unsubscribeProducts = getAllProducts((products, error) => {
            if (error) {
                console.error('Error en listener de productos:', error);
                
                // Mostrar error específico según el tipo
                if (error.code === 'permission-denied') {
                    showToast('Error de permisos: Configura las reglas de Firestore', 'error');
                    showPermissionError();
                } else if (error.code === 'unavailable') {
                    showToast('Firestore no disponible: Verifica tu conexión', 'error');
                    attemptReconnect();
                } else {
                    showToast(`Error al cargar productos: ${error.message}`, 'error');
                }
                
                // Mostrar estado vacío en lugar de carga infinita
                updateLoadingState(false);
                showEmptyState();
                return;
            }
            
            allProducts = products;
            renderProducts(products);
            updateLoadingState(false);
        });
        
        console.log('👂 Listener de productos iniciado');
    } catch (error) {
        console.error('Error al iniciar listener:', error);
        showToast('Error al conectar con la base de datos', 'error');
        updateLoadingState(false);
        showEmptyState();
    }
};

/**
 * ========================================
 * MANEJO DEL FORMULARIO
 * ========================================
 */

/**
 * Manejar envío del formulario
 */
const handleFormSubmit = async (event) => {
    event.preventDefault();
    
    try {
        // Obtener datos del formulario
        const formData = getFormData();
        
        // Validar datos
        const validation = validateProductData(formData);
        if (!validation.isValid) {
            showValidationErrors(validation.errors);
            return;
        }
        
        // Mostrar estado de carga
        setSubmitButtonLoading(true);
        
        if (isEditing) {
            // Actualizar producto existente
            await updateProduct(currentEditId, formData);
            showToast('Producto actualizado exitosamente', 'success');
            exitEditMode();
        } else {
            // Crear nuevo producto
            await createProduct(formData);
            showToast('Producto creado exitosamente', 'success');
            clearForm();
        }
        
    } catch (error) {
        console.error('Error al procesar formulario:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        setSubmitButtonLoading(false);
    }
};

/**
 * Obtener datos del formulario
 */
const getFormData = () => {
    return {
        name: elements.nameInput.value,
        description: elements.descriptionInput.value,
        price: parseFloat(elements.priceInput.value),
        category: elements.categorySelect.value
    };
};

/**
 * Limpiar formulario
 */
const clearForm = () => {
    elements.form.reset();
    clearAllFieldErrors();
    exitEditMode();
};

/**
 * Cargar datos en el formulario para editar
 */
const loadForm = (product) => {
    elements.nameInput.value = product.name;
    elements.descriptionInput.value = product.description;
    elements.priceInput.value = product.price;
    elements.categorySelect.value = product.category;
    
    enterEditMode(product.id);
};

/**
 * Entrar en modo edición
 */
const enterEditMode = (productId) => {
    isEditing = true;
    currentEditId = productId;
    
    elements.formTitle.textContent = '✏️ Editar Producto';
    elements.submitText.textContent = '💾 Guardar Cambios';
    elements.cancelBtn.classList.remove('hidden');
    elements.form.classList.add('form-edit-mode');
    
    // Scroll al formulario
    elements.form.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Salir del modo edición
 */
const exitEditMode = () => {
    isEditing = false;
    currentEditId = null;
    
    elements.formTitle.textContent = '➕ Agregar Nuevo Producto';
    elements.submitText.textContent = '💾 Guardar Producto';
    elements.cancelBtn.classList.add('hidden');
    elements.form.classList.remove('form-edit-mode');
};

/**
 * Manejar cancelación de edición
 */
const handleCancelEdit = () => {
    clearForm();
    showToast('Edición cancelada', 'info');
};

/**
 * ========================================
 * RENDERIZADO DE PRODUCTOS
 * ========================================
 */

/**
 * Renderizar lista de productos
 */
const renderProducts = (products) => {
    if (!Array.isArray(products)) {
        products = [];
    }
    
    // Mostrar estado apropiado
    if (products.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    // Generar HTML de la tabla
    const tableHTML = products.map(product => createProductRow(product)).join('');
    elements.productsTbody.innerHTML = tableHTML;
    
    // Configurar event listeners para botones de acción
    setupActionButtons();
    
    // Mostrar estadísticas
    showProductStats(products);
};

/**
 * Crear fila de producto para la tabla
 */
const createProductRow = (product) => {
    const formattedPrice = formatPrice(product.price);
    const formattedDate = formatDate(product.createdAt);
    
    return `
        <tr class="table-row fade-in">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-col">
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(product.name)}</div>
                    <div class="text-sm text-gray-500 max-w-xs truncate">${escapeHtml(product.description)}</div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-green-600">${formattedPrice}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${escapeHtml(product.category)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <button 
                        class="action-btn edit" 
                        data-action="edit" 
                        data-id="${product.id}"
                        title="Editar producto"
                    >
                        ✏️
                    </button>
                    <button 
                        class="action-btn delete" 
                        data-action="delete" 
                        data-id="${product.id}"
                        title="Eliminar producto"
                    >
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `;
};

/**
 * Configurar botones de acción
 */
const setupActionButtons = () => {
    // Usar delegación de eventos para mejor rendimiento
    elements.productsTbody.addEventListener('click', (event) => {
        const button = event.target.closest('.action-btn');
        if (!button) return;
        
        const action = button.dataset.action;
        const productId = button.dataset.id;
        
        if (action === 'edit') {
            handleEditProduct(productId);
        } else if (action === 'delete') {
            handleDeleteProduct(productId);
        }
    });
};

/**
 * Manejar edición de producto
 */
const handleEditProduct = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Producto no encontrado', 'error');
        return;
    }
    
    loadForm(product);
    showToast('Modo edición activado', 'info');
};

/**
 * Manejar eliminación de producto
 */
const handleDeleteProduct = async (productId) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Producto no encontrado', 'error');
        return;
    }
    
    // Mostrar confirmación
    const confirmed = confirm(`¿Estás seguro de que quieres eliminar el producto "${product.name}"?`);
    if (!confirmed) return;
    
    try {
        await deleteProduct(productId);
        showToast('Producto eliminado exitosamente', 'success');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        showToast(`Error al eliminar: ${error.message}`, 'error');
    }
};

/**
 * ========================================
 * ESTADOS DE LA INTERFAZ
 * ========================================
 */

/**
 * Actualizar estado de carga
 */
const updateLoadingState = (isLoading) => {
    if (isLoading) {
        elements.loading.classList.remove('hidden');
        elements.emptyState.classList.add('hidden');
        elements.productsContainer.classList.add('hidden');
    } else {
        elements.loading.classList.add('hidden');
    }
};

/**
 * Mostrar estado vacío
 */
const showEmptyState = () => {
    elements.emptyState.classList.remove('hidden');
    elements.productsContainer.classList.add('hidden');
};

/**
 * Ocultar estado vacío
 */
const hideEmptyState = () => {
    elements.emptyState.classList.add('hidden');
    elements.productsContainer.classList.remove('hidden');
};

/**
 * Mostrar estadísticas de productos
 */
const showProductStats = (products) => {
    const stats = getProductStats(products);
    
    // Crear o actualizar elemento de estadísticas
    let statsElement = document.getElementById('product-stats');
    if (!statsElement) {
        statsElement = document.createElement('div');
        statsElement.id = 'product-stats';
        statsElement.className = 'mt-4 p-4 bg-gray-50 rounded-lg';
        elements.productsContainer.appendChild(statsElement);
    }
    
    statsElement.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
                <div class="text-2xl font-bold text-blue-600">${stats.total}</div>
                <div class="text-sm text-gray-600">Total Productos</div>
            </div>
            <div>
                <div class="text-2xl font-bold text-green-600">${formatPrice(stats.averagePrice)}</div>
                <div class="text-sm text-gray-600">Precio Promedio</div>
            </div>
            <div>
                <div class="text-2xl font-bold text-purple-600">${formatPrice(stats.totalValue)}</div>
                <div class="text-sm text-gray-600">Valor Total</div>
            </div>
            <div>
                <div class="text-2xl font-bold text-orange-600">${Object.keys(stats.categories).length}</div>
                <div class="text-sm text-gray-600">Categorías</div>
            </div>
        </div>
    `;
};

/**
 * ========================================
 * VALIDACIÓN DE FORMULARIO
 * ========================================
 */

/**
 * Validar campo individual
 */
const validateField = (fieldName) => {
    const formData = getFormData();
    const validation = validateProductData(formData);
    
    const fieldErrors = validation.errors.filter(error => 
        error.toLowerCase().includes(fieldName.toLowerCase())
    );
    
    if (fieldErrors.length > 0) {
        showFieldError(fieldName, fieldErrors[0]);
    } else {
        clearFieldError(fieldName);
    }
};

/**
 * Mostrar errores de validación
 */
const showValidationErrors = (errors) => {
    errors.forEach(error => {
        // Determinar qué campo tiene el error
        if (error.toLowerCase().includes('nombre')) {
            showFieldError('name', error);
        } else if (error.toLowerCase().includes('descripción')) {
            showFieldError('description', error);
        } else if (error.toLowerCase().includes('precio')) {
            showFieldError('price', error);
        } else if (error.toLowerCase().includes('categoría')) {
            showFieldError('category', error);
        }
    });
    
    showToast('Por favor corrige los errores en el formulario', 'error');
};

/**
 * Mostrar error en campo específico
 */
const showFieldError = (fieldName, errorMessage) => {
    const input = getFieldInput(fieldName);
    if (!input) return;
    
    input.classList.add('error');
    input.classList.remove('success');
    
    // Crear o actualizar mensaje de error
    let errorElement = input.parentNode.querySelector('.form-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        input.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = errorMessage;
};

/**
 * Limpiar error de campo específico
 */
const clearFieldError = (fieldName) => {
    const input = getFieldInput(fieldName);
    if (!input) return;
    
    input.classList.remove('error');
    input.classList.add('success');
    
    const errorElement = input.parentNode.querySelector('.form-error');
    if (errorElement) {
        errorElement.remove();
    }
};

/**
 * Limpiar todos los errores
 */
const clearAllFieldErrors = () => {
    ['name', 'description', 'price', 'category'].forEach(fieldName => {
        const input = getFieldInput(fieldName);
        if (input) {
            input.classList.remove('error', 'success');
            const errorElement = input.parentNode.querySelector('.form-error');
            if (errorElement) {
                errorElement.remove();
            }
        }
    });
};

/**
 * Obtener input de campo específico
 */
const getFieldInput = (fieldName) => {
    const fieldMap = {
        name: elements.nameInput,
        description: elements.descriptionInput,
        price: elements.priceInput,
        category: elements.categorySelect
    };
    
    return fieldMap[fieldName];
};

/**
 * ========================================
 * NOTIFICACIONES TOAST
 * ========================================
 */

/**
 * Mostrar notificación toast
 */
const showToast = (message, type = 'info', duration = 5000) => {
    const toast = document.createElement('div');
    toast.className = `toast ${type} px-6 py-4 rounded-lg shadow-lg max-w-sm`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <div class="flex items-center">
            <span class="text-xl mr-3">${icon}</span>
            <span class="flex-1">${escapeHtml(message)}</span>
            <button class="ml-3 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                ✕
            </button>
        </div>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto-remover después del tiempo especificado
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, duration);
};

/**
 * Obtener icono para tipo de toast
 */
const getToastIcon = (type) => {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    return icons[type] || icons.info;
};

/**
 * ========================================
 * MANEJO DE ERRORES Y RECONEXIÓN
 * ========================================
 */

/**
 * Mostrar error de permisos con instrucciones
 */
const showPermissionError = () => {
    const errorElement = document.createElement('div');
    errorElement.className = 'bg-red-50 border border-red-200 rounded-lg p-4 mb-4';
    errorElement.innerHTML = `
        <div class="flex">
            <div class="flex-shrink-0">
                <span class="text-red-400 text-xl">⚠️</span>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                    Error de Permisos de Firestore
                </h3>
                <div class="mt-2 text-sm text-red-700">
                    <p>Para solucionar este problema:</p>
                    <ol class="list-decimal list-inside mt-2 space-y-1">
                        <li>Ve a <a href="https://console.firebase.google.com/" target="_blank" class="underline">Firebase Console</a></li>
                        <li>Selecciona tu proyecto "crud-system-dd3f4"</li>
                        <li>Ve a "Firestore Database" → "Reglas"</li>
                        <li>Reemplaza las reglas con:</li>
                    </ol>
                    <pre class="mt-2 bg-red-100 p-2 rounded text-xs overflow-x-auto">
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /productos/{document} {
      allow read, write: if true;
    }
  }
}</pre>
                    <p class="mt-2">5. Haz clic en "Publicar"</p>
                </div>
            </div>
        </div>
    `;
    
    elements.productsContainer.parentNode.insertBefore(errorElement, elements.productsContainer);
};

/**
 * Intentar reconectar
 */
const attemptReconnect = () => {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        showToast(`Reintentando conexión... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, 'warning');
        
        setTimeout(() => {
            if (unsubscribeProducts) {
                unsubscribeProducts();
            }
            startRealTimeListener();
        }, 2000);
    } else {
        showToast('No se pudo conectar después de varios intentos', 'error');
    }
};

/**
 * ========================================
 * UTILIDADES
 * ========================================
 */

/**
 * Escapar HTML para prevenir XSS
 */
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * Configurar estado de carga del botón de envío
 */
const setSubmitButtonLoading = (isLoading) => {
    if (isLoading) {
        elements.submitBtn.disabled = true;
        elements.submitText.textContent = '⏳ Procesando...';
        elements.submitBtn.classList.add('opacity-75');
    } else {
        elements.submitBtn.disabled = false;
        elements.submitText.textContent = isEditing ? '💾 Guardar Cambios' : '💾 Guardar Producto';
        elements.submitBtn.classList.remove('opacity-75');
    }
};

/**
 * ========================================
 * LIMPIEZA AL SALIR
 * ========================================
 */

/**
 * Limpiar recursos al cerrar la página
 */
window.addEventListener('beforeunload', () => {
    if (unsubscribeProducts) {
        unsubscribeProducts();
        console.log('🧹 Listener de productos cancelado');
    }
});

// Exportar funciones para uso global si es necesario
window.CRUDApp = {
    clearForm,
    loadForm,
    showToast,
    getProductStats: () => getProductStats(allProducts)
};
