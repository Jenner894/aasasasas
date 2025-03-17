// Script principal pour le dashboard

document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentUser = null;
    let userOrders = [];

    // Récupération des informations de l'utilisateur connecté
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                currentUser = data.user;
                displayUsername();
                fetchUserOrders();
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

    // Mettre à jour le nombre de commandes dans le badge
    function updateOrdersCount() {
        const ordersCountElement = document.createElement('span');
        ordersCountElement.className = 'cart-count';
        ordersCountElement.id = 'orders-count';
        ordersCountElement.textContent = userOrders.length;
        
        const ordersIcon = document.querySelector('#orders-button .orders-icon');
        // Supprimer l'ancien compteur s'il existe
        const oldCount = ordersIcon.querySelector('.cart-count');
        if (oldCount) {
            ordersIcon.removeChild(oldCount);
        }
        
        // Ajouter le nouveau compteur
        ordersIcon.appendChild(ordersCountElement);
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

    // Afficher les commandes dans le modal
    function displayOrders() {
        const ordersModal = createOrdersModal();
        const ordersItemsContainer = document.getElementById('orders-items');
        const emptyOrdersMessage = document.getElementById('empty-orders');
        
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
                            <div class="cart-item-name"><strong>Commande #${order.orderId || index + 1}</strong></div>
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
        document.getElementById('overlay').classList.add('active');
    }

    // Gestionnaire d'événements pour le bouton "Mes Commandes"
    document.getElementById('orders-button').addEventListener('click', function() {
        displayOrders();
    });

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

    // Fonction d'initialisation
    function init() {
        checkAuthStatus();
        setupLogout();
    }

    // Démarrer l'application
    init();
});
