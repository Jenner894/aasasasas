// Script pour la page des commandes (commandes.js)
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'état d'authentification
    checkAuthStatus();
    
    // Charger les commandes de l'utilisateur
    loadUserOrders();
    
    // Initialiser les filtres et écouteurs d'événements
    initFilterButtons();
    initExpandButtons();
    setupSearchOrder();
    
    // Initialiser le modal de chat
    initChatModal();
});

// Vérifier si l'utilisateur est authentifié
function checkAuthStatus() {
    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                window.location.href = '/login.html';
            } else {
                // Mettre à jour l'interface avec le nom d'utilisateur
                const username = data.user.username;
                updateUserInterface(username);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification du statut d\'authentification:', error);
            window.location.href = '/login.html';
        });
}

// Mettre à jour l'interface avec les informations de l'utilisateur
function updateUserInterface(username) {
    // Mettre à jour l'interface si nécessaire (par exemple, afficher le nom d'utilisateur)
    const userProfileButton = document.getElementById('profile-button');
    if (userProfileButton) {
        userProfileButton.innerHTML = `<div class="profile-icon">👤</div>${username}`;
    }
}

// Charger les commandes de l'utilisateur depuis l'API
function loadUserOrders() {
    // Afficher un indicateur de chargement
    const ordersList = document.querySelector('.orders-list');
    ordersList.innerHTML = '<div class="loading-indicator">Chargement des commandes...</div>';
    
    fetch('/api/orders/user')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayOrders(data.orders);
            } else {
                ordersList.innerHTML = '<div class="error-message">Erreur lors du chargement des commandes</div>';
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des commandes:', error);
            ordersList.innerHTML = '<div class="error-message">Erreur de connexion au serveur</div>';
        });
}

// Afficher les commandes dans l'interface
function displayOrders(orders) {
    const ordersList = document.querySelector('.orders-list');
    
    // Vider la liste des commandes
    ordersList.innerHTML = '';
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<div class="no-orders">Vous n\'avez pas encore de commandes</div>';
        return;
    }
    
    // Trier les commandes par date (plus récentes en premier)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Créer un élément pour chaque commande
    orders.forEach(order => {
        const orderElement = createOrderElement(order);
        ordersList.appendChild(orderElement);
    });
    
    // Ajouter les écouteurs d'événements pour l'expansion des détails
    initExpandButtons();
}

