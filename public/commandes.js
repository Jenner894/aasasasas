document.addEventListener('DOMContentLoaded', function() {
    // Supprimer tout modal de chat existant pour éviter les doublons
    const existingModal = document.getElementById('chat-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Créer le modal de chat immédiatement
    initChatModal();
    
    // Initialiser la connexion Socket.io
    initSocketConnection();
    
    // Fonctionnalités principales (inchangées)
    checkAuthStatus();
    setupModals();
    initFilterButtons();
    setupSearchOrder();
    initExpandButtons();
    
    // Configurer les boutons de chat dans les cartes de commande
    setupChatButtons();
    
    // Configurer le bouton de chat dans la section de file d'attente
    setupInlineChatButton();
    
    // Ajouter des compteurs de messages non lus
    initUnreadMessageCounters();
    
    // Vérifier périodiquement les nouveaux messages
    setInterval(checkForNewMessages, 5000);
    
    // Améliorer les animations des modaux
    enhanceModalAnimations();
    
    // Initialiser la section de file d'attente immédiatement sans délai
    initInlineQueueSection();
    
    // IMPORTANT: Attacher explicitement les gestionnaires d'événements d'envoi de message
    attachChatSendEventHandlers();
    
    // Ajouter une animation pour les badges de notification
    addNotificationStyles();
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
                
                // Important: Réinitialiser la section de file d'attente après le chargement des commandes
                setTimeout(() => {
                    findAndDisplayActiveOrder();
                }, 100);
            } else {
                ordersList.innerHTML = '<div class="error-message">Erreur lors du chargement des commandes</div>';
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des commandes:', error);
            ordersList.innerHTML = '<div class="error-message">Erreur de connexion au serveur</div>';
        });
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
let socket;
let currentChatOrderId = null;

// Fonction pour initialiser Socket.io
function initSocketConnection() {
    // Vérifier si Socket.io est chargé
    if (typeof io === 'undefined') {
        console.error('Socket.io n\'est pas chargé. Vérifiez votre inclusion de script.');
        
        // Afficher une alerte visible pour aider au débogage
        const errorDiv = document.createElement('div');
        errorDiv.style.backgroundColor = 'red';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '0';
        errorDiv.style.left = '0';
        errorDiv.style.right = '0';
        errorDiv.style.zIndex = '9999';
        errorDiv.textContent = 'ERREUR: Socket.io n\'est pas chargé correctement. Les messages en temps réel ne fonctionneront pas.';
        document.body.prepend(errorDiv);
        return;
    }
    
    try {
        console.log('Tentative de connexion Socket.io...');
        
        // Connexion au serveur Socket.io avec des options de débogage
        socket = io({
            reconnectionAttempts: 5,
            timeout: 10000,
            debug: true
        });
        
        // Événement de connexion réussie
        socket.on('connect', () => {
            console.log('✅ Connecté au serveur Socket.io avec succès! ID:', socket.id);
            
            // Notifier l'utilisateur de la connexion réussie
            const notifDiv = document.createElement('div');
            notifDiv.style.backgroundColor = '#4CAF50';
            notifDiv.style.color = 'white';
            notifDiv.style.padding = '10px';
            notifDiv.style.position = 'fixed';
            notifDiv.style.bottom = '20px';
            notifDiv.style.right = '20px';
            notifDiv.style.borderRadius = '5px';
            notifDiv.style.zIndex = '9999';
            notifDiv.textContent = '✓ Connexion en temps réel établie';
            document.body.appendChild(notifDiv);
            
            setTimeout(() => {
                notifDiv.remove();
            }, 3000);
        });
        
        // Événement de reconnexion
        socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Tentative de reconnexion #${attemptNumber}...`);
        });
        
        // Gestion des erreurs de connexion
        socket.on('connect_error', (error) => {
            console.error('⚠️ Erreur de connexion Socket.io:', error);
        });
        
        // Écouter les nouveaux messages avec plus de logs
        socket.on('new_message', (data) => {
        console.log('📩 Nouveau message reçu via Socket.io:', data);
        
        // Vérifier si le message concerne la commande actuellement affichée
        if (data.orderId === currentChatOrderId) {
            console.log('📨 Message pour la conversation active, ajout au chat');
            addMessageToChat(data);
        } else {
            console.log('📮 Message pour une autre conversation, mise à jour du badge');
            updateUnreadBadge(data.orderId);
        }
    });
        
        // Écouter les mises à jour de statut
        socket.on('order_status_updated', (data) => {
            console.log('🔄 Mise à jour de statut reçue:', data);
            updateOrderStatus(data.orderId, data.newStatus);
        });
        
        // Événement de déconnexion
        socket.on('disconnect', (reason) => {
            console.log('❌ Déconnecté du serveur Socket.io, raison:', reason);
            
            if (reason === 'io server disconnect') {
                // La déconnexion est intentionnelle côté serveur, tentative de reconnexion
                socket.connect();
            }
        });
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de Socket.io:', error);
    }
}

