document.addEventListener('DOMContentLoaded', function() {
    // Fonctionnalités principales
    checkAuthStatus();
    setupModals();
    initFilterButtons();
    setupSearchOrder();
    initExpandButtons();
    
    // Créer le modal de chat s'il n'existe pas
    initChatModal();
    
    // Améliorer les animations des modaux
    enhanceModalAnimations();
    
    // Initialiser la section de file d'attente
    setTimeout(() => {
        console.log("Initialisation de la section file d'attente après délai");
        initInlineQueueSection();
    }, 500);
});

// Vérifier le statut d'authentification de l'utilisateur
function checkAuthStatus() {
    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                window.location.href = '/login.html';
            } else {
                // Mettre à jour l'interface avec le nom d'utilisateur
                updateUserInterface(data.user.username);
                // Charger les commandes de l'utilisateur
                loadUserOrders();
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification du statut d\'authentification:', error);
            window.location.href = '/login.html';
        });
}

// Mettre à jour l'interface avec les informations de l'utilisateur
function updateUserInterface(username) {
    const userProfileButton = document.getElementById('profile-button');
    if (userProfileButton) {
        userProfileButton.innerHTML = `<div class="profile-icon">👤</div>${username}`;
    }
}

// Charger les commandes de l'utilisateur
function loadUserOrders() {
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
    
    // Initialiser les aperçus de file d'attente
    initQueuePreview();
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
    
    // Générer un ID de commande plus lisible
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
                <button class="action-btn queue-btn" data-order="${displayOrderId}">
                    <span class="queue-btn-icon">🔢</span> File d'attente
                </button>
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
            stepDate = formattedDate; // Pour simplifier, même date pour toutes les étapes complétées
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

// Configuration des modals et boutons
function setupModals() {
    // Configuration du modal de chat
    const chatModal = document.getElementById('chat-modal');
    const closeChatModal = document.getElementById('close-chat-modal');
    
    if (chatModal && closeChatModal) {
        closeChatModal.addEventListener('click', function() {
            chatModal.classList.remove('active');
        });
    }
    
    // Fermer le modal en cliquant en dehors
    window.addEventListener('click', function(e) {
        if (e.target === chatModal) {
            chatModal.classList.remove('active');
        }
    });
    
    // Configurer les boutons qui ouvrent le modal de chat
    document.addEventListener('click', function(e) {
        if (e.target.closest('.chat-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.closest('.chat-btn');
            const orderId = button.getAttribute('data-order');
            
            if (chatModal) {
                document.getElementById('chat-order-id').textContent = orderId;
                loadChatHistory(orderId);
                chatModal.classList.add('active');
            }
        }
    });
    
    // Configurer les boutons de la file d'attente
    document.addEventListener('click', function(e) {
        if (e.target.closest('.queue-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.closest('.queue-btn');
            const orderId = button.getAttribute('data-order');
            
            updateAndShowInlineQueueSection(orderId);
            document.getElementById('queue-section').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

function initInlineQueueSection() {
    console.log("Initialisation de la section file d'attente");
    
    // Vérifier si les éléments nécessaires existent
    const queueSection = document.getElementById('queue-section');
    const noQueueMessage = document.getElementById('no-queue-message');
    const queueDetails = document.getElementById('queue-details');
    
    if (!queueSection || !noQueueMessage || !queueDetails) {
        console.error("Éléments de la file d'attente manquants dans le DOM");
        return;
    }
    
    // Assurer que la section est visible
    queueSection.style.display = 'block';
    
    // Essayer de trouver une commande active dans la file d'attente
    const activeOrders = findActiveOrdersInQueue();
    console.log("Commandes actives trouvées:", activeOrders);
    
    if (activeOrders.length > 0) {
        // Prendre la commande la plus récente
        const mostRecentOrder = activeOrders[0];
        updateAndShowInlineQueueSection(mostRecentOrder.orderId);
    } else {
        // Afficher le message "aucune commande"
        showNoQueueMessage();
    }
  // Ajouter l'événement pour actualiser
    const refreshButton = document.getElementById('inline-refresh-queue');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            const orderId = document.getElementById('queue-active-order-id').textContent;
            updateInlineQueueData(orderId);
        });
    }
}

// Amélioration de la fonction pour trouver les commandes actives
function findActiveOrdersInQueue() {
    const activeOrders = [];
    
    console.log("Recherche des commandes actives...");
    
    // Parcourir toutes les cartes de commande qui ne sont pas livrées ou annulées
    const orderCards = document.querySelectorAll('.order-card');
    console.log(`Nombre de cartes de commande trouvées: ${orderCards.length}`);
    
    orderCards.forEach(card => {
        const status = card.getAttribute('data-status');
        console.log(`Commande avec statut: ${status}`);
        
        if (status && status !== 'delivered' && status !== 'cancelled') {
            // Extraire l'ID de la commande
            const orderIdElement = card.querySelector('.order-id');
            if (orderIdElement) {
                const orderIdText = orderIdElement.textContent;
                console.log(`Texte ID de commande: ${orderIdText}`);
                
                const match = orderIdText.match(/Commande #([A-Z0-9]+)/);
                if (match) {
                    console.log(`Commande active trouvée: ${match[1]}`);
                    activeOrders.push({
                        orderId: match[1],
                        status: status,
                        element: card
                    });
                }
            }
        }
    });
    
    // Trier par statut (priorité: processing, pending, shipped)
    const sortedOrders = activeOrders.sort((a, b) => {
        const priority = {
            'processing': 1,
            'pending': 2,
            'shipped': 3
        };
        return (priority[a.status] || 4) - (priority[b.status] || 4);
    });
    
    console.log(`Commandes actives triées: ${sortedOrders.length}`);
    return sortedOrders;
}
function updateAndShowInlineQueueSection(orderId) {
    console.log(`Mise à jour de la section file d'attente pour la commande: ${orderId}`);
    
    // Vérifier si les éléments nécessaires existent
    const queueActiveOrderId = document.getElementById('queue-active-order-id');
    const noQueueMessage = document.getElementById('no-queue-message');
    const queueDetails = document.getElementById('queue-details');
    
    if (!queueActiveOrderId || !noQueueMessage || !queueDetails) {
        console.error("Éléments requis introuvables pour la mise à jour de la file d'attente");
        return;
    }
    
    // Mettre à jour l'ID de commande affiché
    queueActiveOrderId.textContent = orderId;
    
    // Masquer le message "aucune commande"
    noQueueMessage.style.display = 'none';
    
    // Afficher les détails de la file d'attente
    queueDetails.style.display = 'block';
    
    // Charger les données réelles de la file d'attente
    updateInlineQueueData(orderId);
}

// Afficher le message "aucune commande dans la file d'attente"
function showNoQueueMessage() {
    console.log("Affichage du message 'aucune commande dans la file d'attente'");
    
    const noQueueMessage = document.getElementById('no-queue-message');
    const queueDetails = document.getElementById('queue-details');
    
    if (noQueueMessage) {
        noQueueMessage.style.display = 'flex';
    } else {
        console.error("Élément no-queue-message introuvable");
    }
    
    if (queueDetails) {
        queueDetails.style.display = 'none';
    } else {
        console.error("Élément queue-details introuvable");
    }
}


// Mettre à jour les données de la file d'attente
function updateInlineQueueData(orderId) {
    console.log('Mise à jour des données pour la commande:', orderId);
    
    // Afficher des valeurs de chargement
    const positionElement = document.getElementById('inline-queue-position');
    const timeElement = document.getElementById('inline-queue-time');
    const statusElement = document.getElementById('inline-queue-status');
    
    if (positionElement) positionElement.textContent = "...";
    if (timeElement) timeElement.textContent = "Chargement...";
    if (statusElement) statusElement.textContent = "Chargement...";
    
    // Simuler un appel API (comme le serveur n'est pas disponible)
    setTimeout(() => {
        // Simuler des données de file d'attente
        const queueData = {
            success: true,
            inQueue: true,
            queueInfo: {
                position: 3,
                estimatedTime: 30
            },
            status: 'En préparation'
        };
        
        // Mettre à jour les informations de file d'attente
        if (positionElement) positionElement.textContent = queueData.queueInfo.position;
        
        // Mettre à jour le temps estimé
        if (timeElement) timeElement.textContent = '30-45 min';
        
        if (statusElement) {
            statusElement.textContent = queueData.status;
            
            // Mettre à jour la classe CSS du statut
            statusElement.className = 'queue-status';
            statusElement.classList.add('status-processing');
        }
        
        // Mettre à jour les marqueurs et la progression
        updateInlineQueueStepMarkers(queueData.status);
        
        // Mettre à jour l'heure de la dernière mise à jour
        const now = new Date();
        const timeString = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
        const lastUpdatedElement = document.getElementById('inline-last-updated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = 'Dernière mise à jour: ' + timeString;
        }
    }, 1000);
}

// Mettre à jour les marqueurs d'étape de la file d'attente
function updateInlineQueueStepMarkers(status) {
    // Récupérer tous les marqueurs d'étape
    const markers = document.querySelectorAll('#queue-details .queue-marker');
    
    // Réinitialiser tous les marqueurs
    markers.forEach(marker => {
        marker.classList.remove('active');
    });
    
    // Activer les marqueurs appropriés en fonction du statut
    switch(status) {
        case 'En attente':
            // Activer uniquement le premier marqueur (Confirmation)
            if (markers[0]) markers[0].classList.add('active');
            break;
            
        case 'En préparation':
            // Activer les deux premiers marqueurs (Confirmation et Préparation)
            if (markers[0]) markers[0].classList.add('active');
            if (markers[1]) markers[1].classList.add('active');
            break;
            
        case 'Expédié':
        case 'En route':
        case 'Prête pour livraison':
            // Activer les trois premiers marqueurs
            if (markers[0]) markers[0].classList.add('active');
            if (markers[1]) markers[1].classList.add('active');
            if (markers[2]) markers[2].classList.add('active');
            break;
            
        case 'Livré':
            // Activer tous les marqueurs
            markers.forEach(marker => {
                marker.classList.add('active');
            });
            break;
            
        case 'Annulé':
            // Pour les commandes annulées, garder juste le premier marqueur
            if (markers[0]) markers[0].classList.add('active');
            break;
            
        default:
            // Par défaut, activer seulement le premier marqueur
            if (markers[0]) markers[0].classList.add('active');
    }
    
    // Mettre à jour la barre de progression
    let progressPercentage = 0;
    
    switch(status) {
        case 'En attente':
            progressPercentage = 25;
            break;
        case 'En préparation':
            progressPercentage = 50;
            break;
        case 'Expédié':
        case 'En route':
        case 'Prête pour livraison':
            progressPercentage = 75;
            break;
        case 'Livré':
            progressPercentage = 100;
            break;
        case 'Annulé':
            progressPercentage = 25;
            break;
        default:
            progressPercentage = 25;
    }
    
    // Mettre à jour la barre de progression
    const progressBar = document.getElementById('inline-queue-progress');
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
    }
}

// Initialiser les aperçus de file d'attente dans les cartes de commande
function initQueuePreview() {
    // Récupérer toutes les commandes actives
    const orderCards = document.querySelectorAll('.order-card:not([data-status="delivered"]):not([data-status="cancelled"])');
    
    orderCards.forEach(card => {
        // Extraire l'ID de la commande depuis la carte
        const orderIdElement = card.querySelector('.order-id');
        if (!orderIdElement) return;
        
        const orderIdText = orderIdElement.textContent;
        const match = orderIdText.match(/Commande #([A-Z0-9]+)/);
        if (!match) return;
        
        const orderDisplayId = match[1];
        const orderDataId = card.getAttribute('data-order-id');
        
        // Utiliser l'ID stocké dans data-order-id s'il existe, sinon utiliser l'ID affiché
        const orderId = orderDataId || orderDisplayId;
        
        // Afficher des valeurs de chargement pour l'indicateur de position
        let queueIndicator = card.querySelector('.queue-position-indicator');
        
        if (!queueIndicator) {
            // Créer l'élément s'il n'existe pas
            queueIndicator = document.createElement('div');
            queueIndicator.className = 'queue-position-indicator';
            
            // Insérer avant l'icône d'expansion
            const expandIcon = card.querySelector('.expand-icon');
            if (expandIcon && expandIcon.parentNode) {
                expandIcon.parentNode.insertBefore(queueIndicator, expandIcon);
            }
        }
        
        queueIndicator.innerHTML = `
            <span class="position-icon">🔄</span>
            <span>Chargement...</span>
        `;
        
        // Charger les informations de file d'attente pour chaque commande
        fetchQueueInfo(orderId, card);
    });
}

// Récupérer les informations de file d'attente d'une commande
function fetchQueueInfo(orderId, orderCard) {
    fetch(`/api/orders/${orderId}/queue`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.inQueue) {
                // Obtenir l'indicateur de position
                const queueIndicator = orderCard.querySelector('.queue-position-indicator');
                if (!queueIndicator) return;
                
                // Mettre à jour le contenu avec la position réelle
                queueIndicator.innerHTML = `
                    <span class="position-icon">🚶</span>
                    <span>Position: ${data.queueInfo.position}</span>
                `;
                
                // Mettre à jour le style en fonction de la position
                if (data.queueInfo.position <= 2) {
                    queueIndicator.style.color = 'var(--status-shipped)';
                    queueIndicator.style.fontWeight = 'bold';
                } else if (data.queueInfo.position <= 5) {
                    queueIndicator.style.color = 'var(--status-processing)';
                } else {
                    queueIndicator.style.color = 'var(--text-dark)';
                }
                
                // Stocker la position dans l'attribut data pour une utilisation ultérieure
                orderCard.setAttribute('data-queue-position', data.queueInfo.position);
                
                // Mettre à jour le statut de la commande si nécessaire
                const statusElement = orderCard.querySelector('.order-status');
                if (statusElement && statusElement.textContent !== data.status) {
                    statusElement.textContent = data.status;
                    
                    // Mettre à jour la classe de statut
                    statusElement.className = 'order-status';
                    switch(data.status) {
                        case 'En attente':
                            statusElement.classList.add('status-pending');
                            break;
                        case 'En préparation':
                            statusElement.classList.add('status-processing');
                            break;
                        case 'Expédié':
                            statusElement.classList.add('status-shipped');
                            break;
                        case 'Livré':
                            statusElement.classList.add('status-delivered');
                            break;
                        case 'Annulé':
                            statusElement.classList.add('status-cancelled');
                            break;
                    }
                    
                    // Mettre à jour l'attribut data-status de la carte
                    orderCard.setAttribute('data-status', getStatusClass(data.status));
                }
            } else if (!data.inQueue) {
                // La commande n'est plus dans la file d'attente, masquer l'indicateur
                const queueIndicator = orderCard.querySelector('.queue-position-indicator');
                if (queueIndicator) {
                    queueIndicator.style.display = 'none';
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des informations de file d\'attente:', error);
            
            // Afficher un message d'erreur dans l'indicateur
            const queueIndicator = orderCard.querySelector('.queue-position-indicator');
            if (queueIndicator) {
                queueIndicator.innerHTML = `
                    <span class="position-icon">⚠️</span>
                    <span>Erreur</span>
                `;
            }
        });
}

// Initialiser les boutons de filtre
function initFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
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
    document.addEventListener('click', function(e) {
        const header = e.target.closest('.order-header');
        if (header) {
            const card = header.closest('.order-card');
            if (card) {
                card.classList.toggle('expanded');
            }
        }
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
    }
}
// Charger l'historique du chat (simulation)
function loadChatHistory(orderId) {
    // Simulation d'une conversation
    const chatMessages = document.getElementById('chat-messages');
    
    if (!chatMessages) return;
    
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
    
    // Configurer le bouton d'envoi de message s'il n'est pas déjà configuré
    const sendButton = document.getElementById('send-message');
    if (sendButton) {
        // Supprimer les gestionnaires d'événements existants
        const newSendButton = sendButton.cloneNode(true);
        sendButton.parentNode.replaceChild(newSendButton, sendButton);
        
        // Ajouter le nouveau gestionnaire d'événement
        newSendButton.addEventListener('click', sendChatMessage);
    }
    
    // Configurer l'entrée de chat pour l'envoi de message sur la touche "Entrée"
    const chatInput = document.getElementById('chat-input-text');
    if (chatInput) {
        // Supprimer les gestionnaires d'événements existants
        const newChatInput = chatInput.cloneNode(true);
        chatInput.parentNode.replaceChild(newChatInput, chatInput);
        
        // Ajouter le nouveau gestionnaire d'événement
        newChatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
}

// Envoyer un message dans le chat
function sendChatMessage() {
    const inputField = document.getElementById('chat-input-text');
    if (!inputField) return;
    
    const messageText = inputField.value.trim();
    
    if (messageText) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
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
            simulateDeliveryResponse();
        }, 1000 + Math.random() * 2000);
    }
}

// Simuler une réponse du livreur
function simulateDeliveryResponse() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
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

// Mise à jour périodique des données de la file d'attente (toutes les 2 minutes)
setInterval(function() {
    // Vérifier si la section est actuellement visible
    const queueDetails = document.getElementById('queue-details');
    if (queueDetails && queueDetails.style.display !== 'none') {
        const orderId = document.getElementById('queue-active-order-id')?.textContent;
        if (orderId) {
            updateInlineQueueData(orderId);
        }
    } else {
        // S'il n'y a pas de commande active, vérifier si de nouvelles commandes sont entrées en file d'attente
        const activeOrders = findActiveOrdersInQueue();
        if (activeOrders.length > 0) {
            updateAndShowInlineQueueSection(activeOrders[0].orderId);
        }
    }
    
    // Mettre à jour toutes les preview de file d'attente dans les cartes
    const orderCards = document.querySelectorAll('.order-card:not([data-status="delivered"]):not([data-status="cancelled"])');
    orderCards.forEach(card => {
        const orderIdElement = card.querySelector('.order-id');
        if (!orderIdElement) return;
        
        const orderIdText = orderIdElement.textContent;
        const match = orderIdText.match(/Commande #([A-Z0-9]+)/);
        if (!match) return;
        
        const orderDisplayId = match[1];
        const orderDataId = card.getAttribute('data-order-id');
        const orderId = orderDataId || orderDisplayId;
        
        fetchQueueInfo(orderId, card);
    });
}, 120000); // 2 minutes

// Gestion de la sidebar
document.addEventListener('DOMContentLoaded', function() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const mainContent = document.getElementById('main-content');
    
    // Ouvrir la sidebar
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.add('open');
        });
    }
    
    // Fermer la sidebar
    if (closeSidebar && sidebar) {
        closeSidebar.addEventListener('click', function() {
            sidebar.classList.remove('open');
        });
    }
    
    // Fermer la sidebar en cliquant en dehors
    if (mainContent && sidebar) {
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
    
    // Ajouter la fonctionnalité de développer/réduire toutes les commandes
    addExpandAllButton();
    
    // Ajouter le sélecteur de tri
    addSortingSelector();
});