// Créer un élément HTML pour une commande
function createOrderElement(order) {
    // Formater la date
    const orderDate = new Date(order.createdAt);
    const formattedDate = orderDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    // Créer l'élément de la commande
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.setAttribute('data-status', order.status.toLowerCase().replace(' ', '-'));
    orderCard.setAttribute('data-order-id', order._id);
    
    // Générer un ID de commande plus lisible (si nécessaire)
    const displayOrderId = order.orderNumber || `BD${orderDate.getFullYear().toString().slice(2)}${(orderDate.getMonth() + 1).toString().padStart(2, '0')}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    
    // Structure de la carte de commande
    orderCard.innerHTML = `
        <div class="order-header">
            <div class="order-id">Commande #${displayOrderId}</div>
            <div class="order-date">${formattedDate}</div>
            <div class="order-status status-${getStatusClass(order.status)}">${order.status}</div>
            <div class="expand-icon">▼</div>
        </div>
        <div class="order-body">
            <div class="order-products">
                <div class="product-item">
                    <div class="product-icon">🌿</div>
                    <div class="product-info">
                        <div class="product-name">${order.productName}</div>
                        <div class="product-details">
                            <div class="product-quantity">${order.quantity}g</div>
                            <div class="product-price">${order.totalPrice.toFixed(2)}€</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="order-summary">
                <div class="summary-row">
                    <div>Sous-total</div>
                    <div>${(order.totalPrice - 5).toFixed(2)}€</div>
                </div>
                <div class="summary-row">
                    <div>Frais de livraison</div>
                    <div>5,00€</div>
                </div>
                <div class="summary-row">
                    <div>Total</div>
                    <div>${order.totalPrice.toFixed(2)}€</div>
                </div>
            </div>
            
            <!-- Tracking info -->
            <div class="tracking-info">
                <div class="tracking-title">
                    <span class="tracking-title-icon">🚚</span> Suivi de commande
                </div>
                <div class="tracking-steps">
                    <div class="tracking-line"></div>
                    ${generateTrackingSteps(order.status)}
                </div>
            </div>
            
            <div class="order-actions">
                <button class="action-btn chat-btn" data-order="${displayOrderId}">
                    <span class="chat-btn-icon">💬</span> Chatter avec le livreur
                </button>
                <button class="action-btn secondary tracking-btn">
                    <span class="tracking-btn-icon">🔄</span> Actualiser le suivi
                </button>
            </div>
        </div>
    `;
    
    return orderCard;
}

// Générer les étapes de suivi en fonction du statut
function generateTrackingSteps(status) {
    const steps = [
        { title: 'Commande confirmée', description: 'Votre commande a été reçue et confirmée' },
        { title: 'En préparation', description: 'Votre commande est en cours de préparation' },
        { title: 'Prête pour livraison', description: 'Votre commande sera bientôt prête à être récupérée' },
        { title: 'Livraison en main propre', description: 'Paiement et remise en main propre' }
    ];
    
    let currentStepIndex = -1;
    
    switch(status) {
        case 'En attente':
            currentStepIndex = 0;
            break;
        case 'En préparation':
            currentStepIndex = 1;
            break;
        case 'Expédié':
        case 'Prête pour livraison':
            currentStepIndex = 2;
            break;
        case 'Livré':
            currentStepIndex = 3;
            break;
        default:
            currentStepIndex = 0;
    }
    
    let stepsHTML = '';
    const now = new Date();
    const formattedDate = `${now.getDate()} Mars ${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    steps.forEach((step, index) => {
        let stepClass = '';
        let stepDate = '-';
        
        if (index < currentStepIndex) {
            stepClass = 'completed';
            stepDate = formattedDate; // Pour simplifier, on utilise la même date pour toutes les étapes complétées
        } else if (index === currentStepIndex) {
            stepClass = 'active';
            stepDate = formattedDate;
        }
        
        stepsHTML += `
            <div class="tracking-step">
                <div class="step-marker ${stepClass}"></div>
                <div class="step-content">
                    <div class="step-title">${step.title}</div>
                    <div class="step-date">${stepDate}</div>
                    <div class="step-description">${step.description}</div>
                </div>
            </div>
        `;
    });
    
    return stepsHTML;
}

// Obtenir la classe CSS correspondant au statut
function getStatusClass(status) {
    switch(status) {
        case 'En attente':
            return 'pending';
        case 'En préparation':
            return 'processing';
        case 'Expédié':
            return 'shipped';
        case 'Livré':
            return 'delivered';
        case 'Annulé':
            return 'cancelled';
        default:
            return 'pending';
    }
}

// Initialiser les boutons de filtre
function initFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const orderCards = document.querySelectorAll('.order-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Mettre à jour la classe active
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filtrer les commandes
            const filter = this.getAttribute('data-filter');
            
            document.querySelectorAll('.order-card').forEach(card => {
                if (filter === 'all' || card.getAttribute('data-status') === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// Initialiser les boutons d'expansion
function initExpandButtons() {
    const orderCards = document.querySelectorAll('.order-card');
    
    orderCards.forEach(card => {
        const header = card.querySelector('.order-header');
        
        header.addEventListener('click', function() {
            card.classList.toggle('expanded');
        });
    });
}

// Configurer la recherche de commandes
function setupSearchOrder() {
    const searchInput = document.querySelector('.search-order');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            document.querySelectorAll('.order-card').forEach(card => {
                const orderID = card.querySelector('.order-id').textContent.toLowerCase();
                const orderDate = card.querySelector('.order-date').textContent.toLowerCase();
                const orderStatus = card.querySelector('.order-status').textContent.toLowerCase();
                
                // Rechercher aussi dans les produits si la carte est développée
                let productsMatch = false;
                const productItems = card.querySelectorAll('.product-name');
                
                productItems.forEach(item => {
                    if (item.textContent.toLowerCase().includes(searchTerm)) {
                        productsMatch = true;
                    }
                });
                
                if (orderID.includes(searchTerm) || 
                    orderDate.includes(searchTerm) || 
                    orderStatus.includes(searchTerm) ||
                    productsMatch) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    } else {
        // Créer l'input de recherche s'il n'existe pas
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Rechercher une commande...';
        searchInput.className = 'search-order';
        searchInput.style.padding = '10px 15px';
        searchInput.style.borderRadius = '25px';
        searchInput.style.border = '1px solid #ddd';
        searchInput.style.margin = '0 0 20px 0';
        searchInput.style.width = '100%';
        searchInput.style.fontSize = '14px';
        
        // Insérer le champ de recherche avant les filtres
        const filtersContainer = document.querySelector('.orders-filter');
        filtersContainer.parentNode.insertBefore(searchInput, filtersContainer);
        
        // Ajouter l'écouteur d'événement
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            
            document.querySelectorAll('.order-card').forEach(card => {
                const orderID = card.querySelector('.order-id').textContent.toLowerCase();
                const orderDate = card.querySelector('.order-date').textContent.toLowerCase();
                const orderStatus = card.querySelector('.order-status').textContent.toLowerCase();
                
                // Rechercher aussi dans les produits
                let productsMatch = false;
                const productItems = card.querySelectorAll('.product-name');
                
                productItems.forEach(item => {
                    if (item.textContent.toLowerCase().includes(searchTerm)) {
                        productsMatch = true;
                    }
                });
                
                if (orderID.includes(searchTerm) || 
                    orderDate.includes(searchTerm) || 
                    orderStatus.includes(searchTerm) ||
                    productsMatch) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

// Initialiser le modal de chat
function initChatModal() {
    // Vérifier si le modal de chat existe déjà
    let chatModal = document.getElementById('chat-modal');
    
    // Créer le modal s'il n'existe pas
    if (!chatModal) {
        chatModal = document.createElement('div');
        chatModal.id = 'chat-modal';
        chatModal.className = 'modal';
        
        chatModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Chat avec le livreur - Commande #<span id="chat-order-id"></span></div>
                    <button class="modal-close" id="close-chat-modal">×</button>
                </div>
                <div class="modal-body">
                    <div class="chat-container">
                        <div class="chat-messages" id="chat-messages">
                            <div class="system-message">
                                Début de la conversation avec votre livreur.
                            </div>
                            <div class="message message-other">
                                <div class="message-sender">Livreur</div>
                                Bonjour ! Je suis votre livreur pour la commande. Je vous contacterai dès que votre commande sera prête à être livrée.
                                <div class="message-time">Aujourd'hui, ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</div>
                            </div>
                        </div>
                        <div class="chat-input">
                            <input type="text" placeholder="Tapez votre message..." id="chat-input-field">
                            <button id="send-chat-message">➤</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(chatModal);
        
        // Ajouter les événements pour le modal
        document.getElementById('close-chat-modal').addEventListener('click', function() {
            chatModal.classList.remove('active');
        });
        
        // Gérer l'envoi de message
        document.getElementById('send-chat-message').addEventListener('click', sendChatMessage);
        document.getElementById('chat-input-field').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Ajouter les événements pour les boutons de chat
    document.querySelectorAll('.chat-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Empêcher l'ouverture/fermeture de la carte
            
            const orderId = this.getAttribute('data-order');
            document.getElementById('chat-order-id').textContent = orderId;
            
            // Charger les messages précédents (simulation)
            // Dans une implémentation réelle, vous feriez un appel API ici
            loadChatHistory(orderId);
            
            // Afficher le modal
            chatModal.classList.add('active');
        });
    });
}

// Charger l'historique du chat (simulation)
function loadChatHistory(orderId) {
    // Dans une implémentation réelle, vous feriez un appel API ici
    // Simulation d'une conversation
    const chatMessages = document.getElementById('chat-messages');
    
    // Conserver uniquement le message système et le premier message du livreur
    chatMessages.innerHTML = `
        <div class="system-message">
            Début de la conversation avec votre livreur.
        </div>
        <div class="message message-other">
            <div class="message-sender">Livreur</div>
            Bonjour ! Je suis votre livreur pour la commande #${orderId}. Je vous contacterai dès que votre commande sera prête à être livrée.
            <div class="message-time">Aujourd'hui, ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</div>
        </div>
    `;
    
    // Faire défiler jusqu'au bas
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Envoyer un message dans le chat
function sendChatMessage() {
    const inputField = document.getElementById('chat-input-field');
    const messageText = inputField.value.trim();
    
    if (messageText) {
        const chatMessages = document.getElementById('chat-messages');
        const time = `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`;
        
        // Ajouter le message de l'utilisateur
        chatMessages.innerHTML += `
            <div class="message message-user">
                <div class="message-sender">Vous</div>
                ${messageText}
                <div class="message-time">Aujourd'hui, ${time}</div>
            </div>
        `;
        
        // Effacer le champ de saisie
        inputField.value = '';
        
        // Faire défiler jusqu'au bas
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simuler une réponse du livreur après un court délai
        setTimeout(function() {
            simulateDeliveryResponse(chatMessages);
        }, 1000 + Math.random() * 2000);
    }
}

// Simuler une réponse du livreur
function simulateDeliveryResponse(chatMessages) {
    const responses = [
        "Je viens de recevoir votre commande, je la prépare immédiatement.",
        "Votre commande est en cours de préparation. Je vous tiens au courant.",
        "Je serai dans votre secteur dans environ 30 minutes.",
        "Je viens de terminer une livraison, je serai chez vous bientôt.",
        "N'hésitez pas à me donner des indications précises pour vous trouver.",
        "Je confirme avoir reçu votre message, à bientôt!"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const time = `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    
    // Ajouter la réponse du livreur
    chatMessages.innerHTML += `
        <div class="message message-other">
            <div class="message-sender">Livreur</div>
            ${randomResponse}
            <div class="message-time">Aujourd'hui, ${time}</div>
        </div>
    `;
    
    // Faire défiler jusqu'au bas
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Gestion de la sidebar
document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const mainContent = document.getElementById('main-content');
    
    // Ouvrir la sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.add('open');
        });
    }
    
    // Fermer la sidebar
    if (closeSidebar) {
        closeSidebar.addEventListener('click', function() {
            sidebar.classList.remove('open');
        });
    }
    
    // Fermer la sidebar en cliquant en dehors
    if (mainContent) {
        mainContent.addEventListener('click', function(e) {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }
    
    // Gérer la déconnexion
    const logoutItem = document.getElementById('logout-item');
    if (logoutItem) {
        logoutItem.addEventListener('click', function() {
            window.location.href = '/api/auth/logout';
        });
    }
});
////////////////////////////////////////////////fille d'attente /



// Variables globales pour la file d'attente
let queueUpdateInterval = null;
let activeOrderId = null;
let queueRefreshRate = 30000; // 30 secondes par défaut

// Fonction pour créer le conteneur de file d'attente
function createQueueContainer() {
    console.log('Création du conteneur de file d\'attente');
    
    // Trouver l'élément parent où insérer la file d'attente
    const orderSection = document.querySelector('.order-section');
    if (!orderSection) {
        console.error('Section des commandes non trouvée');
        return null;
    }
    
    // Créer le conteneur
    const queueContainer = document.createElement('div');
    queueContainer.id = 'queue-container';
    queueContainer.className = 'queue-container';
    
    // Insérer en haut de la section des commandes, après le titre
    const orderSectionTitle = orderSection.querySelector('h2');
    if (orderSectionTitle) {
        orderSectionTitle.after(queueContainer);
    } else {
        orderSection.prepend(queueContainer);
    }
    
    return queueContainer;
}

// Mettre à jour le conteneur de file d'attente avec les nouvelles données
function updateQueueContainer(container, queueData) {
    if (!container || !queueData) return;
    
    // Extraire les informations de la file d'attente
    const { position, estimatedTime } = queueData.queueInfo;
    const status = queueData.status;
    
    // Formatter le temps estimé
    let formattedTime = '...';
    if (estimatedTime !== null) {
        if (estimatedTime <= 5) {
            formattedTime = 'Très bientôt';
        } else if (estimatedTime <= 60) {
            formattedTime = `${estimatedTime} min`;
        } else {
            const hours = Math.floor(estimatedTime / 60);
            const minutes = estimatedTime % 60;
            formattedTime = `${hours}h ${minutes}min`;
        }
    }
    
    // Déterminer la classe du statut
    let statusClass = '';
    switch (status) {
        case 'En attente':
            statusClass = 'queue-status-waiting';
            break;
        case 'En préparation':
            statusClass = 'queue-status-preparing';
            break;
        case 'Expédié':
            statusClass = 'queue-status-shipping';
            break;
        default:
            statusClass = 'queue-status-waiting';
    }
    
    // Calculer la progression (en %)
    let progressPercent = 0;
    if (status === 'En attente') {
        progressPercent = 0;
    } else if (status === 'En préparation') {
        progressPercent = 50;
    } else if (status === 'Expédié') {
        progressPercent = 90;
    }
    
    // Mise à jour du HTML
    container.innerHTML = `
        <div class="queue-header">
            <div class="queue-title">
                <span class="queue-icon">🚩</span> File d'attente de livraison
            </div>
            <div class="queue-status ${statusClass}">${status}</div>
        </div>
        
        <div class="queue-info">
            <div class="queue-info-item">
                <div class="queue-info-value">${position || '-'}</div>
                <div class="queue-info-label">Position</div>
            </div>
            <div class="queue-info-item">
                <div class="queue-info-value">${formattedTime}</div>
                <div class="queue-info-label">Temps estimé</div>
            </div>
            <div class="queue-info-item">
                <div class="queue-info-value">${status}</div>
                <div class="queue-info-label">Statut</div>
            </div>
        </div>
        
        <div class="queue-progress">
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-markers">
                <div class="progress-marker ${status === 'En attente' || status === 'En préparation' || status === 'Expédié' ? 'completed' : ''}"></div>
                <div class="progress-marker ${status === 'En préparation' || status === 'Expédié' ? 'completed' : ''}"></div>
                <div class="progress-marker ${status === 'Expédié' ? 'completed' : ''}"></div>
                <div class="progress-marker"></div>
            </div>
            <div class="progress-labels">
                <div class="progress-label">Reçue</div>
                <div class="progress-label">Préparation</div>
                <div class="progress-label">En route</div>
                <div class="progress-label">Livrée</div>
            </div>
        </div>
        
        <div class="queue-notification queue-notification-info">
            <span class="queue-notification-icon">ℹ️</span>
            <span>Votre commande est en cours de traitement. Vous serez alerté quand votre livreur sera en chemin.</span>
        </div>
    `;
    
    // Ajouter une classe pour l'animation de mise à jour
    container.classList.add('queue-update');
    
    // Supprimer la classe après l'animation
    setTimeout(() => {
        container.classList.remove('queue-update');
    }, 2000);
}

// Cacher le conteneur de file d'attente
function hideQueueContainer() {
    const container = document.getElementById('queue-container');
    if (container) {
        container.style.display = 'none';
    }
}

// Afficher une notification de livraison
function showDeliveryNotification() {
    // Vérifier si une notification existe déjà
    let notification = document.querySelector('.delivery-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'delivery-notification';
        notification.innerHTML = `
            <div class="delivery-notification-icon">🎉</div>
            <div class="delivery-notification-content">
                <div class="delivery-notification-title">Commande livrée</div>
                <div class="delivery-notification-message">Votre commande a été livrée avec succès!</div>
            </div>
            <button class="delivery-notification-close">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Ajouter un gestionnaire d'événements pour fermer la notification
        notification.querySelector('.delivery-notification-close').addEventListener('click', () => {
            notification.classList.remove('active');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Afficher la notification après un court délai
        setTimeout(() => {
            notification.classList.add('active');
        }, 100);
        
        // Fermer automatiquement après 10 secondes
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('active');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 10000);
    }
}

// Gestion des changements de visibilité de page (pause/reprise des mises à jour)
function handleVisibilityChange() {
    if (document.hidden) {
        // Page non visible, augmenter l'intervalle pour économiser les ressources
        if (queueUpdateInterval) {
            clearInterval(queueUpdateInterval);
            queueRefreshRate = 60000; // 1 minute quand la page est cachée
        }
    } else {
        // Page visible à nouveau, rétablir l'intervalle normal
        if (queueUpdateInterval) {
            clearInterval(queueUpdateInterval);
        }
        
        // Mettre à jour immédiatement
        if (activeOrderId) {
            fetchQueueInfo(activeOrderId).then(displayQueueInfo);
        }
        
        // Rétablir l'intervalle normal
        queueRefreshRate = 30000; // 30 secondes
        if (activeOrderId) {
            queueUpdateInterval = setInterval(() => {
                fetchQueueInfo(activeOrderId).then(displayQueueInfo);
            }, queueRefreshRate);
        }
    }
}

// Récupérer les informations de file d'attente
async function fetchQueueInfo(orderId) {
    try {
        console.log(`Récupération des infos de file d'attente pour la commande ${orderId}`);
        const response = await fetch(`/api/orders/${orderId}/queue`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('Erreur HTTP:', response.status, response.statusText);
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de file d\'attente:', error);
        return null;
    }
}

// Initialisation de la file d'attente
function initQueueSystem() {
    console.log('Initialisation du système de file d\'attente');
    
    // Arrêter tout intervalle précédent
    if (queueUpdateInterval) {
        clearInterval(queueUpdateInterval);
    }
    
    // Trouver la commande active (la plus récente non livrée/annulée)
    const orderCards = document.querySelectorAll('.order-card');
    let activeOrder = null;
    
    // Parcourir les cartes de commande pour trouver la plus récente active
    orderCards.forEach(card => {
        const status = card.getAttribute('data-status');
        if (status !== 'delivered' && status !== 'cancelled') {
            // Si pas encore d'active ou date plus récente
            if (!activeOrder) {
                activeOrder = card;
            } else {
                const dateText1 = activeOrder.querySelector('.order-date').textContent;
                const dateText2 = card.querySelector('.order-date').textContent;
                const date1 = new Date(dateText1);
                const date2 = new Date(dateText2);
                
                if (date2 > date1) {
                    activeOrder = card;
                }
            }
        }
    });
    
    if (activeOrder) {
        activeOrderId = activeOrder.getAttribute('data-order-id');
        console.log('Commande active trouvée:', activeOrderId);
        
        // Afficher la file d'attente initiale
        fetchQueueInfo(activeOrderId).then(queueData => {
            if (queueData && queueData.success && queueData.inQueue) {
                // Créer et afficher le conteneur de file d'attente
                const queueContainer = createQueueContainer();
                updateQueueContainer(queueContainer, queueData);
                
                // Démarrer les mises à jour périodiques
                queueUpdateInterval = setInterval(() => {
                    fetchQueueInfo(activeOrderId).then(data => {
                        if (data && data.success) {
                            if (data.inQueue) {
                                updateQueueContainer(queueContainer, data);
                            } else {
                                // Commande livrée ou annulée
                                hideQueueContainer();
                                clearInterval(queueUpdateInterval);
                                
                                // Notification si livrée
                                if (data.message === 'Commande livrée') {
                                    showDeliveryNotification();
                                }
                            }
                        }
                    });
                }, queueRefreshRate);
                
                // Ajouter des écouteurs d'événements pour les notifications de mise à jour
                document.addEventListener('visibilitychange', handleVisibilityChange);
            }
        });
    } else {
        console.log('Aucune commande active trouvée');
    }
}

// Ajouter CSS pour la notification de livraison
function addDeliveryNotificationStyles() {
    // Vérifier si les styles existent déjà
    if (!document.getElementById('delivery-notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'delivery-notification-styles';
        
        // Ajouter les styles CSS
        styleSheet.innerHTML = `
        .delivery-notification {
            position: fixed;
            bottom: 30px;
            right: 30px;
            display: flex;
            align-items: center;
            background-color: white;
            border-radius: 12px;
            padding: 15px 20px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 400px;
            transform: translateY(100px);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
        }
        
        .delivery-notification.active {
            transform: translateY(0);
            opacity: 1;
        }
        
        .delivery-notification-icon {
            font-size: 2rem;
            margin-right: 15px;
        }
        
        .delivery-notification-content {
            flex: 1;
        }
        
        .delivery-notification-title {
            font-weight: bold;
            margin-bottom: 3px;
            color: var(--dark-blue);
        }
        
        .delivery-notification-message {
            font-size: 0.9rem;
            color: #666;
        }
        
        .delivery-notification-close {
            background: none;
            border: none;
            color: #aaa;
            font-size: 1.2rem;
            cursor: pointer;
            margin-left: 10px;
            padding: 5px;
        }
        
        @media (max-width: 576px) {
            .delivery-notification {
                bottom: 20px;
                left: 20px;
                right: 20px;
                max-width: none;
            }
        }
        `;
        
        // Ajouter la feuille de style au head du document
        document.head.appendChild(styleSheet);
    }
}

// Ajouter l'initialisation du système de file d'attente au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Ajouter les styles pour la notification de livraison
    addDeliveryNotificationStyles();
    
    // Initialiser le système après le chargement des commandes
    const originalLoadUserOrders = window.loadUserOrders;
    
    // Remplacer la fonction loadUserOrders pour y ajouter notre initialisation
    window.loadUserOrders = function() {
        originalLoadUserOrders.apply(this, arguments);
        
        // Attendre que les commandes soient chargées avant d'initialiser la file d'attente
        setTimeout(initQueueSystem, 1000);
    };
    
    // Si les commandes sont déjà chargées, initialiser directement
    if (document.querySelectorAll('.order-card').length > 0) {
        initQueueSystem();
    }
});

// Créer une fonction de réinitialisation du système de file d'attente
// (à appeler après une mise à jour des commandes)
function resetQueueSystem() {
    if (queueUpdateInterval) {
        clearInterval(queueUpdateInterval);
        queueUpdateInterval = null;
    }
    
    activeOrderId = null;
    
    // Supprimer le conteneur existant
    const container = document.getElementById('queue-container');
    if (container) {
        container.remove();
    }
    
    // Réinitialiser
    initQueueSystem();
}

// Fonction pour afficher une alerte de notification quand une commande avance dans la file
function showQueueUpdateNotification(status) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = 'queue-update-notification';
    
    let icon = '📦';
    let message = 'Votre commande a été mise à jour!';
    
    switch (status) {
        case 'En préparation':
            icon = '👨‍🍳';
            message = 'Votre commande est maintenant en préparation!';
            break;
        case 'Expédié':
            icon = '🚚';
            message = 'Votre commande est en route!';
            break;
    }
    
    notification.innerHTML = `
        <div class="queue-update-notification-icon">${icon}</div>
        <div class="queue-update-notification-content">
            <div class="queue-update-notification-title">Mise à jour commande</div>
            <div class="queue-update-notification-message">${message}</div>
        </div>
    `;
    
    // Ajouter au document
    document.body.appendChild(notification);
    
    // Afficher après un court délai
    setTimeout(() => {
        notification.classList.add('active');
        
        // Jouer un son de notification si supporté
        if ('Audio' in window) {
            const notifSound = new Audio('/sounds/notification.mp3');
            notifSound.play().catch(e => console.log('Impossible de jouer le son de notification'));
        }
    }, 100);
    
    // Cacher et supprimer après 5 secondes
    setTimeout(() => {
        notification.classList.remove('active');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Ajouter des styles pour la notification de mise à jour
function addQueueUpdateNotificationStyles() {
    if (!document.getElementById('queue-update-notification-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'queue-update-notification-styles';
        
        styleSheet.innerHTML = `
        .queue-update-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--primary-blue) 0%, var(--dark-blue) 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            z-index: 9999;
            transform: translateX(120%);
            transition: transform 0.3s ease-out;
        }
        
        .queue-update-notification.active {
            transform: translateX(0);
        }
        
        .queue-update-notification-icon {
            font-size: 2rem;
            margin-right: 15px;
        }
        
        .queue-update-notification-title {
            font-weight: bold;
            margin-bottom: 3px;
        }
        
        .queue-update-notification-message {
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        @media (max-width: 576px) {
            .queue-update-notification {
                top: 10px;
                left: 10px;
                right: 10px;
                padding: 12px 15px;
            }
            
            .queue-update-notification-icon {
                font-size: 1.5rem;
                margin-right: 10px;
            }
        }
        `;
        
        document.head.appendChild(styleSheet);
    }
}

// Ajouter tous les styles supplémentaires au chargement du document
document.addEventListener('DOMContentLoaded', function() {
    addDeliveryNotificationStyles();
    addQueueUpdateNotificationStyles();
});

// Bouton pour développer/réduire toutes les commandes
document.addEventListener('DOMContentLoaded', function() {
    const filtersContainer = document.querySelector('.orders-filter');
    
    if (filtersContainer) {
        const expandAllBtn = document.createElement('button');
        expandAllBtn.textContent = 'Développer tout';
        expandAllBtn.className = 'filter-btn';
        expandAllBtn.style.marginLeft = 'auto';
        
        // Ajouter le bouton au container des filtres
        filtersContainer.appendChild(expandAllBtn);
        
        // État pour savoir si tout est développé ou non
        let allExpanded = false;
        
        // Fonction pour développer/réduire toutes les commandes
        expandAllBtn.addEventListener('click', function() {
            allExpanded = !allExpanded;
            
            document.querySelectorAll('.order-card').forEach(card => {
                if (allExpanded) {
                    card.classList.add('expanded');
                } else {
                    card.classList.remove('expanded');
                }
            });
            
            this.textContent = allExpanded ? 'Réduire tout' : 'Développer tout';
        });
    }
});

// Ajout de la fonctionnalité de tri des commandes
document.addEventListener('DOMContentLoaded', function() {
    const filtersContainer = document.querySelector('.orders-filter');
    
    if (filtersContainer) {
        const sortSelect = document.createElement('select');
        sortSelect.className = 'sort-select';
        sortSelect.style.padding = '8px 15px';
        sortSelect.style.borderRadius = '25px';
        sortSelect.style.border = '1px solid #ddd';
        sortSelect.style.marginLeft = '10px';
        sortSelect.style.fontSize = '14px';
        sortSelect.style.cursor = 'pointer';
        
        // Options de tri
        const sortOptions = [
            { value: 'date-desc', text: 'Date (récente d\'abord)' },
            { value: 'date-asc', text: 'Date (ancienne d\'abord)' },
            { value: 'status', text: 'Statut' }
        ];
        
        sortOptions.forEach(option => {
            const optElement = document.createElement('option');
            optElement.value = option.value;
            optElement.textContent = option.text;
            sortSelect.appendChild(optElement);
        });
        
        // Ajouter le sélecteur de tri après le bouton Développer tout (s'il existe)
        const expandAllBtn = filtersContainer.querySelector('button[textContent="Développer tout"]');
        if (expandAllBtn) {
            expandAllBtn.after(sortSelect);
        } else {
            filtersContainer.appendChild(sortSelect);
        }
        
        // Fonction de tri des commandes
        sortSelect.addEventListener('change', function() {
            const sortValue = this.value;
            const ordersList = document.querySelector('.orders-list');
            const cardsArray = Array.from(document.querySelectorAll('.order-card'));
            
            // Trier les cartes selon l'option choisie
            cardsArray.sort((a, b) => {
                if (sortValue === 'date-desc' || sortValue === 'date-asc') {
                    const dateA = new Date(a.querySelector('.order-date').textContent);
                    const dateB = new Date(b.querySelector('.order-date').textContent);
                    
                    return sortValue === 'date-desc' ? dateB - dateA : dateA - dateB;
                } else if (sortValue === 'status') {
                    const statusA = a.querySelector('.order-status').textContent;
                    const statusB = b.querySelector('.order-status').textContent;
                    
                    // Ordre des statuts : En attente, En préparation, En route, Livrée
                    const statusOrder = {
                        'En attente': 1,
                        'En préparation': 2,
                        'En route': 3,
                        'Prête pour livraison': 3,
                        'Livrée': 4
                    };
                    
                    return statusOrder[statusA] - statusOrder[statusB];
                }
                
                return 0;
            });
            
            // Réorganiser les cartes dans le DOM
            cardsArray.forEach(card => {
                ordersList.appendChild(card);
            });
        });
    }
});
