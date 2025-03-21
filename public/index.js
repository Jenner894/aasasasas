// Script principal pour le dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentUser = null;
    let userOrders = [];
    let products = [];
    let cart = []; // Panier d'achat
    


    // Afficher le nom d'utilisateur
    function displayUsername() {
        const profileButton = document.getElementById('profile-button');
        if (profileButton && currentUser) {
            profileButton.innerHTML = `<div class="profile-icon">👤</div>${currentUser.username}`;
        }
    }
    
    // Chargement du panier depuis le localStorage
    function loadCart() {
        try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                cart = JSON.parse(savedCart);
                updateCartCount();
            }
        } catch (error) {
            console.error('Erreur lors du chargement du panier:', error);
            cart = [];
        }
    }
    
    // Sauvegarde du panier dans le localStorage
    function saveCart() {
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du panier:', error);
        }
    }
    
    // Mise à jour du compteur d'articles dans le panier
    function updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const itemCount = cart.reduce((total, item) => total + 1, 0);
            cartCount.textContent = itemCount;
            cartCount.style.display = itemCount > 0 ? 'block' : 'none';
        }
    }
    
    // Ajout d'un produit au panier
    function addToCart(productId, quantity, price, name, category) {
        // Vérifier si le produit est déjà dans le panier
        const existingItemIndex = cart.findIndex(item => 
            item.productId === productId && item.quantity === parseInt(quantity));
        
        if (existingItemIndex >= 0) {
            // Incrémenter la quantité si le produit existe déjà avec la même quantité
            cart[existingItemIndex].count += 1;
        } else {
            // Ajouter un nouvel article
            cart.push({
                productId: productId,
                name: name,
                category: category,
                quantity: parseInt(quantity),
                price: parseFloat(price),
                count: 1
            });
        }
        
        // Mettre à jour le compteur et sauvegarder
        updateCartCount();
        saveCart();
        
        // Mettre à jour l'affichage du panier s'il est ouvert
        displayCart();
    }
    
    // Supprimer un produit du panier
    function removeFromCart(index) {
        if (index >= 0 && index < cart.length) {
            cart.splice(index, 1);
            updateCartCount();
            saveCart();
            displayCart();
        }
    }
    
    // Affichage du contenu du panier
    function displayCart() {
        const cartItemsContainer = document.getElementById('cart-items');
        const emptyCartMessage = document.getElementById('empty-cart');
        const cartTotalElement = document.getElementById('cart-total-price');
        
        if (!cartItemsContainer) return;
        
        if (!cart || cart.length === 0) {
            // Panier vide
            if (emptyCartMessage) {
                emptyCartMessage.style.display = 'block';
            }
            cartItemsContainer.innerHTML = '<div class="empty-cart">Votre panier est vide</div>';
            if (cartTotalElement) {
                cartTotalElement.textContent = '0.00€';
            }
            return;
        }
        
        // Panier avec des articles
        if (emptyCartMessage) {
            emptyCartMessage.style.display = 'none';
        }
        
        let cartHTML = '';
        let totalPrice = 0;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.count;
            totalPrice += itemTotal;
            
            cartHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-detail">Catégorie: ${item.category}</div>
                        <div class="cart-item-detail">Quantité: ${item.quantity}g × ${item.count}</div>
                        <div class="cart-item-price">${itemTotal.toFixed(2)}€</div>
                    </div>
                    <button class="remove-item-btn" data-index="${index}">×</button>
                </div>
            `;
        });
        
        cartItemsContainer.innerHTML = cartHTML;
        
        // Mettre à jour le total
        if (cartTotalElement) {
            cartTotalElement.textContent = totalPrice.toFixed(2) + '€';
        }
        
        // Ajouter les écouteurs d'événements pour les boutons de suppression
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeFromCart(index);
            });
        });
    }

    // Récupération des commandes utilisateur
    async function fetchUserOrders() {
        try {
            const response = await fetch('/api/orders/user');
            
            // Vérifier si la réponse est OK avant de tenter de parser le JSON
            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, response.statusText);
                userOrders = []; // Initialiser comme tableau vide en cas d'erreur
                updateOrdersCount();
                return;
            }
            
            // Vérifier le type de contenu de la réponse
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Réponse non-JSON reçue:', contentType);
                const text = await response.text();
                console.log('Contenu de la réponse:', text);
                // Initialiser les commandes comme un tableau vide si la réponse n'est pas JSON
                userOrders = [];
                updateOrdersCount();
                return;
            }
            
            // Maintenant on peut parser le JSON en toute sécurité
            const data = await response.json();
            
            if (data.success) {
                userOrders = data.orders;
                updateOrdersCount();
            } else {
                console.error('Erreur récupération commandes:', data.message);
                userOrders = []; // Initialiser comme tableau vide en cas d'erreur
                updateOrdersCount();
            }
        } catch (error) {
            console.error('Erreur récupération commandes:', error);
            // Initialiser les commandes comme un tableau vide en cas d'erreur
            userOrders = [];
            updateOrdersCount();
        }
    }

    // Récupération des produits
    async function fetchProducts() {
        try {
            const response = await fetch('/api/products');
            
            // Vérifier si la réponse est OK avant de tenter de parser le JSON
            if (!response.ok) {
                console.error('Erreur HTTP:', response.status, response.statusText);
                return;
            }
            
            // Vérifier le type de contenu de la réponse
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Réponse non-JSON reçue:', contentType);
                const text = await response.text();
                console.log('Contenu de la réponse:', text);
                return;
            }
            
            // Maintenant on peut parser le JSON en toute sécurité
            const data = await response.json();
            
            if (data.success) {
                // Vérifier la structure des données
                if (data.products && data.products.length > 0) {
                    console.log('Premier produit:', data.products[0]);
                }
                
                products = data.products || [];
                displayProducts();
                // Une fois les produits chargés, configurez les filtres de catégorie
                setupCategoryFilters();
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
            productCard.dataset.category = product.category || ''; // Ajouter la catégorie comme attribut de données
            
            // Vérifier si inStock existe, sinon utiliser true par défaut
            const isInStock = product.inStock !== undefined ? product.inStock : true;
            
            const stockBadge = isInStock ? 
                '<span class="stock-badge in-stock">En stock</span>' : 
                '<span class="stock-badge out-of-stock">Rupture de stock</span>';
            
            // Normaliser les propriétés du produit - corriger les incohérences
            const videoUrl = product.videoUrl || product.video || "/images/default-video.mp4";
            const name = product.name || "Produit sans nom";
            const category = product.category || "Non catégorisé";
            const thcContent = product.thcContent || product.thc || "N/A";
            const description = product.description || "Aucune description disponible";
            
            // Vérifier si les options de prix existent et sont valides
            let quantityOptionsHTML = '';
            if (product.priceOptions && Array.isArray(product.priceOptions) && product.priceOptions.length > 0) {
                // Trier les options par quantité croissante
                const sortedOptions = [...product.priceOptions].sort((a, b) => a.quantity - b.quantity);
                
                quantityOptionsHTML = sortedOptions.map(option => {
                    return `<option value="${option.quantity}" data-price="${option.price.toFixed(2)}">
                        ${option.quantity}g - ${option.price.toFixed(2)}€
                    </option>`;
                }).join('');
            } else {
                // Si aucune option de prix n'est disponible, afficher un message
                quantityOptionsHTML = '<option value="0" data-price="0.00">Prix non disponible</option>';
            }
            
            // Définir le prix initial à afficher (première option)
            const basePrice = product.priceOptions && product.priceOptions.length > 0 
                ? Number(product.priceOptions[0].price).toFixed(2) 
                : '0.00';
            
            // Assurez-vous d'utiliser un chemin relatif pour les images du placeholder
            const placeholderPath = '/images/video-placeholder.jpg';
            
            productCard.innerHTML = `
                <div class="product-video-container">
                    <video class="product-video" controls preload="none" poster="${placeholderPath}">
                        <source src="${videoUrl}" type="video/mp4">
                        Votre navigateur ne supporte pas les vidéos HTML5.
                    </video>
                </div>
                <div class="product-info">
                    <h3 class="product-name">${name}</h3>
                    <div class="product-category">${category}</div>
                    <div class="product-thc">THC: ${thcContent}</div>
                    <p class="product-description">${description}</p>
                    <div class="product-price-container">
                        <div class="product-price">
                            ${basePrice}€/g
                        </div>
                        <div class="quantity-selector">
                            <select class="quantity-dropdown" data-product-id="${product._id}">
                                ${quantityOptionsHTML}
                            </select>
                        </div>
                    </div>
                    ${stockBadge}
                    <button class="add-to-cart-btn" data-product-id="${product._id}" data-product-name="${name}" data-product-category="${category}">
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
    function filterProductsByCategory(category) {
        if (category === 'all') {
            // Afficher tous les produits
            document.querySelectorAll('.product-card').forEach(card => {
                card.style.display = 'block';
            });
        } else {
            // Filtrer les produits par catégorie exacte (Fleurs, Résines)
            document.querySelectorAll('.product-card').forEach(card => {
                const cardCategory = (card.dataset.category || '').toLowerCase();
                const selectedCategory = category.toLowerCase();
                
                // Vérifier si la catégorie correspond exactement
                card.style.display = cardCategory === selectedCategory ? 'block' : 'none';
            });
        }
    }

    // Configuration des filtres par catégorie
    function setupCategoryFilters() {
        // Utiliser les onglets de catégorie qui existent dans le HTML
        const categoryTabs = document.querySelectorAll('.category-tab');
        
        if (categoryTabs.length > 0) {
            console.log('Onglets de catégorie trouvés:', categoryTabs.length);
            
            categoryTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // Retirer la classe active de tous les onglets
                    categoryTabs.forEach(t => t.classList.remove('active'));
                    
                    // Ajouter la classe active à l'onglet cliqué
                    this.classList.add('active');
                    
                    // Filtrer les produits par catégorie
                    const category = this.getAttribute('data-category');
                    console.log('Filtrage par catégorie:', category);
                    
                    if (category === 'all') {
                        displayProducts(); // Réafficher tous les produits
                    } else {
                        // Filtrer les produits
                        filterProductsByCategory(category);
                    }
                });
            });
        } else {
            console.warn('Aucun onglet de catégorie trouvé');
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

    // Configuration du panier
    function setupCart() {
        const openCartBtn = document.getElementById('open-cart');
        const closeCartBtn = document.getElementById('close-cart');
        const cartModal = document.getElementById('cart-modal');
        const overlay = document.getElementById('overlay');
        const checkoutBtn = document.querySelector('.checkout-btn');
        
        if (openCartBtn && cartModal && overlay) {
            openCartBtn.addEventListener('click', function() {
                // Afficher le contenu du panier avant d'ouvrir la modal
                displayCart();
                
                cartModal.classList.add('open');
                overlay.classList.add('active');
            });
            
            if (closeCartBtn) {
                closeCartBtn.addEventListener('click', function() {
                    cartModal.classList.remove('open');
                    overlay.classList.remove('active');
                });
            }
            
            if (checkoutBtn) {
                checkoutBtn.addEventListener('click', function() {
                    // Traitement de la commande
                    if (cart.length > 0) {
                        processOrder();
                    } else {
                        alert('Votre panier est vide.');
                    }
                });
            }
            
            overlay.addEventListener('click', function() {
                cartModal.classList.remove('open');
                
                const ordersModal = document.getElementById('orders-modal');
                if (ordersModal) {
                    ordersModal.classList.remove('open');
                }
                
                this.classList.remove('active');
            });
        }
    }
    
    // Traitement de la commande
    async function processOrder() {
        if (!currentUser) {
            alert('Veuillez vous connecter pour passer commande.');
            return;
        }
        
        try {
            // Préparer les données de la commande
            const orderItems = cart.map(item => ({
                productId: item.productId,
                productName: item.name,
                quantity: item.quantity * item.count,
                price: item.price,
                total: item.price * item.count
            }));
            
            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.count), 0);
            
            // Envoyer la commande au serveur
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: orderItems,
                    totalAmount: totalAmount
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur HTTP: ${response.status}. ${errorText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Commande réussie
                alert('Votre commande a été enregistrée avec succès!');
                
                // Vider le panier
                cart = [];
                saveCart();
                updateCartCount();
                
                // Fermer la modal du panier
                const cartModal = document.getElementById('cart-modal');
                const overlay = document.getElementById('overlay');
                
                if (cartModal) cartModal.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
                
                // Mettre à jour les commandes
                fetchUserOrders();
            } else {
                alert(`Erreur lors de la commande: ${data.message || 'Erreur inconnue'}`);
            }
            
        } catch (error) {
            console.error('Erreur lors du traitement de la commande:', error);
            alert(`Erreur lors du traitement de la commande: ${error.message}`);
        }
    }

    // Fonctionnalité de la barre latérale
    function setupSidebar() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const closeSidebar = document.getElementById('close-sidebar');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', function() {
                sidebar.classList.add('open');
                if (overlay) overlay.classList.add('active');
            });
            
            if (closeSidebar) {
                closeSidebar.addEventListener('click', function() {
                    sidebar.classList.remove('open');
                    if (overlay) overlay.classList.remove('active');
                });
            }
            
            if (overlay) {
                overlay.addEventListener('click', function() {
                    sidebar.classList.remove('open');
                    this.classList.remove('active');
                });
            }
            
            // Configuration des éléments de la barre latérale
            const sidebarItems = document.querySelectorAll('.sidebar-item');
            sidebarItems.forEach(item => {
                item.addEventListener('click', function() {
                    // Retirer la classe active de tous les éléments
                    sidebarItems.forEach(i => i.classList.remove('active'));
                    // Ajouter la classe active à l'élément cliqué
                    this.classList.add('active');
                    
                    // Fermer la barre latérale sur mobile
                    if (window.innerWidth < 768) {
                        sidebar.classList.remove('open');
                        if (overlay) overlay.classList.remove('active');
                    }
                });
            });
        }
    }

    // Configuration des événements
    function setupEventListeners() {
        const ordersButton = document.getElementById('orders-button');
        if (ordersButton) {
            ordersButton.addEventListener('click', displayOrders);
        }
        
        // Configurer le panier
        setupCart();
        
        // Configurer la barre latérale
        setupSidebar();
        
        // Ajouter des écouteurs d'événements pour le panier
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('add-to-cart-btn')) {
                const productId = event.target.getAttribute('data-product-id');
                const productName = event.target.getAttribute('data-product-name');
                const productCategory = event.target.getAttribute('data-product-category');
                const productCard = event.target.closest('.product-card');
                
                if (productCard) {
                    const quantityDropdown = productCard.querySelector('.quantity-dropdown');
                    const quantity = quantityDropdown ? quantityDropdown.value : 1;
                    const selectedOption = quantityDropdown ? quantityDropdown.options[quantityDropdown.selectedIndex] : null;
                    const price = selectedOption ? selectedOption.getAttribute('data-price') : 0;
                    
                    // Ajouter au panier
                    addToCart(productId, quantity, price, productName, productCategory);
                    
                    // Animation ou feedback pour l'utilisateur
                    event.target.textContent = 'Ajouté!';
                    setTimeout(() => {
                        event.target.textContent = 'Ajouter au panier';
                    }, 1500);
                }
            }
        });
    }

    // Initialisation
    function init() {
        console.log('Initialisation du dashboard');
        setupLogout();
        fetchUserOrders();
        fetchProducts(); // Cette fonction appellera setupCategoryFilters une fois les produits chargés
        setupEventListeners();
    }

    // Démarrer l'application
    init();
});