// Fonction pour rejoindre un canal de chat spécifique à une commande
// Fonction améliorée pour rejoindre un canal de chat
function joinChatRoom(orderId) {
    if (!orderId) {
        console.error('❌ Impossible de rejoindre la salle: ID de commande manquant');
        return;
    }
    
    if (!socket) {
        console.error('❌ Socket non initialisé, impossible de rejoindre la salle');
        return;
    }
    
    if (!socket.connected) {
        console.warn('⚠️ Socket.io non connecté, tentative de reconnexion...');
        socket.connect();
        
        // Attendre la reconnexion avant de rejoindre la salle
        socket.once('connect', () => {
            _joinRoom(orderId);
        });
    } else {
        _joinRoom(orderId);
    }
    
    function _joinRoom(id) {
        // Quitter la salle précédente si nécessaire
        if (currentChatOrderId) {
            console.log(`Quitter la salle: order_${currentChatOrderId}`);
            socket.emit('leave_room', { room: `order_${currentChatOrderId}` });
        }
        
        // Rejoindre la nouvelle salle
        const roomName = `order_${id}`;
        console.log(`✅ Rejoindre la salle de chat: ${roomName}`);
        socket.emit('join_room', { room: roomName });
        currentChatOrderId = id;
        
        // Ajouter un indicateur visuel
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
            // Supprimer tout indicateur existant
            const existingIndicator = document.querySelector('.socket-status-indicator');
            if (existingIndicator) existingIndicator.remove();
            
            // Créer un nouvel indicateur
            const indicator = document.createElement('div');
            indicator.className = 'socket-status-indicator';
            indicator.innerHTML = '<span class="status-dot"></span> Connecté au chat en direct';
            
            // Styles pour l'indicateur
            indicator.style.fontSize = '12px';
            indicator.style.color = '#4CAF50';
            indicator.style.display = 'flex';
            indicator.style.alignItems = 'center';
            indicator.style.position = 'absolute';
            indicator.style.top = '10px';
            indicator.style.right = '40px';
            
            const dot = indicator.querySelector('.status-dot');
            dot.style.width = '8px';
            dot.style.height = '8px';
            dot.style.backgroundColor = '#4CAF50';
            dot.style.borderRadius = '50%';
            dot.style.marginRight = '5px';
            dot.style.animation = 'pulse 2s infinite';
            
            // Ajouter une règle CSS pour l'animation
            if (!document.getElementById('socket-indicator-style')) {
                const style = document.createElement('style');
                style.id = 'socket-indicator-style';
                style.textContent = `
                    @keyframes pulse {
                        0% { opacity: 0.6; }
                        50% { opacity: 1; }
                        100% { opacity: 0.6; }
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Ajouter l'indicateur au conteneur de chat
            chatContainer.appendChild(indicator);
        }
    }
}

// Fonction pour ajouter un message au chat
function addMessageToChat(messageData) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Vérifier si le message n'existe pas déjà (pour éviter les doublons)
    const existingMessages = chatMessages.querySelectorAll('.message-content');
    for (const msg of existingMessages) {
        if (msg.textContent === messageData.content) {
            // Si un message avec le même contenu et est récent (moins de 2 secondes),
            // il est probablement un doublon
            const messageTime = msg.closest('.message')?.querySelector('.message-time')?.textContent;
            if (messageTime && new Date() - new Date(messageData.timestamp) < 2000) {
                console.log('Message doublon détecté, ignoré');
                return;
            }
        }
    }
    
    // Formater la date
    const messageDate = new Date(messageData.timestamp);
    const timeString = messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateString = messageDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    
    // Créer l'élément HTML pour le message
    let messageElement;
    
    if (messageData.sender === 'system') {
        // Message système
        messageElement = document.createElement('div');
        messageElement.className = 'system-message fade-in';
        messageElement.textContent = messageData.content;
    } else {
        // Message utilisateur ou livreur
        messageElement = document.createElement('div');
        messageElement.className = `message message-${messageData.sender === 'client' ? 'user' : 'other'} fade-in`;
        
        // Ajouter l'expéditeur pour les messages du livreur
        if (messageData.sender === 'livreur') {
            const senderDiv = document.createElement('div');
            senderDiv.className = 'message-sender';
            senderDiv.textContent = 'Livreur';
            messageElement.appendChild(senderDiv);
        }
        
        // Ajouter le contenu du message
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = messageData.content;
        messageElement.appendChild(contentDiv);
        
        // Ajouter l'horodatage
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = `${dateString}, ${timeString}`;
        messageElement.appendChild(timeDiv);
    }
    
    // Ajouter le message au conteneur
    chatMessages.appendChild(messageElement);
    
    // Faire défiler jusqu'au bas
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Jouer un son de notification (si le message n'est pas du client)
    if (messageData.sender !== 'client') {
        playNotificationSound();
    }
}
// Fonction pour mettre à jour le badge de messages non lus
function updateUnreadBadge(orderId) {
    // Trouver le bouton de chat correspondant à cette commande
    document.querySelectorAll('.order-card').forEach(card => {
        const cardOrderId = card.getAttribute('data-order-id');
        const displayOrderId = card.querySelector('.order-id')?.textContent.match(/Commande #([A-Z0-9]+)/)?.at(1);
        
        if (cardOrderId === orderId || displayOrderId === orderId) {
            const chatButton = card.querySelector('.chat-btn');
            if (chatButton) {
                // Vérifier si un badge existe déjà
                let badge = chatButton.querySelector('.unread-badge');
                
                if (!badge) {
                    // Créer un nouveau badge
                    badge = document.createElement('div');
                    badge.className = 'unread-badge';
                    badge.textContent = '1';
                    
                    // S'assurer que le badge a un style qui le place en haut à droite du bouton
                    badge.style.position = 'absolute';
                    badge.style.top = '-8px';
                    badge.style.right = '-8px';
                    badge.style.backgroundColor = 'red';
                    badge.style.color = 'white';
                    badge.style.borderRadius = '50%';
                    badge.style.width = '20px';
                    badge.style.height = '20px';
                    badge.style.display = 'flex';
                    badge.style.alignItems = 'center';
                    badge.style.justifyContent = 'center';
                    badge.style.fontSize = '12px';
                    badge.style.fontWeight = 'bold';
                    
                    // S'assurer que le bouton a une position relative pour que le badge soit positionné correctement
                    chatButton.style.position = 'relative';
                    
                    chatButton.appendChild(badge);
                } else {
                    // Incrémenter le compteur existant
                    const count = parseInt(badge.textContent) || 0;
                    badge.textContent = count + 1;
                }
                
                // Ajouter une animation pour attirer l'attention
                badge.classList.add('pulse');
                setTimeout(() => {
                    badge.classList.remove('pulse');
                }, 1000);
            }
        }
    });
    
    // Vérifier également le bouton de chat dans la file d'attente
    const queueOrderId = document.getElementById('queue-active-order-id');
    if (queueOrderId && (queueOrderId.textContent === orderId || queueOrderId.dataset.mongoId === orderId)) {
        const inlineChatBtn = document.getElementById('inline-chat-btn');
        if (inlineChatBtn) {
            // Préserver le texte original du bouton
            const buttonTextSpan = inlineChatBtn.querySelector('.chat-btn-text');
            const originalText = buttonTextSpan ? buttonTextSpan.textContent : "Chatter avec le livreur";
            
            // Vérifier si un badge existe déjà
            let badge = inlineChatBtn.querySelector('.unread-badge');
            
            if (!badge) {
                // Créer un nouveau badge
                badge = document.createElement('div');
                badge.className = 'unread-badge';
                badge.textContent = '1';
                
                // Styliser le badge comme un cercle rouge
                badge.style.position = 'absolute';
                badge.style.top = '-8px';
                badge.style.right = '-8px';
                badge.style.backgroundColor = 'red';
                badge.style.color = 'white';
                badge.style.borderRadius = '50%';
                badge.style.width = '20px';
                badge.style.height = '20px';
                badge.style.display = 'flex';
                badge.style.alignItems = 'center';
                badge.style.justifyContent = 'center';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = 'bold';
                badge.style.zIndex = '5';
                
                // S'assurer que le bouton a une position relative pour que le badge soit positionné correctement
                inlineChatBtn.style.position = 'relative';
                
                inlineChatBtn.appendChild(badge);
            } else {
                // Incrémenter le compteur existant
                const count = parseInt(badge.textContent) || 0;
                badge.textContent = count + 1;
            }
            
            // S'assurer que le texte du bouton reste "Chatter avec le livreur"
            if (buttonTextSpan) {
                buttonTextSpan.textContent = originalText;
            } else {
                // S'il n'y a pas de span avec la classe chat-btn-text, restructurer le contenu du bouton
                // Sauvegarder le badge
                const badgeNode = inlineChatBtn.querySelector('.unread-badge');
                
                // Recréer le contenu du bouton
                inlineChatBtn.innerHTML = `<span class="chat-btn-icon">💬</span> <span class="chat-btn-text">${originalText}</span>`;
                
                // Réajouter le badge s'il existe
                if (badgeNode) {
                    inlineChatBtn.appendChild(badgeNode);
                }
            }
            
            // Animation
            badge.classList.add('pulse');
            setTimeout(() => {
                badge.classList.remove('pulse');
            }, 1000);
        }
    }
}

// Fonction pour mettre à jour le statut d'une commande en temps réel
function updateOrderStatus(orderId, newStatus) {
    document.querySelectorAll('.order-card').forEach(card => {
        const cardOrderId = card.getAttribute('data-order-id');
        const displayOrderId = card.querySelector('.order-id')?.textContent.match(/Commande #([A-Z0-9]+)/)?.at(1);
        
        if (cardOrderId === orderId || displayOrderId === orderId) {
            // Stocker l'ancien statut pour la notification
            const statusElement = card.querySelector('.order-status');
            const oldStatus = statusElement ? statusElement.textContent : '';
            
            // Mettre à jour l'élément de statut
            if (statusElement) {
                statusElement.textContent = newStatus;
                statusElement.className = 'order-status';
                statusElement.classList.add(`status-${getStatusClass(newStatus)}`);
            }
            
            // Mettre à jour l'attribut data-status de la carte
            card.setAttribute('data-status', getStatusClass(newStatus));
            
            // Afficher une notification de changement de statut
            showStatusChangeNotification(displayOrderId || orderId, oldStatus, newStatus);
            
            // Mettre à jour la section tracking si elle est visible
            const trackingSteps = card.querySelector('.tracking-steps');
            if (trackingSteps) {
                trackingSteps.innerHTML = `<div class="tracking-line"></div>${generateTrackingSteps(newStatus)}`;
            }
        }
    });
    
    // Mettre à jour également la section de file d'attente si active
    const queueStatusElement = document.getElementById('inline-queue-status');
    if (queueStatusElement) {
        const queueOrderId = document.getElementById('queue-active-order-id');
        if (queueOrderId && (queueOrderId.textContent === orderId || queueOrderId.dataset.mongoId === orderId)) {
            queueStatusElement.textContent = newStatus;
            queueStatusElement.className = 'queue-status';
            queueStatusElement.classList.add(`status-${getStatusClass(newStatus)}`);
            
            // Mettre à jour les marqueurs et la barre de progression
            updateInlineQueueStepMarkers(newStatus);
        }
    }
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
    orderCard.setAttribute('data-order-id', order._id); // Stocker l'ID MongoDB
    
    // Utiliser l'orderNumber existant ou générer un nouveau
    const displayOrderId = order.orderNumber || 
        `BD${orderDate.getFullYear().toString().slice(2)}${
            (orderDate.getMonth() + 1).toString().padStart(2, '0')
        }${
            Math.floor(Math.random() * 100).toString().padStart(2, '0')
        }`;
    
    // Si orderNumber n'est pas défini en base de données, le mettre à jour
    if (!order.orderNumber) {
        // Enregistrer cet orderNumber pour cette commande
        fetch(`/api/orders/${order._id}/update-order-number`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderNumber: displayOrderId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`OrderNumber mis à jour pour la commande ${order._id}:`, displayOrderId);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la mise à jour de l\'orderNumber:', error);
        });
    }
    
    // Structure de la carte de commande
    orderCard.innerHTML = `
        <div class="order-header">
            <div class="order-id" data-mongo-id="${order._id}">Commande #${displayOrderId}</div>
            <div class="order-date">${formattedDate}</div>
            <div class="order-status status-${getStatusClass(order.status)}">${order.status}</div>
            <!-- Indicateur de position avec état initial de chargement -->
            <div class="queue-position-indicator">
                <span class="position-icon">🔄</span>
                <span>Chargement...</span>
            </div>
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
                <button class="action-btn queue-btn" data-order="${displayOrderId}" data-id="${order._id}">
                    <span class="queue-btn-icon">🔢</span> File d'attente
                </button>
                <button class="action-btn chat-btn" data-order="${displayOrderId}" data-mongo-id="${order._id}">
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
function findAndDisplayActiveOrder() {
    console.log("Recherche de commandes actives...");
    
    // Essayer de trouver une commande active dans la file d'attente
    const activeOrders = findActiveOrdersInQueue();
    console.log("Commandes actives trouvées:", activeOrders);
    
    if (activeOrders.length > 0) {
        // Prendre la commande la plus prioritaire
        const mostRecentOrder = activeOrders[0];
        updateAndShowInlineQueueSection(mostRecentOrder.orderId);
        
        // Mettre aussi à jour immédiatement les aperçus de file d'attente dans les cartes
        initQueuePreview();
    } else {
        // Afficher le message "aucune commande"
        showNoQueueMessage();
    }
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
    
    // Vérifier d'abord si les commandes sont chargées
    const ordersList = document.querySelector('.orders-list');
    if (!ordersList || !ordersList.children.length || ordersList.querySelector('.loading-indicator')) {
        console.log("Les commandes ne sont pas encore chargées, attente...");
        
        // Si les commandes sont en cours de chargement, on attend un peu
        setTimeout(function() {
            findAndDisplayActiveOrder();
        }, 500); // Attendre 500ms pour laisser le temps aux commandes de se charger
    } else {
        // Les commandes sont déjà chargées, rechercher immédiatement
        findAndDisplayActiveOrder();
    }
    
    // Ajouter l'événement pour actualiser
    const refreshButton = document.getElementById('inline-refresh-queue');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            const queueActiveOrderId = document.getElementById('queue-active-order-id');
            // Utiliser l'ID MongoDB stocké dans data-mongo-id si disponible
            const orderId = queueActiveOrderId.dataset.mongoId || queueActiveOrderId.textContent;
            updateInlineQueueData(orderId);
        });
    }
}

