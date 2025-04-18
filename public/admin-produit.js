// Variables globales
let products = [];
let currentProductId = null;

// Éléments DOM
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const closeSidebarBtn = document.getElementById('close-sidebar');
const productsTableBody = document.getElementById('products-table-body');
const noProductsMessage = document.getElementById('no-products-message');
const loadingIndicator = document.getElementById('loading-indicator');
const adminUsername = document.getElementById('admin-username');
const logoutItem = document.getElementById('logout-item');

// Modal produit
const productModal = document.getElementById('product-modal');
const productModalTitle = document.getElementById('product-modal-title');
const closeProductModalBtn = document.getElementById('close-product-modal');
const productForm = document.getElementById('product-form');
const productId = document.getElementById('product-id');
const productName = document.getElementById('product-name');
const productCategory = document.getElementById('product-category');
const productStock = document.getElementById('product-stock');
const productDescription = document.getElementById('product-description');
const productVideo = document.getElementById('product-video');
const priceOptionsContainer = document.getElementById('price-options-container');
const addPriceOptionBtn = document.getElementById('add-price-option');
const productThc = document.getElementById('product-thc');
const productGif = document.getElementById('product-gif');  
const thcValue = document.getElementById('thc-value');
const cancelProductBtn = document.getElementById('cancel-product-btn');
const saveProductBtn = document.getElementById('save-product-btn');
const addProductBtn = document.getElementById('add-product-btn');

// Dialog de confirmation
const confirmDialog = document.getElementById('confirm-dialog');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Notification
const notification = document.getElementById('notification');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier l'authentification
    checkAuthentication();
    
    // Charger les produits
    loadProducts();
    
    // Ajouter les écouteurs d'événements
    setupEventListeners();
});

// Vérification de l'authentification
function checkAuthentication() {
    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                window.location.href = '/login.html';
                return;
            }
            
            // Vérifier si l'utilisateur est un admin
            if (data.user.role !== 'admin') {
                window.location.href = '/dashboard';
                return;
            }
            
            // Afficher le nom d'utilisateur
            adminUsername.textContent = data.user.username;
        })
        .catch(error => {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            window.location.href = '/login.html';
        });
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Sidebar toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
    });
    
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
    
    // Logout
    logoutItem.addEventListener('click', () => {
        window.location.href = '/api/auth/logout';
    });
    
    // Modal produit
    addProductBtn.addEventListener('click', openAddProductModal);
    closeProductModalBtn.addEventListener('click', closeProductModal);
    cancelProductBtn.addEventListener('click', closeProductModal);
    productForm.addEventListener('submit', saveProduct);
    
    // Prix options
    addPriceOptionBtn.addEventListener('click', addPriceOption);
    
    // THC slider
    productThc.addEventListener('input', updateThcValue);
    
    // Dialog de confirmation
    cancelDeleteBtn.addEventListener('click', closeConfirmDialog);
    confirmDeleteBtn.addEventListener('click', deleteProduct);
}

// Mise à jour de la valeur THC affichée
function updateThcValue() {
    thcValue.textContent = `${productThc.value}%`;
}

// Ajout d'une option de prix
function addPriceOption(event, quantity = '', price = '') {
    const priceOption = document.createElement('div');
    priceOption.className = 'price-option';
    
    priceOption.innerHTML = `
        <input type="number" class="form-control price-quantity" placeholder="Quantité (g)" min="0.1" step="0.1" required value="${quantity}">
        <input type="number" class="form-control price-value" placeholder="Prix (€)" min="0.1" step="0.1" required value="${price}">
        <button type="button" class="price-option-delete">×</button>
    `;
    
    priceOptionsContainer.appendChild(priceOption);
    
    // Ajouter un écouteur d'événement pour le bouton de suppression
    const deleteButton = priceOption.querySelector('.price-option-delete');
    deleteButton.addEventListener('click', () => {
        // Ne pas supprimer s'il n'y a qu'une seule option de prix
        if (priceOptionsContainer.children.length > 1) {
            priceOption.remove();
        } else {
            showNotification('Vous devez avoir au moins une option de prix', 'error');
        }
    });
}


