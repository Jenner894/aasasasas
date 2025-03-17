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
     Fonction pour passer une commande
async function checkout() {
    // Vérifier si l'utilisateur est connecté
    try {
        const authResponse = await fetch('/api/auth/status');
        const authData = await authResponse.json();
        
        if (!authData.authenticated) {
            alert('Veuillez vous connecter pour passer une commande.');
            window.location.href = '/login.html';
            return;
        }
        
        // Vérifier si le panier n'est pas vide
        if (cart.length === 0) {
            alert('Votre panier est vide.');
            return;
        }
        
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
            alert('Vos commandes ont été passées avec succès !');
            // Vider le panier
            cart = [];
            updateCart();
            // Fermer le modal du panier
            cartModal.classList.remove('open');
            overlay.classList.remove('active');
            
            // Mettre à jour les commandes
            fetchUserOrders();
        } else {
            alert('Une erreur est survenue lors de la création de vos commandes. Veuillez réessayer.');
        }
    } catch (error) {
        console.error('Erreur lors du passage des commandes:', error);
        alert('Une erreur est survenue. Veuillez réessayer plus tard.');
    }
}

// Ajouter l'événement au bouton de paiement
document.addEventListener('DOMContentLoaded', function() {
    const checkoutButton = document.querySelector('.checkout-btn');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', checkout);
    }
    
    // Assurez-vous d'ajouter fetchUserOrders à la portée globale
    // si cette fonction n'est pas définie ailleurs
    window.fetchUserOrders = async function() {
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
    };
    
    // Fonction pour mettre à jour le compteur de commandes
    window.updateOrdersCount = function() {
        const ordersButton = document.getElementById('orders-button');
        if (ordersButton) {
            const ordersIcon = ordersButton.querySelector('.orders-icon');
            if (ordersIcon) {
                // Supprimer l'ancien compteur s'il existe
                const oldCount = ordersIcon.querySelector('.cart-count');
                if (oldCount) {
                    ordersIcon.removeChild(oldCount);
                }
                
                // Créer le nouveau compteur
                const ordersCountElement = document.createElement('span');
                ordersCountElement.className = 'cart-count';
                ordersCountElement.id = 'orders-count';
                ordersCountElement.textContent = userOrders.length;
                
                // Ajouter le nouveau compteur
                ordersIcon.appendChild(ordersCountElement);
            }
        }
    };
});

    // Fonction d'initialisation
    function init() {
        checkAuthStatus();
        setupLogout();
    }

    // Démarrer l'application
    init();
});