// Ajouter un bouton pour développer/réduire toutes les commandes
function addExpandAllButton() {
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
}

// Ajouter un sélecteur de tri pour les commandes
function addSortingSelector() {
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
        
        // Ajouter le sélecteur de tri
        filtersContainer.appendChild(sortSelect);
        
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
                    
                    return (statusOrder[statusA] || 4) - (statusOrder[statusB] || 4);
                }
                
                return 0;
            });
            
            // Réorganiser les cartes dans le DOM
            cardsArray.forEach(card => {
                ordersList.appendChild(card);
            });
        });
    }
}

// Fonction pour afficher une notification de changement de statut
function showStatusChangeNotification(orderId, oldStatus, newStatus) {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = 'status-notification';
    notification.innerHTML = `
        <div class="notification-icon">🔔</div>
        <div class="notification-content">
            <div class="notification-title">Commande #${orderId}</div>
            <div class="notification-message">Statut changé de "${oldStatus}" à "${newStatus}"</div>
        </div>
        <div class="notification-close">×</div>
    `;
    
    // Styles pour la notification
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = 'white';
    notification.style.borderRadius = '10px';
    notification.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    notification.style.padding = '15px';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.zIndex = '2000';
    notification.style.maxWidth = '350px';
    notification.style.animation = 'slideIn 0.5s forwards';
    
    // Ajouter l'animation CSS si elle n'existe pas déjà
    if (!document.getElementById('notification-style')) {
        const style = document.createElement('style');
        style.id = 'notification-style';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Styles pour les éléments internes
    notification.querySelector('.notification-icon').style.fontSize = '24px';
    notification.querySelector('.notification-icon').style.marginRight = '15px';
    notification.querySelector('.notification-content').style.flex = '1';
    notification.querySelector('.notification-title').style.fontWeight = 'bold';
    notification.querySelector('.notification-title').style.marginBottom = '5px';
    notification.querySelector('.notification-close').style.cursor = 'pointer';
    notification.querySelector('.notification-close').style.fontSize = '20px';
    
    // Fermer la notification lors du clic sur le bouton de fermeture
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.5s forwards';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 500);
    });
    
    // Ajouter la notification au DOM
    document.body.appendChild(notification);
    
    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animation = 'slideOut 0.5s forwards';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 500);
        }
    }, 5000);
}