// Chargement des produits depuis la base de données
function loadProducts() {
    // Afficher l'indicateur de chargement
    productsTableBody.innerHTML = '';
    noProductsMessage.style.display = 'none';
    loadingIndicator.style.display = 'block';
    
    // Récupérer les produits depuis l'API
    fetch('/api/products')
        .then(response => response.json())
        .then(data => {
            loadingIndicator.style.display = 'none';
            
            if (!data.success) {
                console.error('Erreur lors du chargement des produits:', data.message);
                noProductsMessage.style.display = 'block';
                return;
            }
            
            products = data.products;
            
            if (products.length === 0) {
                noProductsMessage.style.display = 'block';
                return;
            }
            
            // Afficher les produits
            displayProducts();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des produits:', error);
            loadingIndicator.style.display = 'none';
            noProductsMessage.style.display = 'block';
        });
}

// Affichage des produits
function displayProducts() {
    productsTableBody.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        
        // Prix minimum pour affichage dans le tableau
        let minPrice = Infinity;
        product.priceOptions.forEach(option => {
            if (option.price < minPrice) {
                minPrice = option.price;
            }
        });
        
        // Formater le prix minimum
        const formattedMinPrice = minPrice !== Infinity ? `${minPrice.toFixed(2)} €` : 'N/A';
        
        // Afficher le chemin de la vidéo et du GIF dans le tableau
        row.innerHTML = `
            <td>${product.name}</td>
            <td><span class="category-badge category-${product.category}">${product.category}</span></td>
            <td>${truncateText(product.description, 50)}</td>
            <td>À partir de ${formattedMinPrice}/g</td>
            <td>${product.thcContent}%</td>
            <td><span class="stock-badge stock-${product.inStock}">${product.inStock ? 'En stock' : 'Épuisé'}</span></td>
            <td class="table-actions">
                <button class="action-button edit-button" data-id="${product._id}">Modifier</button>
                <button class="action-button delete-button" data-id="${product._id}">Supprimer</button>
            </td>
        `;
        
        productsTableBody.appendChild(row);
    });
    
    // Ajouter les écouteurs d'événements pour les boutons d'action
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', () => openEditProductModal(button.dataset.id));
    });
    
    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', () => openConfirmDialog(button.dataset.id));
    });
}

// Tronquer le texte
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}


// Ouverture du modal d'ajout de produit
function openAddProductModal() {
    // Réinitialiser le formulaire
    productForm.reset();
    productId.value = '';
    currentProductId = null;
    
    // Nettoyer les options de prix
    priceOptionsContainer.innerHTML = '';
    addDefaultPriceOption();
    
    // Réinitialiser le slider THC
    productThc.value = 20;
    updateThcValue();
    
    // Réinitialiser les champs de vidéo et GIF
    productVideo.value = 'video/default.mp4';
    if (productGif) {
        productGif.value = 'images/default-product.gif';
    }
    
    // Changer le titre du modal
    productModalTitle.textContent = 'Ajouter un produit';
    
    // Ouvrir le modal
    productModal.classList.add('active');
}

// Fermeture du modal de produit
function closeProductModal() {
    productModal.classList.remove('active');
}

// Ajout d'une option de prix par défaut
function addDefaultPriceOption() {
    addPriceOption(null, 1, 10);
}
// Ouverture du modal de modification de produit
function openEditProductModal(id) {
    currentProductId = id;
    
    // Trouver le produit correspondant
    const product = products.find(p => p._id === id);
    
    if (!product) {
        console.error('Produit non trouvé:', id);
        return;
    }
    
    // Remplir le formulaire avec les données du produit
    productId.value = product._id;
    productName.value = product.name;
    productCategory.value = product.category;
    productStock.value = product.inStock.toString();
    productDescription.value = product.description;
    
    // Utiliser videoPath au lieu de videoUrl
    productVideo.value = product.videoPath || product.videoUrl || '';
    
    // Ajout d'un champ pour le chemin du GIF si l'élément existe
    if (productGif) {
        productGif.value = product.gifPath || '';
    }
    
    productThc.value = product.thcContent;
    updateThcValue();
    
    // Ajouter les options de prix
    priceOptionsContainer.innerHTML = '';
    if (product.priceOptions && product.priceOptions.length > 0) {
        product.priceOptions.forEach(option => {
            addPriceOption(null, option.quantity, option.price);
        });
    } else {
        addDefaultPriceOption();
    }
    
    // Changer le titre du modal
    productModalTitle.textContent = 'Modifier le produit';
    
    // Ouvrir le modal
    productModal.classList.add('active');
}

