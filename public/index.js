// Script principal pour le dashboard

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentUser = null;
    let userOrders = [];
    let cart = [];
    let products = [];

    // Récupération des informations de l'utilisateur connecté
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                currentUser = data.user;
                displayUsername();
                fetchUserOrders();
                fetchProducts(); // Charger les produits
            } else {
                // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
        }
    }

    // Afficher le nom d'utilisateur dans le header
    function displayUsername() {
        // Mettre à jour le bouton de profil avec le nom d'utilisateur
        const profileButton = document.getElementById('profile-button');
        if (profileButton && currentUser) {
            profileButton.innerHTML = `
                <div class="profile-icon">👤</div>
                ${currentUser.username}
            `;
        }
    }

    // Récupérer les commandes de l'utilisateur
    async function fetchUserOrders() {
        try {
            const response = await fetch('/api/orders/user');
            const data = await response.json();
            
            if (data.success) {
                userOrders = data.orders;
                updateOrdersCount();
            } else {
                console.error('Erreur lors de la récupération des commandes:', data.message);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des commandes:', error);
        }
    }

    // Récupérer la liste des produits
    async function fetchProducts() {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            
            if (data.success) {
                products = data.products;
                displayProducts();
            } else {
                console.error('Erreur lors de la récupération des produits:', data.message);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des produits:', error);
        }
    }

    // Afficher les produits dans la section principale
    function displayProducts() {
        const productsContainer = document.getElementById('products-container');
        
        if (!productsContainer) {
            console.error('Conteneur de produits non trouvé');
            return;
        }
        
        // Vider le conteneur
        productsContainer.innerHTML = '';
        
        if (products.length === 0) {
            productsContainer.innerHTML = '<div class="no-products">Aucun produit disponible pour le moment</div>';
            return;
        }
        
        // Afficher les produits
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product._id;
            
            // Déterminer le badge de stock
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
            
            // Ajouter les événements pour les boutons de quantité
            const quantityInput = productCard.querySelector('.quantity-input');
            const decreaseBtn = productCard.querySelector('.decrease-btn');
            const increaseBtn = productCard.querySelector('.increase-btn');
            const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
            
            decreaseBtn.addEventListener('click', function() {
                let value = parseInt(quantityInput.value);
                if (value > 1) {
                    quantityInput.value = value - 1;
                }
            });
            
            increaseBtn.addEventListener('click', function() {
                let value = parseInt(quantityInput.value);
                if (value < 100) {
                    quantityInput.value = value + 1;
                }
            });
            
            // Empêcher les valeurs négatives ou non numériques
            quantityInput.addEventListener('change', function() {
                let value = parseInt(this.value);
                if (isNaN(value) || value < 1) {
                    this.value = 1;
                } else if (value > 100) {
                    this.value = 100;
                }
            });
            
            // Ajouter au panier
            if (product.inStock) {
                addToCartBtn.addEventListener('click', function() {
                    addToCart(product, parseInt(quantityInput.value));
                });
            }
        });
    }

    // Ajouter un produit au panier
    function addToCart(product, quantity) {
        // Vérifier si le produit est déjà dans le panier
        const existingItem = cart.find(item => item.id === product._id);
        
        if (existingItem) {
            // Mettre à jour la quantité
            existingItem.quantity += quantity;
        } else {
            // Ajouter un nouvel élément
            cart.push({
                id: product._id,
                name: product.name,
                price: product.pricePerGram,
                quantity: quantity,
                category: product.category
            });
        }
        
        // Mettre à jour l'affichage du panier
        updateCartCount();
        
        // Afficher une notification
        showNotification(`${quantity}g de ${product.name} ajouté au panier`);
    }

    // Mettre à jour le nombre d'articles dans le panier
    function updateCartCount() {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCountElement.textContent = totalItems;
            cartCountElement.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    // Afficher une notification
    function showNotification(message) {
        // Vérifier si une notification existe déjà
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            // Créer une nouvelle notification
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Mettre à jour le message
        notification.textContent = message;
        notification.classList.add('show');
        
        // Masquer après 3 secondes
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Mettre à jour le nombre de commandes dans le badge
    function updateOrdersCount() {
        const ordersCountElement = document.getElementById('orders-count');
        if (ordersCountElement) {
            ordersCountElement.textContent = userOrders.length;
            ordersCountElement.style.display = userOrders.length > 0 ? 'block' : 'none';
        } else {
            const ordersIcon = document.querySelector('#orders-button .orders-icon');
            if (ordersIcon) {
                // Supprimer l'ancien compteur s'il existe
                const oldCount = ordersIcon.querySelector('.cart-count');
                if (oldCount) {
                    ordersIcon.removeChild(oldCount);
                }
                
                // Créer un nouveau compteur
                const newCount = document.createElement('span');
                newCount.className = 'cart-count';
                newCount.id = 'orders-count';
                newCount.textContent = userOrders.length;
                newCount.style.display = userOrders.length > 0 ? 'block' : 'none';
                
                // Ajouter le nouveau compteur
                ordersIcon.appendChild(newCount);
            }
        }
    }

    // Créer le modal des commandes
    function createOrdersModal() {
        // Vérifier si le modal existe déjà
        let ordersModal = document.getElementById('orders-modal');
        if (!ordersModal) {
            // Créer le modal des commandes
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
            
            // Ajouter l'événement pour fermer le modal
            document.getElementById('close-orders').addEventListener('click', function() {
                ordersModal.classList.remove('open');
                document.getElementById('overlay').classList.remove('active');
            });
        }
        
        return ordersModal;
    }

    // Créer le modal du panier
    function createCartModal() {
        // Vérifier si le modal existe déjà
        let cartModal = document.getElementById('cart-modal');
        if (!cartModal) {
            // Créer le modal du panier
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
            
            // Créer ou récupérer l'overlay
            let overlay = document.getElementById('overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'overlay';
                overlay.className = 'overlay';
                document.body.appendChild(overlay);
            }
            
            // Ajouter l'événement pour fermer le modal
            document.getElementById('close-cart').addEventListener('click', function() {
                cartModal.classList.remove('open');
                overlay.classList.remove('active');
            });
            
            // Ajouter l'événement pour le paiement
            document.getElementById('checkout-btn').addEventListener('click', checkout);
        }
        
        return cartModal;
    }

    // Afficher le panier
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
            
            // Ajouter les événements pour supprimer des articles
            const removeButtons = cartItemsContainer.querySelectorAll('.remove-item-btn');
            removeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.dataset.index);
                    removeFromCart(index);
                });
            });
        }
        
        // Afficher le modal et l'overlay
        cartModal.classList.add('open');
        overlay.classList.add('active');
    }

    // Supprimer un article du panier
    function removeFromCart(index) {
        if (index >= 0 && index < cart.length) {
            cart.splice(index, 1);
            updateCartCount();
            displayCart(); // Rafraîchir l'affichage du panier
        }
    }

    // Afficher les commandes dans le modal
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
        
        // Afficher le modal et l'overlay
        ordersModal.classList.add('open');
        overlay.classList.add('active');
    }

    // Fonction pour passer une commande
    async function checkout() {
        // Vérifier si le panier n'est pas vide
        if (cart.length === 0) {
            showNotification('Votre panier est vide.');
            return;
        }
        
        try {
            // Créer une commande pour chaque article du panier
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
            
            // Attendre que toutes les commandes soient passées
            const results = await Promise.all(orderPromises);
            
            // Vérifier si toutes les commandes ont été créées avec succès
            const allSuccessful = results.every(result => result.success);
            
            if (allSuccessful) {
                showNotification('Vos commandes ont été passées avec succès !');
                // Vider le panier
                cart = [];
                updateCartCount();
                // Fermer le modal du panier
                const cartModal = document.getElementById('cart-modal');
                const overlay = document.getElementById('overlay');
                if (cartModal) cartModal.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
                
                // Mettre à jour les commandes
                fetchUserOrders();
            } else {
                showNotification('Une erreur est survenue lors de la création de vos commandes.');
            }
        } catch (error) {
            console.error('Erreur lors du passage des commandes:', error);
            showNotification('Une erreur est survenue. Veuillez réessayer plus tard.');
        }
    }

    // Gestionnaire d'événements pour le bouton "Mes Commandes"
    const ordersButton = document.getElementById('orders-button');
    if (ordersButton) {
        ordersButton.addEventListener('click', function() {
            displayOrders();
        });
    }

    // Gestionnaire d'événements pour le bouton du panier
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', function() {
            displayCart();
        });
    }

    // Gestionnaire d'événement pour la déconnexion
    function setupLogout() {
        // Ajouter l'élément de déconnexion à la sidebar s'il n'existe pas
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
            
            // Ajouter l'événement de déconnexion
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

    // Fonction pour filtrer les produits par catégorie
    function setupCategoryFilters() {
        const categoryFilters = document.querySelectorAll('.category-filter');
        if (categoryFilters.length > 0) {
            categoryFilters.forEach(filter => {
                filter.addEventListener('click', function() {
                    const category = this.dataset.category;
                    
                    // Mettre à jour la classe active
                    categoryFilters.forEach(f => f.classList.remove('active'));
                    this.classList.add('active');
                    
                    if (category === 'all') {
                        // Afficher tous les produits
                        displayProducts();
                    } else {
                        // Filtrer les produits par catégorie
                        const filteredProducts = products.filter(product => product.category === category);
                        displayFilteredProducts(filteredProducts);
                    }
                });
            });
        }
    }

    // Afficher les produits filtrés
    function displayFilteredProducts(filteredProducts) {
        const productsContainer = document.getElementById('products-container');
        
        if (!productsContainer) {
            console.error('Conteneur de produits non trouvé');
            return;
        }
        
        // Vider le conteneur
        productsContainer.innerHTML = '';
        
        if (filteredProducts.length === 0) {
            productsContainer.innerHTML = '<div class="no-products">Aucun produit dans cette catégorie</div>';
            return;
        }
        
        // Afficher les produits filtrés
        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product._id;
            
            // Déterminer le badge de stock
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
                        <input type="number" class="quantity