function updateAndShowInlineQueueSection(orderId) {
    console.log(`Mise à jour de la section file d'attente pour la commande: ${orderId}`);
    
    // Essayer de trouver l'ID MongoDB associé à cet ID d'affichage
    let mongoId = null;
    
    // Parcourir les cartes de commande pour trouver celle avec cet ID d'affichage
    document.querySelectorAll('.order-card').forEach(card => {
        const orderIdElement = card.querySelector('.order-id');
        if (orderIdElement && orderIdElement.textContent.includes(orderId)) {
            // Utiliser l'ID MongoDB stocké dans l'attribut data-order-id
            mongoId = card.getAttribute('data-order-id');
        }
    });
    
    // Si on a trouvé un ID MongoDB, l'utiliser
    const idToUse = mongoId || orderId;
    console.log(`ID trouvé: ${idToUse}`);
    
    // Vérifier si les éléments nécessaires existent
    const queueActiveOrderId = document.getElementById('queue-active-order-id');
    const noQueueMessage = document.getElementById('no-queue-message');
    const queueDetails = document.getElementById('queue-details');
    
    if (!queueActiveOrderId || !noQueueMessage || !queueDetails) {
        console.error("Éléments requis introuvables pour la mise à jour de la file d'attente");
        return;
    }
    
    // Mettre à jour l'ID de commande affiché (utiliser l'ID d'affichage pour l'interface)
    queueActiveOrderId.textContent = orderId;
    // Stocker l'ID MongoDB pour les appels API
    queueActiveOrderId.dataset.mongoId = idToUse;
    
    // Masquer le message "aucune commande"
    noQueueMessage.style.display = 'none';
    
    // Afficher les détails de la file d'attente
    queueDetails.style.display = 'block';
    
    // Charger les données réelles de la file d'attente (utiliser l'ID MongoDB)
    updateInlineQueueData(idToUse);
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
    
    // Récupérer les données depuis l'API
    fetch(`/api/orders/${orderId}/queue`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.inQueue) {
                // Mettre à jour la position avec la valeur réelle
                if (positionElement) {
                    positionElement.textContent = data.queueInfo.position;
                    console.log("Position mise à jour:", data.queueInfo.position); // Débogage
                }
                
                // Mettre à jour le temps estimé en fonction de la position
                if (timeElement) {
                    // Calculer le temps en fonction de la position
                    const minTime = data.queueInfo.position * 10;
                    const maxTime = data.queueInfo.position * 15;
                    timeElement.textContent = `${minTime}-${maxTime} min`;
                    console.log("Temps mis à jour:", `${minTime}-${maxTime} min`); // Débogage
                }
                
                if (statusElement) {
                    statusElement.textContent = data.status;
                    
                    // Mettre à jour la classe CSS du statut
                    statusElement.className = 'queue-status';
                    statusElement.classList.add(`status-${getStatusClass(data.status)}`);
                    console.log("Statut mis à jour:", data.status); // Débogage
                }
                
                // Mettre à jour les marqueurs et la progression
                updateInlineQueueStepMarkers(data.status);
                
                // Mettre à jour l'heure de la dernière mise à jour
                const now = new Date();
                const timeString = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
                const lastUpdatedElement = document.getElementById('inline-last-updated');
                if (lastUpdatedElement) {
                    lastUpdatedElement.textContent = 'Dernière mise à jour: ' + timeString;
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des informations de file d\'attente:', error);
            // En cas d'erreur, utiliser des données par défaut
            if (positionElement) positionElement.textContent = "?";
            if (timeElement) timeElement.textContent = "Indisponible";
            if (statusElement) statusElement.textContent = "Inconnu";
        });
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
    console.log("Initialisation des aperçus de file d'attente");
    
    // Récupérer toutes les commandes actives
    const orderCards = document.querySelectorAll('.order-card:not([data-status="delivered"]):not([data-status="cancelled"])');
    
    orderCards.forEach(card => {
        // Extraire l'ID de la commande depuis la carte
        const orderIdElement = card.querySelector('.order-id');
        if (!orderIdElement) return;
        
        const orderIdText = orderIdElement.textContent;
        const match = orderIdText.match(/Commande #([A-Z0-9]+)/);
        if (!match) return;
        
        // Toujours utiliser l'ID MongoDB si disponible
        const orderId = card.getAttribute('data-order-id');
        
        if (!orderId) {
            console.error("Impossible de trouver l'ID MongoDB pour la commande", match[1]);
            return;
        }
        
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
        // Utiliser setTimeout pour éviter de bloquer le rendu
        setTimeout(() => {
            fetchQueueInfo(orderId, card);
        }, 0);
    });
}

