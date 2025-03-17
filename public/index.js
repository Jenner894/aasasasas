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
            `;
            
            productsContainer.appendChild(productCard);
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
            `;
            
            productsContainer.appendChild(productCard);
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
    }

    // Initialisation
    function init() {
       
        setupLogout();
    fetchUserOrders();
        fetchProducts()
        setupCategoryFilters();
        setupEventListeners();
    }

    // Démarrer l'application
    init();
});