// Initialisation du modal de chat si nécessaire
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
                            <input type="text" placeholder="Tapez votre message..." id="chat-input-text">
                            <button id="send-message">➤</button>
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
        document.getElementById('send-message').addEventListener('click', sendChatMessage);
        document.getElementById('chat-input-text').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    return chatModal;
}

// Fonction pour améliorer l'animation du modal
function enhanceModalAnimations() {
    // Ajouter des transitions plus fluides pour l'ouverture et la fermeture du modal
    if (!document.getElementById('modal-animation-style')) {
        const modalStyle = document.createElement('style');
        modalStyle.id = 'modal-animation-style';
        modalStyle.textContent = `
            .modal {
                transition: opacity 0.4s ease-out, visibility 0.4s ease-out;
            }
            
            .modal .modal-content {
                transform: translateY(20px);
                opacity: 0;
                transition: transform 0.4s ease-out, opacity 0.4s ease-out;
            }
            
            .modal.active .modal-content {
                transform: translateY(0);
                opacity: 1;
            }
            
            .queue-progress {
                transition: width 1s ease-in-out;
            }
            
            .queue-marker {
                transition: transform 0.3s ease-out, opacity 0.3s ease-out;
            }
            
            .queue-marker.active {
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(modalStyle);
    }
}

// Appeler cette fonction pour améliorer les animations dès le chargement
document.addEventListener('DOMContentLoaded', function() {
    enhanceModalAnimations();
    initChatModal();
});
