// Script principal pour le dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentUser = null;
    let userOrders = [];
    let cart = [];
    let products = [];

    // Vérification de l'authentification
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                currentUser = data.user;
                displayUsername();
                fetchUserOrders();
                fetchProducts();
            } else {
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Erreur d\'authentification:', error);
        }
    }

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
            const data = await response.json();
            
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
            const data = await response.json();
            
            if (data.success) {
                products = data.products;
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
        
        if (products.length === 0) {
            productsContainer.innerHTML = '<div class="no-products">Aucun produit disponible</div>';
            return;
        }
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product._id;
            
            const stockBadge = product.inStock ? 
                '<span class="stock-badge in-stock">En stock</span>' : 
                '<span class="stock-badge out-of-stock">Rupture de stock</span>';
            
            productCard.innerHTML = `
                <div class="product-video-container">
                    <video class="product-video" controls preload="none" poster="/images/video-placeholder.jpg">
                        <source src="${product.videoUrl}" type="video/mp4">
                        Votre navigateur ne supporte pas les vidéos HTML5.
                    </video>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-category">${product.category}</div>
                    <div class="product-thc">THC: ${product.thcContent}%</div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">${product.pricePerGram.toFixed(2)}€/g</div>
                    ${stockBadge}
                </div>
                <div class="product-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn decrease-btn">-</button>
                        <input type="number" class="quantity-input" value="1" min="1" max="100">
                        <button class="quantity-btn increase-btn">+</button>
                    </div>
                    <button class="add-to-cart-btn" ${!product.inStock ? 'disabled' : ''}>
                        ${product.inStock ? 'Ajouter au panier' : 'Indisponible'}
                    </button>
                </div>
            `;
            
            productsContainer.appendChild(productCard);
            
            setupProductControls(productCard, product);
        });
    }
    
    // Configuration des contrôles de produit
    function setupProductControls(productCard, product) {
        const quantityInput = productCard.querySelector('.quantity-input');
        const decreaseBtn = productCard.querySelector('.decrease-btn');
        const increaseBtn = productCard.querySelector('.increase-btn');
        const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
        
        decreaseBtn.addEventListener('click', () => {
            let value = parseInt(quantityInput.value);
            if (value > 1) quantityInput.value = value - 1;
        });
        
        increaseBtn.addEventListener('click', () => {
            let value = parseInt(quantityInput.value);
            if (value < 100) quantityInput.value = value + 1;
        });
        
        quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value);
            if (isNaN(value) || value < 1) this.value = 1;
            else if (value > 100) this.value = 100;
        });
        
        if (product.inStock) {
            addToCartBtn.addEventListener('click', () => {
                addToCart(product, parseInt(quantityInput.value));
            });
        }
    }

    // Ajout au panier
    function addToCart(product, quantity) {
        const existingItem = cart.find(item => item.id === product._id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: product._id,
                name: product.name,
                price: product.pricePerGram,
                quantity: quantity,
                category: product.category
            });
        }
        
        updateCartCount();
        showNotification(`${quantity}g de ${product.name} ajouté au panier`);
    }

    // Mise à jour du compteur panier
    function updateCartCount() {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCountElement.textContent = totalItems;
            cartCountElement.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }
// Affichage notification
    function showNotification(message) {
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
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

    // Création modal commandes
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
            
            document.getElementById('close-orders').addEventListener('click', () => {
                ordersModal.classList.remove('open');
                document.getElementById('overlay').classList.remove('active');
            });
        }
        
        return ordersModal;
    }

    // Création modal panier
    function createCartModal() {
        let cartModal = document.getElementById('cart-modal');
        if (!cartModal) {
            cartModal = document.createElement('div');
            cartModal.className = 'cart-modal';
            cartModal.id = 'cart-modal';
            
            cartModal.innerHTML = `
                <div class="cart-header">
                    <h2>Votre Panier</h2>
                    <button class="close-cart" id="close-cart">×</button>
                </div>
                
                <div class="cart-items" id="cart-items">
                    <div class="empty-cart" id="empty-cart">
                        Votre panier est vide
                    </div>
                </div>
                
                <div class="cart-footer">
                    <div class="cart-total">Total: <span id="cart-total-price">0.00</span>€</div>
                    <button class="checkout-btn" id="checkout-btn">Payer</button>
                </div>
            `;
            
            document.body.appendChild(cartModal);
            
            let overlay = document.getElementById('overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'overlay';
                overlay.className = 'overlay';
                document.body.appendChild(overlay);
            }
            
            document.getElementById('close-cart').addEventListener('click', () => {
                cartModal.classList.remove('open');
                document.getElementById('overlay').classList.remove('active');
            });
            
            document.getElementById('checkout-btn').addEventListener('click', checkout);
        }
        
        return cartModal;
    }

    // Affichage panier
    function displayCart() {
        const cartModal = createCartModal();
        const cartItemsContainer = document.getElementById('cart-items');
        const emptyCartMessage = document.getElementById('empty-cart');
        const totalPriceElement = document.getElementById('cart-total-price');
        const overlay = document.getElementById('overlay');
        
        if (cart.length === 0) {
            emptyCartMessage.style.display = 'block';
            cartItemsContainer.innerHTML = '<div class="empty-cart" id="empty-cart">Votre panier est vide</div>';
            totalPriceElement.textContent = '0.00';
        } else {
            emptyCartMessage.style.display = 'none';
            
            let cartHTML = '';
            let totalPrice = 0;
            
            cart.forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                totalPrice += itemTotal;
                
                cartHTML += `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-category">${item.category}</div>
                            <div class="cart-item-price">${item.price.toFixed(2)}€/g × ${item.quantity}g = ${itemTotal.toFixed(2)}€</div>
                        </div>
                        <div class="cart-item-actions">
                            <button class="remove-item-btn" data-index="${index}">×</button>
                        </div>
                    </div>
                `;
            });
            
            cartItemsContainer.innerHTML = cartHTML;
            totalPriceElement.textContent = totalPrice.toFixed(2);
            
            const removeButtons = cartItemsContainer.querySelectorAll('.remove-item-btn');
            removeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    removeFromCart(parseInt(this.dataset.index));
                });
            });
        }
        
        cartModal.classList.add('open');
        overlay.classList.add('active');
    }

    // Suppression du panier
    function removeFromCart(index) {
        if (index >= 0 && index < cart.length) {
            cart.splice(index, 1);
            updateCartCount();
            displayCart();
        }
    }

    // Affichage commandes
    function displayOrders() {
        const ordersModal = createOrdersModal();
        const ordersItemsContainer = document.getElementById('orders-items');
        const emptyOrdersMessage = document.getElementById('empty-orders');
        const overlay = document.getElementById('overlay');
        
        if (userOrders.length === 0) {
            emptyOrdersMessage.style.display = 'block';
            ordersItemsContainer.innerHTML = '<div class="empty-cart" id="empty-orders">Vous n\'avez pas encore de commandes</div>';
        } else {
            emptyOrdersMessage.style.display = 'none';
            
            let ordersHTML = '';
            userOrders.forEach((order, index) => {
                ordersHTML += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <div class="cart-item-name"><strong>Commande #${order.orderId || order._id || index + 1}</strong></div>
                            <div class="cart-item-detail">Produit: ${order.productName}</div>
                            <div class="cart-item-detail">Quantité: ${order.quantity} g</div>
                            <div class="cart-item-price">Total: ${order.totalPrice.toFixed(2)}€</div>
                            <div class="cart-item-status">Statut: ${order.status || 'En cours de traitement'}</div>
                        </div>
                    </div>
                `;
            });
            
            ordersItemsContainer.innerHTML = ordersHTML;
        }
        
        ordersModal.classList.add('open');
        overlay.classList.add('active');
    }


// Passer une commande
    async function checkout() {
        if (cart.length === 0) {
            showNotification('Votre panier est vide.');
            return;
        }
        
        try {
            const orderPromises = cart.map(async (item) => {
                const orderData = {
                    productName: item.name,
                    quantity: item.quantity,
                    totalPrice: item.price * item.quantity
                };
                
                const response = await fetch('/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });
                
                return response.json();
            });
            
            const results = await Promise.all(orderPromises);
            const allSuccessful = results.every(result => result.success);
            
            if (allSuccessful) {
                showNotification('Vos commandes ont été passées avec succès !');
                cart = [];
                updateCartCount();
                
                const cartModal = document.getElementById('cart-modal');
                const overlay = document.getElementById('overlay');
                if (cartModal) cartModal.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
                
                fetchUserOrders();
            } else {
                showNotification('Une erreur est survenue lors de la création de vos commandes.');
            }
        } catch (error) {
            console.error('Erreur lors du passage des commandes:', error);
            showNotification('Une erreur est survenue. Veuillez réessayer plus tard.');
        }
    }

    // Filtrage des produits par catégorie
    function displayFilteredProducts(filteredProducts) {
        const productsContainer = document.getElementById('products-container');
        
        if (!productsContainer) {
            console.error('Conteneur de produits non trouvé');
            return;
        }
        
        productsContainer.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            productsContainer.innerHTML = '<div class="no-products">Aucun produit dans cette catégorie</div>';
            return;
        }
        
        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product._id;
            
            const stockBadge = product.inStock ? 
                '<span class="stock-badge in-stock">En stock</span>' : 
                '<span class="stock-badge out-of-stock">Rupture de stock</span>';
            
            productCard.innerHTML = `
                <div class="product-video-container">
                    <video class="product-video" controls preload="none" poster="/images/video-placeholder.jpg">
                        <source src="${product.videoUrl}" type="video/mp4">
                        Votre navigateur ne supporte pas les vidéos HTML5.
                    </video>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-category">${product.category}</div>
                    <div class="product-thc">THC: ${product.thcContent}%</div>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">${product.pricePerGram.toFixed(2)}€/g</div>
                    ${stockBadge}
                </div>
                <div class="product-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn decrease-btn">-</button>
                        <input type="number" class="quantity-input" value="1" min="1" max="100">
                        <button class="quantity-btn increase-btn">+</button>
                    </div>
                    <button class="add-to-cart-btn" ${!product.inStock ? 'disabled' : ''}>
                        ${product.inStock ? 'Ajouter au panier' : 'Indisponible'}
                    </button>
                </div>
            `;
            
            productsContainer.appendChild(productCard);
            setupProductControls(productCard, product);
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
                    await fetch('/api/auth/logout');
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

        const cartButton = document.getElementById('cart-button');
        if (cartButton) {
            cartButton.addEventListener('click', displayCart);
        }
    }

    // Initialisation
    function init() {
        checkAuthStatus();
        setupLogout();
        setupCategoryFilters();
        setupEventListeners();
    }

    // Démarrer l'application
    init();
});