// Récupérer les informations de file d'attente d'une commande
function fetchQueueInfo(orderId, orderCard) {
    // Extraire l'ID MongoDB directement depuis l'attribut data-order-id
    const mongoId = orderCard.getAttribute('data-order-id');
    
    // Utiliser l'ID MongoDB s'il existe, sinon utiliser l'ID d'affichage
    const idToUse = mongoId || orderId;
    
    fetch(`/api/orders/${idToUse}/queue`)
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
    // Cibler directement les en-têtes de commande
    const orderHeaders = document.querySelectorAll('.order-header');
    
    // Ajouter un écouteur d'événement à chaque en-tête individuellement
    orderHeaders.forEach(header => {
        header.addEventListener('click', function(e) {
            // Empêcher la propagation de l'événement
            e.stopPropagation();
            
            // Trouver la carte parente
            const card = this.closest('.order-card');
            if (card) {
                // Basculer la classe 'expanded'
                card.classList.toggle('expanded');
                console.log('Card toggled:', card.classList.contains('expanded'));
            }
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
    }
}
// Configurer les boutons de chat
function setupChatButtons() {
    // Utiliser une délégation d'événements pour gérer tous les boutons de chat
    document.addEventListener('click', function(e) {
        const chatButton = e.target.closest('.chat-btn');
        if (chatButton) {
            e.preventDefault();
            e.stopPropagation();
            
            const orderId = chatButton.getAttribute('data-order');
            const mongoId = chatButton.getAttribute('data-mongo-id');
            
            if (orderId) {
                openChatModal(orderId, mongoId);
                
                // Réinitialiser le compteur de messages non lus pour cette commande
                resetUnreadCounter(orderId);
            }
        }
    });
}

    
// Configurer le bouton de chat dans la file d'attente
function setupInlineChatButton() {
    const inlineChatBtn = document.getElementById('inline-chat-btn');
    
    if (inlineChatBtn) {
        // Réinitialiser complètement le contenu et les écouteurs d'événements
        const newButton = inlineChatBtn.cloneNode(false);
        newButton.id = 'inline-chat-btn';
        newButton.className = inlineChatBtn.className;
        
        // Définir le contenu HTML du bouton avec une position relative pour le badge
        newButton.style.position = 'relative';
        newButton.innerHTML = '<span class="chat-btn-icon">💬</span> <span class="chat-btn-text">Chatter avec le livreur</span>';
        
        // Conserver les badges de notification s'ils existent
        const badge = inlineChatBtn.querySelector('.unread-badge');
        if (badge) {
            // Assurer que le badge a le style correct
            badge.style.position = 'absolute';
            badge.style.top = '-8px';
            badge.style.right = '-8px';
            badge.style.backgroundColor = 'red';
            badge.style.color = 'white';
            badge.style.borderRadius = '50%';
            badge.style.width = '20px';
            badge.style.height = '20px';
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';
            badge.style.fontSize = '12px';
            badge.style.fontWeight = 'bold';
            badge.style.zIndex = '5';
            
            newButton.appendChild(badge.cloneNode(true));
        }
        
        // Ajouter l'écouteur d'événement
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const queueOrderIdElement = document.getElementById('queue-active-order-id');
            if (queueOrderIdElement && queueOrderIdElement.textContent) {
                const orderId = queueOrderIdElement.textContent;
                const mongoId = queueOrderIdElement.dataset.mongoId;
                
                // Utiliser à la fois l'orderId et le mongoId
                openChatModal(orderId, mongoId);
                
                // Réinitialiser le compteur de messages non lus pour cette commande
                resetUnreadCounter(orderId);
            }
        });
        
        // Remplacer le bouton original par le nouveau
        inlineChatBtn.parentNode.replaceChild(newButton, inlineChatBtn);
    }
}

// Ajouter des styles CSS pour le badge de notification
function addNotificationStyles() {
    if (!document.getElementById('notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .unread-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background-color: red;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                z-index: 5;
            }
            
            .unread-badge.pulse {
                animation: pulse 0.5s ease-in-out;
            }
            
            .chat-btn, #inline-chat-btn {
                position: relative;
            }
            
            .message.fade-in {
                animation: fadeIn 0.3s ease-in-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// IMPORTANT: Nouvelle fonction pour attacher les gestionnaires d'événements d'envoi de message
function attachChatSendEventHandlers() {
    console.log("Attachement des gestionnaires d'événements d'envoi de message");
    
    // Pour le bouton d'envoi
    const sendButton = document.getElementById('send-message');
    if (sendButton) {
        console.log("Bouton d'envoi trouvé, attachement du gestionnaire");
        // Supprimer tous les écouteurs d'événements existants
        const newButton = sendButton.cloneNode(true);
        sendButton.parentNode.replaceChild(newButton, sendButton);
        
        // Attacher le nouveau gestionnaire d'événement
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Bouton d'envoi cliqué");
            handleSendMessage();
        });
    } else {
        console.error("Bouton d'envoi introuvable");
    }
    
    // Pour le champ de texte (touche Entrée)
    const inputField = document.getElementById('chat-input-text');
    if (inputField) {
        console.log("Champ de saisie trouvé, attachement du gestionnaire");
        // Supprimer tous les écouteurs d'événements existants
        const newInputField = inputField.cloneNode(true);
        inputField.parentNode.replaceChild(newInputField, inputField);
        
        // Attacher le nouveau gestionnaire d'événement
        newInputField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log("Touche Entrée pressée dans le champ de saisie");
                handleSendMessage();
            }
        });
    } else {
        console.error("Champ de saisie introuvable");
    }
}

