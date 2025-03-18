// Script principal pour le dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentUser = null;
    let userOrders = [];
    let products = [];

    // Afficher le nom d'utilisateur
    function displayUsername() {
        const profileButton = document.getElementById('profile-button');
        if (profileButton && currentUser) {
            profileButton.innerHTML = `<div class="profile-icon">👤</div>${currentUser.username}`;
        }
    }

    // Récupération des commandes utilisateur
    async function fetchUserOrders() {
        try {
            const response = await fetch('/api/orders/user');
            
            // Déboguer la réponse brute
            const text = await response.text();
            console.log('Réponse brute de l\'API commandes:', text);
            
            // Essayer de parser le JSON
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Erreur de parsing JSON pour les commandes:', e);
                return;
            }
            
            if (data.success) {
                userOrders = data.orders;
                updateOrdersCount();
            } else {
                console.error('Erreur récupération commandes:', data.message);
            }
        } catch (error) {
            console.error('Erreur récupération commandes:', error);
        }
    }

    // Récupération des produits
    async function fetchProducts() {
        try {
            const response = await fetch('/api/products');
            
            // Déboguer la réponse brute
            const text = await response.text();
            console.log('Réponse brute de l\'API produits:', text);
            
            // Essayer de parser le JSON
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Erreur de parsing JSON pour les produits:', e);
                return;
            }
            
            if (data.success) {
                // Vérifier la structure des données
                if (data.products && data.products.length > 0) {
                    console.log('Premier produit:', data.products[0]);
                }
                
                products = data.products || [];
                displayProducts();
            } else {
                console.error('Erreur récupération produits:', data.message);
            }
        } catch (error) {
            console.error('Erreur récupération produits:', error);
        }
    }

    // Affichage des produits
  function displayProducts() {
    const productsContainer = document.getElementById('products-container');
    
    if (!productsContainer) {
        console.error('Conteneur de produits non trouvé');
        return;
    }
    
    productsContainer.innerHTML = '';
    
    if (!products || products.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">Aucun produit disponible</div>';
        return;
    }
    
    products.forEach(product => {
        console.log('Processing product:', product); // Déboguer chaque produit
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.id = product._id;
        
        // Vérifier si inStock existe, sinon utiliser true par défaut
        const isInStock = product.inStock !== undefined ? product.inStock : true;
        
        const stockBadge = isInStock ? 
            '<span class="stock-badge in-stock">En stock</span>' : 
            '<span class="stock-badge out-of-stock">Rupture de stock</span>';
        
        // Vérifier chaque propriété et utiliser des valeurs par défaut si nécessaire
        const basePrice = product.pricePerGram !== undefined ? Number(product.pricePerGram) : 0;
        const videoUrl = product.videoUrl || "/images/default-video.mp4";
        const name = product.name || "Produit sans nom";
        const category = product.category || "Non catégorisé";
        const thcContent = product.thcContent !== undefined ? product.thcContent : "N/A";
        const description = product.description || "Aucune description disponible";
        
        // Créer les options pour le menu déroulant de quantité
        const quantityOptions = [
            { grams: 1, price: basePrice },
            { grams: 3, price: basePrice * 3 * 0.95 }, // 5% de réduction pour 3g
            { grams: 5, price: basePrice * 5 * 0.9 }, // 10% de réduction pour 5g
            { grams: 10, price: basePrice * 10 * 0.85 }, // 15% de réduction pour 10g
            { grams: 20, price: basePrice * 20 * 0.8 }, // 20% de réduction pour 20g
        ];
        
        const quantityOptionsHTML = quantityOptions.map(option => {
            return `<option value="${option.grams}" data-price="${option.price.toFixed(2)}">
                ${option.grams}g - ${option.price.toFixed(2)}€
            </option>`;
        }).join('');
        
        productCard.innerHTML = `
            <div class="product-video-container">
                <video class="product-video" controls preload="none" poster="/images/video-placeholder.jpg">
                    <source src="${videoUrl}" type="video/mp4">
                    Votre navigateur ne supporte pas les vidéos HTML5.
                </video>
            </div>
            <div class="product-info">
                <h3 class="product-name">${name}</h3>
                <div class="product-category">${category}</div>
                <div class="product-thc">THC: ${thcContent}%</div>
                <p class="product-description">${description}</p>
                <div class="product-price-container">
                    <div class="product-price" data-base-price="${basePrice.toFixed(2)}">
                        ${basePrice.toFixed(2)}€/g
                    </div>
                    <div class="quantity-selector">
                        <select class="quantity-dropdown" data-product-id="${product._id}">
                            ${quantityOptionsHTML}
                        </select>
                    </div>
                </div>
                ${stockBadge}
                <button class="add-to-cart-btn" data-product-id="${product._id}">
                    Ajouter au panier
                </button>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
        
        // Ajouter un écouteur d'événement pour le changement de quantité
        const quantityDropdown = productCard.querySelector('.quantity-dropdown');
        quantityDropdown.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const price = selectedOption.getAttribute('data-price');
            const grams = selectedOption.value;
            
            const priceDisplay = productCard.querySelector('.product-price');
            priceDisplay.textContent = `${price}€ pour ${grams}g`;
        });
    });
    
    // Initialiser l'affichage du prix pour la première option de chaque produit
    document.querySelectorAll('.quantity-dropdown').forEach(dropdown => {
        // Simuler un événement de changement pour mettre à jour l'affichage initial
        const event = new Event('change');
        dropdown.dispatchEvent(event);
    });
}


    // Mise à jour compteur commandes
    function updateOrdersCount() {
        const ordersCountElement = document.getElementById('orders-count');
        if (ordersCountElement) {
            ordersCountElement.textContent = userOrders.length;
            ordersCountElement.style.display = userOrders.length > 0 ? 'block' : 'none';
        } else {
            const ordersIcon = document.querySelector('#orders-button .orders-icon');
            if (ordersIcon) {
                const oldCount = ordersIcon.querySelector('.cart-count');
                if (oldCount) ordersIcon.removeChild(oldCount);
                
                const newCount = document.createElement('span');
                newCount.className = 'cart-count';
                newCount.id = 'orders-count';
                newCount.textContent = userOrders.length;
                newCount.style.display = userOrders.length > 0 ? 'block' : 'none';
                
                ordersIcon.appendChild(newCount);
            }
        }
    }

    // Création modal commandes (comme le panier)
    function createOrdersModal() {
        let ordersModal = document.getElementById('orders-modal');
        if (!ordersModal) {
            ordersModal = document.createElement('div');
            ordersModal.className = 'cart-modal';
            ordersModal.id = 'orders-modal';
            
            ordersModal.innerHTML = `
                <div class="cart-header">
                    <h2>Vos Commandes</h2>
                    <button class="close-cart" id="close-orders">×</button>
                </div>
                
                <div class="cart-items" id="orders-items">
                    <div class="empty-cart" id="empty-orders">
                        Vous n'avez pas encore de commandes
                    </div>
                </div>
            `;
            
            document.body.appendChild(ordersModal);
            
            let overlay = document.getElementById('overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'overlay';
                overlay.className = 'overlay';
                document.body.appendChild(overlay);
            }
            
            document.getElementById('close-orders').addEventListener('click', () => {
                ordersModal.classList.remove('open');
                document.getElementById('overlay').classList.remove('active');
            });
        }
        
        return ordersModal;
    }

    // Affichage commandes
    function displayOrders() {
        const ordersModal = createOrdersModal();
        const ordersItemsContainer = document.getElementById('orders-items');
        const emptyOrdersMessage = document.getElementById('empty-orders');
        const overlay = document.getElementById('overlay');
        
        if (!userOrders || userOrders.length === 0) {
            if (emptyOrdersMessage) {
                emptyOrdersMessage.style.display = 'block';
            }
            ordersItemsContainer.innerHTML = '<div class="empty-cart" id="empty-orders">Vous n\'avez pas encore de commandes</div>';
        } else {
            if (emptyOrdersMessage) {
                emptyOrdersMessage.style.display = 'none';
            }
            
            let ordersHTML = '';
            userOrders.forEach((order, index) => {
                // Vérifier et utiliser des valeurs par défaut si nécessaire
                const orderId = order.orderId || order._id || `ORDRE-${index + 1}`;
                const productName = order.productName || 'Produit non spécifié';
                const quantity = order.quantity || 0;
                const totalPrice = order.totalPrice !== undefined ? Number(order.totalPrice).toFixed(2) : '0.00';
                const status = order.status || 'En cours de traitement';
                
                ordersHTML += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <div class="cart-item-name"><strong>Commande #${orderId}</strong></div>
                            <div class="cart-item-detail">Produit: ${productName}</div>
                            <div class="cart-item-detail">Quantité: ${quantity} g</div>
                            <div class="cart-item-price">Total: ${totalPrice}€</div>
                            <div class="cart-item-status">Statut: ${status}</div>
                        </div>
                    </div>
                `;
            });
            
            ordersItemsContainer.innerHTML = ordersHTML;
        }
        
        ordersModal.classList.add('open');
        overlay.classList.add('active');
    }

    // Filtrage des produits par catégorie
   function displayFilteredProducts(filteredProducts) {
    const productsContainer = document.getElementById('products-container');
    
    if (!productsContainer) {
        console.error('Conteneur de produits non trouvé');
        return;
    }
    
    productsContainer.innerHTML = '';
    
    if (!filteredProducts || filteredProducts.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">Aucun produit dans cette catégorie</div>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.dataset.id = product._id;
        
        // Vérifier si inStock existe, sinon utiliser true par défaut
        const isInStock = product.inStock !== undefined ? product.inStock : true;
        
        const stockBadge = isInStock ? 
            '<span class="stock-badge in-stock">En stock</span>' : 
            '<span class="stock-badge out-of-stock">Rupture de stock</span>';
        
        // Vérifier chaque propriété et utiliser des valeurs par défaut si nécessaire
        const basePrice = product.pricePerGram !== undefined ? Number(product.pricePerGram) : 0;
        const videoUrl = product.videoUrl || "/images/default-video.mp4";
        const name = product.name || "Produit sans nom";
        const category = product.category || "Non catégorisé";
        const thcContent = product.thcContent !== undefined ? product.thcContent : "N/A";
        const description = product.description || "Aucune description disponible";
        
        // Créer les options pour le menu déroulant de quantité
        const quantityOptions = [
            { grams: 1, price: basePrice },
            { grams: 3, price: basePrice * 3 * 0.95 }, // 5% de réduction pour 3g
            { grams: 5, price: basePrice * 5 * 0.9 }, // 10% de réduction pour 5g
            { grams: 10, price: basePrice * 10 * 0.85 }, // 15% de réduction pour 10g
            { grams: 20, price: basePrice * 20 * 0.8 }, // 20% de réduction pour 20g
        ];
        
        const quantityOptionsHTML = quantityOptions.map(option => {
            return `<option value="${option.grams}" data-price="${option.price.toFixed(2)}">
                ${option.grams}g - ${option.price.toFixed(2)}€
            </option>`;
        }).join('');
        
        productCard.innerHTML = `
            <div class="product-video-container">
                <video class="product-video" controls preload="none" poster="/images/video-placeholder.jpg">
                    <source src="${videoUrl}" type="video/mp4">
                    Votre navigateur ne supporte pas les vidéos HTML5.
                </video>
            </div>
            <div class="product-info">
                <h3 class="product-name">${name}</h3>
                <div class="product-category">${category}</div>
                <div class="product-thc">THC: ${thcContent}%</div>
                <p class="product-description">${description}</p>
                <div class="product-price-container">
                    <div class="product-price" data-base-price="${basePrice.toFixed(2)}">
                        ${basePrice.toFixed(2)}€/g
                    </div>
                    <div class="quantity-selector">
                        <select class="quantity-dropdown" data-product-id="${product._id}">
                            ${quantityOptionsHTML}
                        </select>
                    </div>
                </div>
                ${stockBadge}
                <button class="add-to-cart-btn" data-product-id="${product._id}">
                    Ajouter au panier
                </button>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
        
        // Ajouter un écouteur d'événement pour le changement de quantité
        const quantityDropdown = productCard.querySelector('.quantity-dropdown');
        quantityDropdown.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            const price = selectedOption.getAttribute('data-price');
            const grams = selectedOption.value;
            
            const priceDisplay = productCard.querySelector('.product-price');
            priceDisplay.textContent = `${price}€ pour ${grams}g`;
        });
    });
    
    // Initialiser l'affichage du prix pour la première option de chaque produit
    document.querySelectorAll('.quantity-dropdown').forEach(dropdown => {
        // Simuler un événement de changement pour mettre à jour l'affichage initial
        const event = new Event('change');
        dropdown.dispatchEvent(event);
    });
}
    // Configuration des filtres par catégorie
    function setupCategoryFilters() {
        const categoryFilters = document.querySelectorAll('.category-filter');
        if (categoryFilters.length > 0) {
            categoryFilters.forEach(filter => {
                filter.addEventListener('click', function() {
                    const category = this.dataset.category;
                    
                    categoryFilters.forEach(f => f.classList.remove('active'));
                    this.classList.add('active');
                    
                    if (category === 'all') {
                        displayProducts();
                    } else {
                        const filteredProducts = products.filter(product => product.category === category);
                        displayFilteredProducts(filteredProducts);
                    }
                });
            });
        }
    }

    // Configuration de la déconnexion
    function setupLogout() {
        const sidebarContent = document.querySelector('.sidebar-content');
        let logoutItem = document.getElementById('logout-item');
        
        if (!logoutItem && sidebarContent) {
            const logoutSection = document.createElement('div');
            logoutSection.className = 'sidebar-section';
            logoutSection.innerHTML = `
                <div class="sidebar-section-title">Compte</div>
                <div class="sidebar-item" id="logout-item">
                    <span class="sidebar-item-icon">🚪</span>
                    Déconnexion
                </div>
            `;
            
            sidebarContent.appendChild(logoutSection);
            
            document.getElementById('logout-item').addEventListener('click', async function() {
                try {
                    const response = await fetch('/api/auth/logout');
                    console.log('Réponse de déconnexion:', await response.text());
                    window.location.href = '/login.html';
                } catch (error) {
                    console.error('Erreur lors de la déconnexion:', error);
                }
            });
        }
    }

    // Configuration des événements
    function setupEventListeners() {
        const ordersButton = document.getElementById('orders-button');
        if (ordersButton) {
            ordersButton.addEventListener('click', displayOrders);
        }
    }

    // Initialisation
    function init() {
        setupLogout();
        fetchUserOrders();
        fetchProducts();
        setupCategoryFilters();
        setupEventListeners();
    }

    // Démarrer l'application
    init();
});