// Mise à jour de la fonction saveProduct pour prendre en compte les nouveaux champs
function saveProduct(e) {
    e.preventDefault();
    
    // Récupérer les options de prix
    const priceOptions = [];
    const quantityInputs = document.querySelectorAll('.price-quantity');
    const priceInputs = document.querySelectorAll('.price-value');
    
    for (let i = 0; i < quantityInputs.length; i++) {
        const quantity = parseFloat(quantityInputs[i].value);
        const price = parseFloat(priceInputs[i].value);
        
        if (isNaN(quantity) || isNaN(price)) {
            showNotification('Veuillez entrer des valeurs numériques valides pour toutes les options de prix', 'error');
            return;
        }
        
        priceOptions.push({
            quantity,
            price
        });
    }
    
    // Construire l'objet produit avec les nouveaux champs
    const productData = {
        name: productName.value,
        description: productDescription.value,
        category: productCategory.value,
        priceOptions: priceOptions,
        thcContent: parseFloat(productThc.value),
        videoPath: productVideo.value, // Utiliser videoPath au lieu de videoUrl
        gifPath: productGif ? productGif.value : 'images/default-product.gif', // Ajouter le chemin du GIF
        inStock: productStock.value === 'true'
    };
    
    // Déterminer si c'est une création ou une mise à jour
    const isEdit = currentProductId !== null;
    
    // URL et méthode en fonction de l'action
    const url = isEdit ? `/api/products/${currentProductId}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';
    
    // Envoyer la requête
    saveProductBtn.disabled = true;
    saveProductBtn.textContent = 'Enregistrement...';
    
    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Mise à jour de la liste des produits
            if (isEdit) {
                const index = products.findIndex(p => p._id === currentProductId);
                if (index !== -1) {
                    products[index] = data.product;
                }
                showNotification('Produit mis à jour avec succès', 'success');
            } else {
                products.push(data.product);
                showNotification('Produit ajouté avec succès', 'success');
            }
            
            // Fermer le modal et rafraîchir l'affichage
            closeProductModal();
            displayProducts();
        } else {
            console.error('Erreur lors de la sauvegarde du produit:', data.message);
            showNotification(data.message || 'Erreur lors de la sauvegarde du produit', 'error');
        }
    })
    .catch(error => {
        console.error('Erreur lors de la sauvegarde du produit:', error);
        showNotification('Erreur lors de la sauvegarde du produit', 'error');
    })
    .finally(() => {
        saveProductBtn.disabled = false;
        saveProductBtn.textContent = 'Enregistrer';
    });
}

// Ouverture du dialog de confirmation de suppression
function openConfirmDialog(id) {
    currentProductId = id;
    confirmDialog.classList.add('active');
}

// Fermeture du dialog de confirmation
function closeConfirmDialog() {
    confirmDialog.classList.remove('active');
}

// Suppression d'un produit
function deleteProduct() {
    if (!currentProductId) return;
    
    // Désactiver le bouton pendant la suppression
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Suppression...';
    
    fetch(`/api/products/${currentProductId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Mettre à jour la liste des produits
            products = products.filter(p => p._id !== currentProductId);
            displayProducts();
            
            // Si plus de produits, afficher le message
            if (products.length === 0) {
                noProductsMessage.style.display = 'block';
            }
            
            showNotification('Produit supprimé avec succès', 'success');
        } else {
            console.error('Erreur lors de la suppression du produit:', data.message);
            showNotification(data.message || 'Erreur lors de la suppression du produit', 'error');
        }
    })
    .catch(error => {
        console.error('Erreur lors de la suppression du produit:', error);
        showNotification('Erreur lors de la suppression du produit', 'error');
    })
    .finally(() => {
        closeConfirmDialog();
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.textContent = 'Supprimer';
    });
}
// Affichage d'une notification
function showNotification(message, type) {
    notification.textContent = message;
    notification.className = 'notification';
    notification.classList.add(type);
    notification.classList.add('active');
    
    // Faire disparaître la notification après 3 secondes
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}