// IMPORTANT: Nouvelle fonction pour gérer l'envoi de message
function handleSendMessage() {
    const inputField = document.getElementById('chat-input-text');
    if (!inputField) {
        console.error("Champ de saisie introuvable lors de l'envoi");
        return;
    }
    
    const messageText = inputField.value.trim();
    if (!messageText) {
        console.log("Message vide, aucun envoi");
        return;
    }
    
    // Récupérer l'ID de la commande
    const orderIdElement = document.getElementById('chat-order-id');
    if (!orderIdElement) {
        console.error("Élément chat-order-id introuvable");
        return;
    }
    
    // Récupérer l'ID visible (BD*) et l'ID MongoDB
    const visibleOrderId = orderIdElement.textContent;
    const mongoId = orderIdElement.dataset.mongoId;
    
    console.log("Envoi du message pour la commande:", visibleOrderId);
    console.log("ID MongoDB:", mongoId);
    
    // Utiliser l'ID MongoDB s'il existe, sinon utiliser l'ID visible
    let idToUse = mongoId || visibleOrderId;
    
    console.log("ID utilisé pour l'envoi:", idToUse);
    
    // Effacer le champ de saisie immédiatement
    inputField.value = '';
    
    // Afficher un message temporaire (optimistic UI)
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) {
        console.error("Conteneur de messages introuvable");
        return;
    }
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    
    const tempMessageElement = document.createElement('div');
    tempMessageElement.className = 'message message-user message-pending';
    tempMessageElement.innerHTML = `
        <div class="message-content">${messageText}</div>
        <div class="message-time">${dateString}, ${timeString} (envoi en cours...)</div>
    `;
    
    chatMessages.appendChild(tempMessageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Préparer les données du message
    const messageData = {
        content: messageText
    };
    
    // Désactiver temporairement le bouton d'envoi
    const sendButton = document.getElementById('send-message');
    if (sendButton) {
        sendButton.disabled = true;
        sendButton.style.opacity = '0.5';
    }
    
    // Envoyer le message via l'API
    fetch(`/api/orders/${idToUse}/chat/client`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
        credentials: 'include'
    })
    .then(response => {
        console.log("Réponse reçue:", response.status);
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Réponse de l'API après envoi:", data);
        
        if (data.success) {
            // Supprimer le message temporaire
            tempMessageElement.remove();
            
            // Nous n'avons pas besoin de recharger tout l'historique
            // Le message sera affiché via l'événement Socket.io
            // Si l'événement Socket.io ne le fait pas dans les 500ms, on l'ajoute manuellement
            setTimeout(() => {
                const messageElements = chatMessages.querySelectorAll('.message-content');
                let found = false;
                
                for (const element of messageElements) {
                    if (element.textContent === messageText) {
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    // Message non reçu via Socket.io, l'ajouter manuellement
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message message-user';
                    messageElement.innerHTML = `
                        <div class="message-content">${messageText}</div>
                        <div class="message-time">${dateString}, ${timeString}</div>
                    `;
                    chatMessages.appendChild(messageElement);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }, 500);
            
            // Stocker l'ID MongoDB si disponible
            if (data.message && data.message.orderId && !orderIdElement.dataset.mongoId) {
                orderIdElement.dataset.mongoId = data.message.orderId;
            }
        } else {
            // Marquer le message comme échoué
            tempMessageElement.classList.add('message-error');
            tempMessageElement.querySelector('.message-time').textContent = 
                `${dateString}, ${timeString} (échec de l'envoi: ${data.message || 'Erreur inconnue'})`;
        }
    })
    .catch(error => {
        console.error('Erreur lors de l\'envoi du message:', error);
        
        // Marquer le message comme échoué
        tempMessageElement.classList.add('message-error');
        tempMessageElement.querySelector('.message-time').textContent = 
            `${dateString}, ${timeString} (échec de l'envoi)`;
    })
    .finally(() => {
        // Réactiver le bouton d'envoi
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.style.opacity = '1';
        }
    });
}

// Ajouter des styles pour les animations des notifications
function addNotificationStyles() {
    if (!document.getElementById('notification-animations')) {
        const style = document.createElement('style');
        style.id = 'notification-animations';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            .unread-badge.pulse {
                animation: pulse 0.5s ease-in-out;
                background-color: #ff4757;
            }
            
            .message.fade-in {
                animation: fadeIn 0.3s ease-in-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Ouvrir le modal de chat et charger l'historique
function openChatModal(orderId, mongoId) {
    console.log("Ouverture du modal de chat pour la commande:", orderId, "MongoDB ID:", mongoId);
    
    // S'assurer que le modal existe
    let modal = document.getElementById('chat-modal');
    if (!modal) {
        console.log("Modal de chat non trouvé, création en cours");
        modal = initChatModal();
    }
    
    // S'assurer que les gestionnaires d'événements sont attachés
    attachChatSendEventHandlers();
    
    // Définir l'ID de commande dans le modal
    const orderIdSpan = document.getElementById('chat-order-id');
    if (orderIdSpan) {
        orderIdSpan.textContent = orderId;
        
        // Stocker également l'ID MongoDB s'il est fourni
        if (mongoId) {
            orderIdSpan.dataset.mongoId = mongoId;
            console.log("ID MongoDB stocké dans le modal:", mongoId);
        }
    }
    
    // Afficher le modal
    modal.classList.add('active');
    
    // Appliquer une transition fluide
    setTimeout(() => {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) modalContent.style.transform = 'translateY(0)';
    }, 10);
    
    // Charger l'historique du chat
    loadChatHistory(orderId);
    
    // Réinitialiser le compteur de messages non lus
    resetUnreadCounter(orderId);
    
    // TRÈS IMPORTANT: Rejoindre la salle de chat pour cette commande
    // Utiliser l'ID MongoDB comme identifiant de salle car c'est l'ID utilisé par le serveur
    joinChatRoom(mongoId || orderId);
    
    // Tester la connexion Socket.io
    const testConnection = () => {
        if (!socket || !socket.connected) {
            console.warn('Socket.io non connecté, tentative de reconnexion...');
            // Tenter de réinitialiser la connexion
            initSocketConnection();
            setTimeout(() => {
                if (socket && socket.connected) {
                    console.log('Socket reconnecté, rejoindre la salle de chat');
                    joinChatRoom(mongoId || orderId);
                }
            }, 1000);
        }
    };
    
    // Tester la connexion après un court délai
    setTimeout(testConnection, 500);
}
// Charger l'historique du chat depuis l'API
function loadChatHistory(orderId) {
    console.log("Chargement de l'historique de chat pour:", orderId);
    
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Afficher un indicateur de chargement
    chatMessages.innerHTML = '<div class="loading-indicator">Chargement des messages...</div>';
    
    // Récupérer l'ID MongoDB depuis l'élément span s'il existe
    const chatOrderIdElement = document.getElementById('chat-order-id');
    let mongoId = chatOrderIdElement ? chatOrderIdElement.dataset.mongoId : null;
    
    // Si pas trouvé, chercher dans les cartes de commande
    if (!mongoId) {
        document.querySelectorAll('.order-card').forEach(card => {
            const orderIdElement = card.querySelector('.order-id');
            if (orderIdElement && orderIdElement.textContent.includes(orderId)) {
                mongoId = card.getAttribute('data-order-id');
            }
        });
    }
    
    // Utiliser l'ID MongoDB s'il est disponible
    const idToUse = mongoId || orderId;
    console.log("ID utilisé pour charger l'historique:", idToUse);
    
    // Rejoindre la salle Socket.io pour cette commande
    joinChatRoom(idToUse);
    
    // Appel à l'API pour récupérer l'historique
    fetch(`/api/orders/${idToUse}/chat`, {
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Données reçues pour l'historique:", data);
        
        if (data.success) {
            // Stocker l'ID MongoDB pour les futurs appels API
            if (chatOrderIdElement && data.orderId) {
                chatOrderIdElement.dataset.mongoId = data.orderId;
                console.log("ID MongoDB stocké:", data.orderId);
            }
            
            // Afficher les messages
            displayChatMessages(data.messages);
        } else {
            chatMessages.innerHTML = `<div class="error-message">${data.message || 'Erreur lors du chargement des messages'}</div>`;
        }
    })
    .catch(error => {
        console.error('Erreur lors du chargement des messages:', error);
        chatMessages.innerHTML = '<div class="error-message">Erreur de connexion au serveur</div>';
    });
}
    
// Afficher les messages du chat
function displayChatMessages(messages) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Vider le conteneur
    chatMessages.innerHTML = '';
    
    // Si aucun message, afficher un message par défaut
    if (!messages || messages.length === 0) {
        chatMessages.innerHTML = '<div class="system-message">Aucun message dans cette conversation.</div>';
        return;
    }
    
    // Afficher chaque message
    messages.forEach(message => {
        // Formater la date
        const messageDate = new Date(message.timestamp);
        const timeString = messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const dateString = messageDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        
        // Créer l'élément HTML pour le message
        let messageElement;
        
        if (message.sender === 'system') {
            // Message système
            messageElement = document.createElement('div');
            messageElement.className = 'system-message';
            messageElement.textContent = message.content;
        } else {
            // Message utilisateur ou livreur
            messageElement = document.createElement('div');
            messageElement.className = `message message-${message.sender === 'client' ? 'user' : 'other'}`;
            
            // Ajouter l'expéditeur pour les messages du livreur
            if (message.sender === 'livreur') {
                const senderDiv = document.createElement('div');
                senderDiv.className = 'message-sender';
                senderDiv.textContent = 'Livreur';
                messageElement.appendChild(senderDiv);
            }
            
            // Ajouter le contenu du message
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = message.content;
            messageElement.appendChild(contentDiv);
            
            // Ajouter l'horodatage
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = `${dateString}, ${timeString}`;
            messageElement.appendChild(timeDiv);
        }
        
        // Ajouter le message au conteneur
        chatMessages.appendChild(messageElement);
    });
    
    // Faire défiler jusqu'au bas
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
function sendChatMessage() {
    const inputField = document.getElementById('chat-input-text');
    if (!inputField) return;
    
    const messageText = inputField.value.trim();
    if (!messageText) return;
    
    // Récupérer l'ID de la commande
    const orderIdElement = document.getElementById('chat-order-id');
    if (!orderIdElement) return;
    
    // Récupérer l'ID visible (BD*) et l'ID MongoDB
    const visibleOrderId = orderIdElement.textContent;
    const mongoId = orderIdElement.dataset.mongoId;
    
    console.log("Envoi du message pour la commande:", visibleOrderId);
    console.log("ID MongoDB:", mongoId);
    
    // Utiliser l'ID MongoDB s'il existe, sinon utiliser l'ID visible
    let idToUse = mongoId || visibleOrderId;
    
    console.log("ID utilisé pour l'envoi:", idToUse);
    
    // Effacer le champ de saisie immédiatement
    inputField.value = '';
    
    // Afficher un message temporaire (optimistic UI)
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    
    const tempMessageElement = document.createElement('div');
    tempMessageElement.className = 'message message-user message-pending';
    tempMessageElement.innerHTML = `
        <div class="message-content">${messageText}</div>
        <div class="message-time">${dateString}, ${timeString} (envoi en cours...)</div>
    `;
    
    chatMessages.appendChild(tempMessageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Préparer les données du message
    const messageData = {
        content: messageText
    };
    
    // Envoyer le message
    fetch(`/api/orders/${idToUse}/chat/client`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Réponse de l'API après envoi:", data);
        
        if (data.success) {
            // Supprimer le message temporaire
            tempMessageElement.remove();
            
            // Recharger tous les messages pour s'assurer qu'ils sont à jour
            loadChatHistory(visibleOrderId);
            
            // Stocker l'ID MongoDB si disponible
            if (data.message && data.message.orderId && !orderIdElement.dataset.mongoId) {
                orderIdElement.dataset.mongoId = data.message.orderId;
            }
        } else {
            // Marquer le message comme échoué
            tempMessageElement.classList.add('message-error');
            tempMessageElement.querySelector('.message-time').textContent = 
                `${dateString}, ${timeString} (échec de l'envoi: ${data.message || 'Erreur inconnue'})`;
        }
    })
    .catch(error => {
        console.error('Erreur lors de l\'envoi du message:', error);
        
        // Marquer le message comme échoué
        tempMessageElement.classList.add('message-error');
        tempMessageElement.querySelector('.message-time').textContent = 
            `${dateString}, ${timeString} (échec de l'envoi)`;
    });
}

// Initialiser les compteurs de messages non lus
function initUnreadMessageCounters() {
    // Pour chaque carte de commande, ajouter un compteur de messages non lus
    document.querySelectorAll('.order-card').forEach(card => {
        const orderId = getChatOrderIdFromCard(card);
        if (orderId) {
            fetchUnreadCount(orderId, card);
        }
    });
}

// Obtenir l'ID de commande à partir d'une carte
function getChatOrderIdFromCard(card) {
    // Essayer d'abord data-order-id
    let orderId = card.getAttribute('data-order-id');
    
    // Si non trouvé, essayer d'extraire de l'en-tête
    if (!orderId) {
        const orderIdElement = card.querySelector('.order-id');
        if (orderIdElement) {
            const match = orderIdElement.textContent.match(/Commande #([A-Z0-9]+)/);
            if (match) {
                orderId = match[1];
            }
        }
    }
    
    return orderId;
}

// Récupérer le nombre de messages non lus pour une commande
function fetchUnreadCount(orderId, card) {
    fetch(`/api/orders/${orderId}/unread-messages`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.unreadCount > 0) {
                // Ajouter un badge de notification sur le bouton de chat
                const chatButton = card.querySelector('.chat-btn');
                if (chatButton) {
                    // Vérifier si un badge existe déjà
                    let badge = chatButton.querySelector('.unread-badge');
                    
                    if (!badge) {
                        // Créer un nouveau badge
                        badge = document.createElement('div');
                        badge.className = 'unread-badge';
                        chatButton.appendChild(badge);
                    }
                    
                    // Mettre à jour le compteur
                    badge.textContent = data.unreadCount;
                    badge.setAttribute('data-count', data.unreadCount);
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des messages non lus:', error);
        });
}

// Réinitialiser le compteur de messages non lus pour une commande
function resetUnreadCounter(orderId) {
    document.querySelectorAll('.order-card').forEach(card => {
        const cardOrderId = getChatOrderIdFromCard(card);
        if (cardOrderId === orderId) {
            const chatButton = card.querySelector('.chat-btn');
            if (chatButton) {
                const badge = chatButton.querySelector('.unread-badge');
                if (badge) {
                    badge.remove();
                }
            }
        }
    });
}

// Vérifier s'il y a de nouveaux messages pour toutes les commandes visibles
function checkForNewMessages() {
    document.querySelectorAll('.order-card').forEach(card => {
        const orderId = getChatOrderIdFromCard(card);
        if (orderId) {
            // Utiliser la nouvelle route pour récupérer le nombre de messages non lus
            fetch(`/api/orders/${orderId}/unread-messages`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.unreadCount > 0) {
                        // Ajouter un badge de notification sur le bouton de chat
                        const chatButton = card.querySelector('.chat-btn');
                        if (chatButton) {
                            // Vérifier si un badge existe déjà
                            let badge = chatButton.querySelector('.unread-badge');
                            
                            if (!badge) {
                                // Créer un nouveau badge
                                badge = document.createElement('div');
                                badge.className = 'unread-badge';
                                chatButton.appendChild(badge);
                            }
                            
                            // Mettre à jour le compteur
                            badge.textContent = data.unreadCount;
                            badge.setAttribute('data-count', data.unreadCount);
                        }
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération des messages non lus:', error);
                });
        }
    });
    
    // Vérifier également pour la commande active dans la file d'attente
    const queueOrderId = document.getElementById('queue-active-order-id');
    if (queueOrderId && queueOrderId.textContent) {
        const inlineChatBtn = document.getElementById('inline-chat-btn');
        if (inlineChatBtn) {
            fetch(`/api/orders/${queueOrderId.textContent}/unread-messages`)
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.unreadCount > 0) {
                        // Ajouter un badge de notification sur le bouton de chat
                        let badge = inlineChatBtn.querySelector('.unread-badge');
                        
                        if (!badge) {
                            // Créer un nouveau badge
                            badge = document.createElement('div');
                            badge.className = 'unread-badge';
                            inlineChatBtn.appendChild(badge);
                        }
                        
                        // Mettre à jour le compteur
                        badge.textContent = data.unreadCount;
                        badge.setAttribute('data-count', data.unreadCount);
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la récupération des messages non lus:', error);
                });
        }
    }
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
    console.log("Initialisation du modal de chat");
    
    // Supprimer tout modal existant pour éviter les doublons
    const existingModal = document.getElementById('chat-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Créer le nouveau modal
    const chatModal = document.createElement('div');
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
                        <div class="loading-indicator">Chargement des messages...</div>
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
    const closeButton = document.getElementById('close-chat-modal');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            chatModal.classList.remove('active');
        });
    }
    
    // Fermer le modal en cliquant en dehors
    window.addEventListener('click', function(e) {
        if (e.target === chatModal) {
            chatModal.classList.remove('active');
        }
    });
    
    // Attacher immédiatement les gestionnaires d'événements pour l'envoi
    attachChatSendEventHandlers();
    
    console.log("Modal de chat initialisé");
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
