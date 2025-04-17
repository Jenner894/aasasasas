// Variables globales
let deliveries = [];
let currentDeliveryId = null;
let currentPage = 1;
const itemsPerPage = 10;
let socket = null; // Instance Socket.io
let typingTimeout = null; // Timeout pour l'indicateur de frappe


// Éléments DOM
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const closeSidebarBtn = document.getElementById('close-sidebar');
const overlay = document.getElementById('overlay');
const deliveriesTableBody = document.getElementById('deliveries-table-body');
const noDeliveriesMessage = document.getElementById('no-deliveries-message');
const loadingIndicator = document.getElementById('loading-indicator');
const adminUsername = document.getElementById('admin-username');
const logoutItem = document.getElementById('logout-item');
const refreshBtn = document.getElementById('refresh-btn');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const filterType = document.getElementById('filter-type');
const filterStatus = document.getElementById('filter-status');

// Compteurs statistiques
const pendingDeliveries = document.getElementById('pending-deliveries');
const processingDeliveries = document.getElementById('processing-deliveries');
const scheduledDeliveries = document.getElementById('scheduled-deliveries');
const completedDeliveries = document.getElementById('completed-deliveries');

// Modals
const deliveryDetailsModal = document.getElementById('delivery-details-modal');
const closeDeliveryDetailsBtn = document.getElementById('close-delivery-details-modal');
const chatModal = document.getElementById('chat-modal');
const closeChatModalBtn = document.getElementById('close-chat-modal');
const chatMessages = document.getElementById('chat-messages');
const chatInputField = document.getElementById('chat-input-field');
const sendChatMessageBtn = document.getElementById('send-chat-message');
const chatCustomerName = document.getElementById('chat-customer-name');

// Champs de détails de livraison
const detailOrderId = document.getElementById('detail-order-id');
const detailProduct = document.getElementById('detail-product');
const detailQuantity = document.getElementById('detail-quantity');
const detailPrice = document.getElementById('detail-price');
const detailOrderDate = document.getElementById('detail-order-date');
const detailUsername = document.getElementById('detail-username');
const detailTelegram = document.getElementById('detail-telegram');
const detailDeliveryType = document.getElementById('detail-delivery-type');
const detailTimeslot = document.getElementById('detail-timeslot');
const timeSlotRow = document.getElementById('timeSlot-row');
const detailAddress = document.getElementById('detail-address');
const detailStatus = document.getElementById('detail-status');
const newStatus = document.getElementById('new-status');
const updateStatusBtn = document.getElementById('update-status-btn');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    // Vérifier l'authentification
    checkAuthentication();
    
    // Charger les livraisons
    loadDeliveries();
    
    // Ajouter les écouteurs d'événements
    setupEventListeners();
    createTypingIndicator();

// Initialiser Socket.io
initializeSocketIO();
    

});

// Vérification de l'authentification
function checkAuthentication() {
    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                window.location.href = '/login.html';
                return;
            }
            
            // Vérifier si l'utilisateur est un admin
            if (data.user.role !== 'admin') {
                window.location.href = '/dashboard';
                return;
            }
            
            // Afficher le nom d'utilisateur
            adminUsername.textContent = data.user.username;
        })
        .catch(error => {
            console.error('Erreur lors de la vérification de l\'authentification:', error);
            window.location.href = '/login.html';
        });
}
// Remplacez la fonction joinChatRoom() dans paste.txt (admin-panel.js)
function joinChatRoom(deliveryId) {
    if (!deliveryId) {
        console.error('ID de livraison non spécifié');
        return;
    }
    
    if (!socket) {
        console.warn('Socket.io non initialisé, initialisation...');
        initializeSocketIO();
        
        // Attendre que la connexion soit établie
        setTimeout(() => {
            if (socket && socket.connected) {
                joinChatRoom(deliveryId);
            } else {
                console.error('Impossible de rejoindre la salle: Socket.io non connecté');
            }
        }, 1000);
        return;
    }
    
    if (!socket.connected) {
        console.warn('Socket.io déconnecté, tentative de reconnexion...');
        socket.connect();
        
        // Attendre que la connexion soit établie
        setTimeout(() => {
            if (socket.connected) {
                joinChatRoom(deliveryId);
            } else {
                console.error('Impossible de rejoindre la salle: Socket.io non connecté');
            }
        }, 1000);
        return;
    }
    
    // Si on est déjà dans cette salle, ne rien faire
    if (currentDeliveryId === deliveryId) {
        console.log(`Déjà dans la salle de chat pour la commande ${deliveryId}`);
        return;
    }
    
    console.log(`Rejoindre la salle de chat pour la commande: ${deliveryId}`);
    
    // Si un ancien ID existe, quitter d'abord cette salle
    if (currentDeliveryId) {
        socket.emit('leave_order_chat', { orderId: currentDeliveryId });
    }
    
    // Mettre à jour l'ID courant
    currentDeliveryId = deliveryId;
    
    // Rejoindre la nouvelle salle
    socket.emit('join_order_chat', { orderId: deliveryId });
    
    // Marquer les messages existants comme lus
    socket.emit('mark_read', { orderId: deliveryId });
    
    // Afficher un indicateur visuel de connexion
    if (chatMessages) {
        const connectionMessage = document.createElement('div');
        connectionMessage.className = 'system-message';
        connectionMessage.textContent = 'Connecté à la conversation en temps réel';
        chatMessages.appendChild(connectionMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}
function initializeSocketIO() {
    // Vérification si Socket.io est déjà initialisé
    if (socket && socket.connected) {
        console.log('Socket.io déjà connecté, réutilisation de la connexion existante');
        return;
    }
    
    try {
        console.log('Initialisation de Socket.io...');
        
        // Création d'une nouvelle connexion Socket.io avec options de reconnexion
        socket = io({
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            withCredentials: true // Important pour transmettre les cookies de session
        });
        
        // Connexion établie
        socket.on('connect', () => {
            console.log('Connecté au serveur de chat! ID:', socket.id);
            
            // Si un chat est ouvert, rejoindre la salle
            if (currentDeliveryId) {
                joinChatRoom(currentDeliveryId);
            }
        });
        
        // Déconnexion
        socket.on('disconnect', (reason) => {
            console.log('Déconnecté du serveur de chat, raison:', reason);
            
            // Tentative de reconnexion si la déconnexion est involontaire
            if (reason === 'io server disconnect' || reason === 'transport close') {
                // La déconnexion est due au serveur, tenter de se reconnecter
                setTimeout(() => {
                    console.log('Tentative de reconnexion...');
                    socket.connect();
                }, 1000);
            }
        });
        
        // Erreur de connexion
        socket.on('connect_error', (error) => {
            console.error('Erreur de connexion Socket.io:', error);
        });
        
        // Réception d'un nouveau message
      socket.on('new_message', (message) => {
    console.log('Nouveau message reçu:', message);
    
    // Si le message est pour la commande actuellement ouverte
    if (currentDeliveryId === message.orderId) {
        // Vérifier si le message a un expéditeur valide
        if (message.sender === 'client' || message.sender === 'livreur') {
            // Ajouter le message au chat avec l'expéditeur correct
            addChatMessage(message.sender, message.content, new Date(message.timestamp));
            
            // Faire défiler vers le bas
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Marquer les messages comme lus uniquement si c'est un message client
            if (message.sender === 'client') {
                socket.emit('mark_read', { orderId: currentDeliveryId });
            }
        }
    } else {
        // Ajouter une notification visuelle pour cette commande
        const chatButton = document.querySelector(`.chat-button[data-id="${message.orderId}"]`);
        if (chatButton) {
            chatButton.classList.add('new-message');
        }
    }
});
        
        // Notification d'utilisateur en train d'écrire
        socket.on('user_typing', (data) => {
            if (data.role === 'client' && currentDeliveryId === data.orderId) {
                if (data.typing) {
                    showTypingIndicator();
                } else {
                    hideTypingIndicator();
                }
            }
        });
        
        // Notification de messages lus
        socket.on('messages_read', (data) => {
            if (data.role === 'client') {
                // Le client a lu les messages
                console.log('Le client a lu les messages');
                // On pourrait ajouter un indicateur visuel ici
            }
        });
        
        // Réception d'une notification
        socket.on('notification', (data) => {
            console.log('Notification reçue:', data);
            
            // Si c'est une notification de nouveau message
            if (data.type === 'new_message' && data.sender === 'client') {
                // Trouver le bouton de chat pour cette commande
                const chatButton = document.querySelector(`.chat-button[data-id="${data.orderId}"]`);
                if (chatButton) {
                    // Ajouter la classe pour indiquer un nouveau message
                    chatButton.classList.add('new-message');
                    
                    // Ajouter une animation pour attirer l'attention
                    chatButton.classList.add('pulse');
                    setTimeout(() => {
                        chatButton.classList.remove('pulse');
                    }, 2000);
                }
            }
        });
        
        // Message système (notification générale)
        socket.on('system_message', (data) => {
            console.log('Message système:', data.message);
            
            if (chatMessages && currentDeliveryId) {
                const systemMessage = document.createElement('div');
                systemMessage.className = 'system-message';
                systemMessage.textContent = data.message;
                chatMessages.appendChild(systemMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
        
        // Confirmation d'envoi de message
socket.on('message_sent', (data) => {
    console.log('Message envoyé avec succès:', data);

});
        
        // Erreur
        socket.on('error', (error) => {
            console.error('Erreur Socket.io:', error);
            
            // Afficher un message d'erreur
            if (chatMessages) {
                const errorMessage = document.createElement('div');
                errorMessage.className = 'system-message error-message';
                errorMessage.textContent = `Erreur: ${error.message || 'Une erreur est survenue'}`;
                chatMessages.appendChild(errorMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
        
    } catch (err) {
        console.error('Erreur lors de l\'initialisation de Socket.io:', err);
    }
}
// Fonction pour configurer les écouteurs d'événements Socket.io
function setupSocketListeners() {
    // Connexion établie
    socket.on('connect', () => {
        console.log('Connecté au serveur de chat');
        
        // Si un chat est ouvert, rejoindre la salle
        if (currentDeliveryId) {
            socket.emit('join_order_chat', { orderId: currentDeliveryId });
        }
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
        console.log('Déconnecté du serveur de chat');
    });
    
    // Réception d'un nouveau message
    socket.on('new_message', (message) => {
        console.log('Nouveau message reçu:', message);
        
        // Si le message est pour la commande actuellement ouverte
        if (currentDeliveryId === message.orderId) {
            // Ajouter le message au chat
            addChatMessage(message.sender, message.content, new Date(message.timestamp));
            
            // Faire défiler vers le bas
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Marquer le message comme lu
            if (message.sender === 'client') {
                socket.emit('mark_read', { orderId: currentDeliveryId });
            }
        } else {
            // Mettre à jour les badges de notification si besoin
            // Vous pourriez implémenter cela plus tard
        }
    });
    
    // Notification d'utilisateur en train d'écrire
    socket.on('user_typing', (data) => {
        if (data.role === 'client' && currentDeliveryId === data.orderId) {
            if (data.typing) {
                showTypingIndicator();
            } else {
                hideTypingIndicator();
            }
        }
    });
    
    // Notification de messages lus
    socket.on('messages_read', (data) => {
        if (data.role === 'client') {
            // Le client a lu les messages
            console.log('Le client a lu les messages');
            // On pourrait ajouter un indicateur visuel ici
        }
    });
    
    // Réception d'une notification (nouveau)
    socket.on('notification', (data) => {
        console.log('Notification reçue:', data);
        
        // Si c'est une notification de nouveau message
        if (data.type === 'new_message' && data.sender === 'client') {
            // Ajouter une notification visuelle ou sonore ici
            // Par exemple, faire clignoter un bouton ou jouer un son
            
            // Si le chat de cette commande est ouvert, rejoindre la salle et charger les messages
            if (currentDeliveryId === data.orderId) {
                // Recharger les messages pour voir le nouveau message
                loadChatMessages(currentDeliveryId);
            } else {
                // Ajouter une notification visuelle (par exemple, un badge) sur la ligne de la commande
                const chatButton = document.querySelector(`.chat-button[data-id="${data.orderId}"]`);
                if (chatButton) {
                    // Ajouter une classe pour indiquer un nouveau message
                    chatButton.classList.add('new-message');
                    // Ou ajouter un badge avec le nombre de messages non lus
                    // chatButton.setAttribute('data-unread', '1');
                }
            }
        }
    });
    
    // Erreur
    socket.on('error', (error) => {
        console.error('Erreur Socket.io:', error);
        
        // Afficher un message d'erreur
        const errorMessage = document.createElement('div');
        errorMessage.className = 'system-message';
        errorMessage.textContent = `Erreur: ${error.message || 'Une erreur est survenue'}`;
        
        if (chatMessages) {
            chatMessages.appendChild(errorMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });
    
    // Message système (nouveau)
    socket.on('system_message', (data) => {
        console.log('Message système reçu:', data);
        
        if (chatMessages && currentDeliveryId) {
            const systemMessage = document.createElement('div');
            systemMessage.className = 'system-message';
            systemMessage.textContent = data.message;
            chatMessages.appendChild(systemMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });
}

// Créer un indicateur de frappe (ajouter cette fonction)
function createTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator fade-in';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    typingIndicator.id = 'typing-indicator';
    typingIndicator.style.display = 'none';
    
    if (chatMessages) {
        chatMessages.appendChild(typingIndicator);
    }
}

// Montrer l'indicateur de frappe (ajouter cette fonction)
function showTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'block';
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        createTypingIndicator();
        showTypingIndicator();
    }
}

// Cacher l'indicateur de frappe (ajouter cette fonction)
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }
}

// Gérer l'événement de frappe (ajouter cette fonction)
function handleTyping(isTyping) {
    if (!socket || !currentDeliveryId) return;
    
    // Effacer le timeout précédent
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    // Envoyer l'état de frappe
    socket.emit('typing', {
        orderId: currentDeliveryId,
        typing: isTyping
    });
    
    // Si l'utilisateur est en train de taper, définir un timeout pour réinitialiser
    if (isTyping) {
        typingTimeout = setTimeout(() => {
            socket.emit('typing', {
                orderId: currentDeliveryId,
                typing: false
            });
        }, 3000); // Réinitialiser après 3 secondes d'inactivité
    }
}

// Marquer les messages comme lus (ajouter cette fonction)
function markMessagesAsRead() {
    if (!socket || !currentDeliveryId) return;
    
    socket.emit('mark_read', { orderId: currentDeliveryId });
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Gestion de la frappe pour l'indicateur "en train d'écrire"
chatInputField.addEventListener('input', () => {
    handleTyping(true);
});

chatInputField.addEventListener('blur', () => {
    handleTyping(false);
});
    // Sidebar toggle
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    });
    
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });
    
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        deliveryDetailsModal.classList.remove('active');
        chatModal.classList.remove('active');
    });
    
    // Logout
    logoutItem.addEventListener('click', () => {
        window.location.href = '/api/auth/logout';
    });
    
    // Modals
    closeDeliveryDetailsBtn.addEventListener('click', () => {
        deliveryDetailsModal.classList.remove('active');
        overlay.classList.remove('active');
    });
    
// Dans setupEventListeners()
closeChatModalBtn.addEventListener('click', () => {
    chatModal.classList.remove('active');
    overlay.classList.remove('active');
    
    // Quitter la salle de chat via Socket.io
    if (socket && socket.connected && currentDeliveryId) {
        socket.emit('leave_order_chat', { orderId: currentDeliveryId });
    }
});
    
    // Mise à jour du statut
    updateStatusBtn.addEventListener('click', updateDeliveryStatus);
    
    // Chat
    sendChatMessageBtn.addEventListener('click', sendChatMessage);
    chatInputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    
    // Filtres et recherche
    refreshBtn.addEventListener('click', loadDeliveries);
    searchBtn.addEventListener('click', applyFilters);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    filterType.addEventListener('change', applyFilters);
    filterStatus.addEventListener('change', applyFilters);
}

// Chargement des livraisons depuis la base de données
function loadDeliveries() {
    // Afficher l'indicateur de chargement
    deliveriesTableBody.innerHTML = '';
    noDeliveriesMessage.style.display = 'none';
    loadingIndicator.style.display = 'block';
    
    // Récupérer les commandes depuis l'API
    fetch('/api/admin/orders')
        .then(response => response.json())
        .then(data => {
            loadingIndicator.style.display = 'none';
            
            if (!data.success) {
                console.error('Erreur lors du chargement des commandes:', data.message);
                noDeliveriesMessage.style.display = 'block';
                return;
            }
            
            deliveries = data.orders;
            
            if (deliveries.length === 0) {
                noDeliveriesMessage.style.display = 'block';
                return;
            }
            
            // Mettre à jour les compteurs statistiques
            updateStatistics();
            
            // Appliquer les filtres actuels
            applyFilters();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des commandes:', error);
            loadingIndicator.style.display = 'none';
            noDeliveriesMessage.style.display = 'block';
        });
}

// Mise à jour des statistiques
function updateStatistics() {
    const pending = deliveries.filter(order => order.status === 'En attente').length;
    const processing = deliveries.filter(order => order.status === 'En préparation').length;
    const scheduled = deliveries.filter(order => order.delivery && order.delivery.type === 'scheduled').length;
    const completed = deliveries.filter(order => order.status === 'Livré').length;
    
    // Animation des compteurs
    animateCounter(pendingDeliveries, 0, pending);
    animateCounter(processingDeliveries, 0, processing);
    animateCounter(scheduledDeliveries, 0, scheduled);
    animateCounter(completedDeliveries, 0, completed);
}

// Animation des compteurs
function animateCounter(element, start, end) {
    const duration = 1000;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const increment = (end - start) / totalFrames;
    
    let currentFrame = 0;
    let currentValue = start;
    
    const animate = () => {
        currentFrame++;
        currentValue += increment;
        
        element.textContent = Math.round(currentValue);
        
        if (currentFrame < totalFrames) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = end;
        }
    };
    
    animate();
}

// Application des filtres
function applyFilters() {
    const typeFilter = filterType.value;
    const statusFilter = filterStatus.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    // Filtrer les livraisons
    const filteredDeliveries = deliveries.filter(order => {
        // Filtre par type de livraison
        if (typeFilter !== 'all' && (!order.delivery || order.delivery.type !== typeFilter)) {
            return false;
        }
        
        // Filtre par statut
        if (statusFilter !== 'all' && order.status !== statusFilter) {
            return false;
        }
        
        // Filtre par terme de recherche
        if (searchTerm) {
            const username = order.user && order.user.username ? order.user.username.toLowerCase() : '';
            const telegramId = order.user && order.user.telegramId ? order.user.telegramId.toLowerCase() : '';
            const address = order.delivery && order.delivery.address ? order.delivery.address.toLowerCase() : '';
            const productName = order.productName ? order.productName.toLowerCase() : '';
            
            return username.includes(searchTerm) || 
                   telegramId.includes(searchTerm) || 
                   address.includes(searchTerm) || 
                   productName.includes(searchTerm) ||
                   order._id.toLowerCase().includes(searchTerm);
        }
        
        return true;
    });
    
    // Afficher les résultats
    displayDeliveries(filteredDeliveries);
}

// Affichage des livraisons
function displayDeliveries(filteredDeliveries) {
    deliveriesTableBody.innerHTML = '';
    
    if (filteredDeliveries.length === 0) {
        noDeliveriesMessage.style.display = 'block';
        return;
    }
    
    noDeliveriesMessage.style.display = 'none';
    
    // Ajouter chaque livraison au tableau
    filteredDeliveries.forEach(order => {
        const row = document.createElement('tr');
        row.classList.add('fade-in');
        
        // ID court
        const shortId = order._id.substring(order._id.length - 6);
        
        // Type de livraison
        const deliveryType = order.delivery && order.delivery.type ? order.delivery.type : 'instant';
        const deliveryTypeText = deliveryType === 'instant' ? 'Instantanée' : 'Planifiée';
        
        // Date/heure
        let timeDisplay = '';
        if (order.delivery && order.delivery.type === 'scheduled' && order.delivery.timeSlot) {
            timeDisplay = order.delivery.timeSlot;
        } else {
            const date = new Date(order.createdAt);
            timeDisplay = date.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
        }
        
        // Adresse (tronquée si trop longue)
        const address = order.delivery && order.delivery.address ? order.delivery.address : 'Non spécifiée';
        const truncatedAddress = address.length > 25 ? address.substring(0, 22) + '...' : address;
        
        // Nom d'utilisateur
        const username = order.user && order.user.username ? order.user.username : 'Utilisateur inconnu';
        
        row.innerHTML = `
            <td>${shortId}</td>
            <td>${username}</td>
            <td>${order.productName}</td>
            <td><span class="type-badge type-${deliveryType}">${deliveryTypeText}</span></td>
            <td>${timeDisplay}</td>
            <td class="truncate" title="${address}">${truncatedAddress}</td>
            <td><span class="status-badge status-${order.status.replace(/ /g, '-')}">${order.status}</span></td>
            <td class="action-buttons">
                <button class="action-button view-button" data-id="${order._id}">Détails</button>
                <button class="action-button chat-button" data-id="${order._id}" data-username="${username}">Chat</button>
                <button class="action-button status-button" data-id="${order._id}">Statut</button>
            </td>
        `;
        
        deliveriesTableBody.appendChild(row);
    });
    
    // Ajouter les écouteurs d'événements pour les boutons d'action
    document.querySelectorAll('.view-button').forEach(button => {
        button.addEventListener('click', () => showDeliveryDetails(button.dataset.id));
    });
    
    document.querySelectorAll('.chat-button').forEach(button => {
        button.addEventListener('click', () => openChat(button.dataset.id, button.dataset.username));
    });
    
    document.querySelectorAll('.status-button').forEach(button => {
        button.addEventListener('click', () => showDeliveryDetails(button.dataset.id, true));
    });
}

// Affichage des détails d'une livraison
function showDeliveryDetails(deliveryId, focusOnStatus = false) {
    currentDeliveryId = deliveryId;
    
    // Trouver la commande correspondante
    const order = deliveries.find(o => o._id === deliveryId);
    
    if (!order) {
        console.error('Commande non trouvée:', deliveryId);
        return;
    }
    
    // Remplir les détails de la commande
    detailOrderId.textContent = order._id;
    detailProduct.textContent = order.productName;
    detailQuantity.textContent = `${order.quantity} g`;
    detailPrice.textContent = `${order.totalPrice.toFixed(2)} €`;
    
    // Formater la date de commande
    const orderDate = new Date(order.createdAt);
    detailOrderDate.textContent = orderDate.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Informations client
    detailUsername.textContent = order.user && order.user.username ? order.user.username : 'Non spécifié';
    detailTelegram.textContent = order.user && order.user.telegramId ? order.user.telegramId : 'Non spécifié';
    
    // Informations de livraison
    if (order.delivery) {
        const deliveryType = order.delivery.type === 'instant' ? 'Instantanée' : 'Planifiée';
        detailDeliveryType.textContent = deliveryType;
        
        if (order.delivery.type === 'scheduled' && order.delivery.timeSlot) {
            timeSlotRow.style.display = 'flex';
            detailTimeslot.textContent = order.delivery.timeSlot;
        } else {
            timeSlotRow.style.display = 'none';
        }
        
        detailAddress.textContent = order.delivery.address || 'Non spécifiée';
    } else {
        detailDeliveryType.textContent = 'Non spécifiée';
        timeSlotRow.style.display = 'none';
        detailAddress.textContent = 'Non spécifiée';
    }
    
    // Statut actuel
    detailStatus.textContent = order.status;
    detailStatus.className = 'status-badge status-' + order.status.replace(/ /g, '-');
    
    // Sélectionner le statut actuel dans le dropdown
    newStatus.value = order.status;
    
    // Afficher le modal
    overlay.classList.add('active');
    deliveryDetailsModal.classList.add('active');
    
    // Focus sur la section de changement de statut si demandé
    if (focusOnStatus) {
        setTimeout(() => {
            newStatus.focus();
        }, 300);
    }
}

// Mise à jour du statut d'une livraison
function updateDeliveryStatus() {
    if (!currentDeliveryId) return;
    
    const status = newStatus.value;
    
    // Animation du bouton
    updateStatusBtn.textContent = 'Mise à jour...';
    updateStatusBtn.disabled = true;
    
    // Appel à l'API pour mettre à jour le statut
    fetch(`/api/orders/${currentDeliveryId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Mettre à jour le statut localement
            const orderIndex = deliveries.findIndex(o => o._id === currentDeliveryId);
            if (orderIndex !== -1) {
                deliveries[orderIndex].status = status;
                
                // Mettre à jour l'affichage des détails
                detailStatus.textContent = status;
                detailStatus.className = 'status-badge status-' + status.replace(/ /g, '-');
                
                // Mettre à jour le tableau
                applyFilters();
                
                // Mettre à jour les statistiques
                updateStatistics();
            }
            
            // Afficher un message de succès temporaire
            const successDiv = document.createElement('div');
            successDiv.className = 'system-message fade-in';
            successDiv.textContent = 'Statut mis à jour avec succès !';
            
            const modalBody = document.querySelector('.modal-body');
            modalBody.insertBefore(successDiv, modalBody.firstChild);
            
            setTimeout(() => {
                successDiv.remove();
            }, 3000);
        } else {
            console.error('Erreur lors de la mise à jour du statut:', data.message);
            alert('Erreur lors de la mise à jour du statut: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erreur lors de la mise à jour du statut:', error);
        alert('Erreur lors de la mise à jour du statut');
    })
    .finally(() => {
        updateStatusBtn.textContent = 'Mettre à jour';
        updateStatusBtn.disabled = false;
    });
}

// Ouverture du chat avec un client
function openChat(deliveryId, username) {
    // Conserver l'ID de la commande actuelle
    currentDeliveryId = deliveryId;
    chatCustomerName.textContent = username;
    
    // Vider les messages précédents
    chatMessages.innerHTML = '';
    
    // Créer l'indicateur de frappe au cas où
    createTypingIndicator();
    
    // Afficher un indicateur de chargement
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'system-message';
    loadingMessage.textContent = 'Chargement de la conversation...';
    chatMessages.appendChild(loadingMessage);
    
    // Afficher le modal de chat
    overlay.classList.add('active');
    chatModal.classList.add('active');
    
    // Si la connexion Socket.io est établie
    if (socket && socket.connected) {
        console.log(`Rejoindre la salle de chat pour la commande: ${deliveryId}`);
        
        // Quitter d'abord toutes les salles spécifiques aux commandes
        socket.emit('leave_all_rooms');
        
        // Puis rejoindre la salle de chat pour cette commande
        socket.emit('join_order_chat', { orderId: deliveryId });
        
        // Marquer les messages comme lus
        markMessagesAsRead();
    } else {
        console.warn('Socket.io non connecté! Les messages en temps réel ne fonctionneront pas.');
    }
    
    // Charger les messages du chat
    loadChatMessages(deliveryId);
    
    // Focus sur le champ d'entrée
    setTimeout(() => {
        chatInputField.focus();
    }, 300);
    
    // Si l'interface a un bouton de notification pour cette commande, supprimer la notification
    const chatButton = document.querySelector(`.chat-button[data-id="${deliveryId}"]`);
    if (chatButton) {
        chatButton.classList.remove('new-message');
        // Ou réinitialiser le compteur de messages non lus
        // chatButton.removeAttribute('data-unread');
    }
}
function loadChatMessages(deliveryId) {
    // Vider les messages précédents
    chatMessages.innerHTML = '';
    
    // Afficher un indicateur de chargement
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'system-message';
    loadingMessage.textContent = 'Chargement des messages...';
    chatMessages.appendChild(loadingMessage);
    
    // Appel à l'API pour récupérer les messages de chat
    fetch(`/api/orders/${deliveryId}/chat`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Supprimer l'indicateur de chargement
            chatMessages.innerHTML = '';
            
            if (!data.success) {
                console.error('Erreur lors du chargement des messages:', data.message);
                
                // Afficher un message d'erreur
                const errorMessage = document.createElement('div');
                errorMessage.className = 'system-message';
                errorMessage.textContent = 'Erreur lors du chargement des messages.';
                chatMessages.appendChild(errorMessage);
                return;
            }
            
            // Si aucun message n'est trouvé
            if (!data.messages || data.messages.length === 0) {
                const noMessagesNotice = document.createElement('div');
                noMessagesNotice.className = 'system-message';
                noMessagesNotice.textContent = 'Aucun message dans cette conversation.';
                chatMessages.appendChild(noMessagesNotice);
                return;
            }
            
            // Ajouter les messages au chat avec les bons expéditeurs
            data.messages.forEach(msg => {
                // Ici on s'assure de passer le bon expéditeur à addChatMessage
                addChatMessage(msg.sender, msg.content, new Date(msg.timestamp));
            });
            
            // Faire défiler vers le bas
            chatMessages.scrollTop = chatMessages.scrollHeight;
        })
        .catch(error => {
            console.error('Erreur lors du chargement des messages:', error);
            
            // Afficher un message d'erreur
            chatMessages.innerHTML = '';
            const errorMessage = document.createElement('div');
            errorMessage.className = 'system-message';
            errorMessage.textContent = 'Erreur lors du chargement des messages. Veuillez réessayer.';
            chatMessages.appendChild(errorMessage);
        });
}

// Envoi d'un message dans le chat
function sendChatMessage() {
    const messageText = chatInputField.value.trim();
    
    if (!messageText) return;
    
    // S'assurer qu'un ID de livraison est défini
    if (!currentDeliveryId) {
        console.error('Aucune livraison sélectionnée');
        
        // Afficher une erreur dans le chat
        const errorMessage = document.createElement('div');
        errorMessage.className = 'system-message error-message';
        errorMessage.textContent = 'Erreur: Aucune conversation active';
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return;
    }
    
    // Désactiver le bouton d'envoi pendant la requête
    sendChatMessageBtn.disabled = true;
    
    // Vider le champ d'entrée
    chatInputField.value = '';
    
    // Arrêter l'indicateur de frappe
    handleTyping(false);
    
    // Si connecté via Socket.io, envoyer le message par ce canal
    if (socket && socket.connected) {
        console.log(`Envoi de message via Socket.io pour la commande ${currentDeliveryId}`);
        
        // Envoyer le message via Socket.io
        socket.emit('send_message', {
            orderId: currentDeliveryId,
            content: messageText
        });
        
        // Ajouter le message à l'interface APRÈS l'envoi
        // Spécifier explicitement l'expéditeur comme 'livreur' puisque nous sommes dans le panel admin
        addChatMessage('livreur', messageText, new Date());
        
        // Faire défiler vers le bas
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Réactiver le bouton après un court délai
        setTimeout(() => {
            sendChatMessageBtn.disabled = false;
        }, 300);
    } else {
        console.warn('Socket.io non connecté, utilisation de l\'API REST');
        
        // Fallback: utiliser l'API HTTP classique
        fetch(`/api/orders/${currentDeliveryId}/chat/livreur`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content: messageText }),
            credentials: 'include' // Important pour inclure les cookies de session
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                console.error('Erreur lors de l\'envoi du message:', data.message);
                
                // Afficher un message d'erreur
                const errorNotification = document.createElement('div');
                errorNotification.className = 'notification error';
                errorNotification.textContent = `Erreur: ${data.message || 'Impossible d\'envoyer le message'}`;
                document.body.appendChild(errorNotification);
                
                // Supprimer la notification après 3 secondes
                setTimeout(() => {
                    errorNotification.remove();
                }, 3000);
            } else {
                // Ajouter le message à l'interface seulement en cas de succès
                // S'assurer que le message est ajouté en tant que 'livreur' et non 'client'
                addChatMessage('livreur', messageText, new Date());
                
                // Faire défiler vers le bas
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi du message:', error);
            
            // Afficher un message d'erreur
            const errorNotification = document.createElement('div');
            errorNotification.className = 'notification error';
            errorNotification.textContent = 'Erreur de connexion. Veuillez réessayer.';
            document.body.appendChild(errorNotification);
            
            // Supprimer la notification après 3 secondes
            setTimeout(() => {
                errorNotification.remove();
            }, 3000);
        })
        .finally(() => {
            // Réactiver le bouton d'envoi
            sendChatMessageBtn.disabled = false;
        });
    }
}

// Ajout d'un message au chat
// Ajout d'un message au chat
function addChatMessage(sender, content, timestamp) {
    const messageDiv = document.createElement('div');
    
    if (sender === 'system') {
        messageDiv.className = 'system-message fade-in';
        messageDiv.textContent = content;
    } else {
        // Distinction claire entre les messages du livreur (admin) et du client
        // Utiliser message-admin pour le livreur et message-customer pour le client
        messageDiv.className = sender === 'livreur' ? 'message message-admin fade-in' : 'message message-customer fade-in';
        
        const senderDiv = document.createElement('div');
        senderDiv.className = 'message-sender';
        senderDiv.textContent = sender === 'livreur' ? 'Livreur' : 'Client';
        
        const contentDiv = document.createElement('div');
        contentDiv.textContent = content;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = formatMessageTime(timestamp);
        
        messageDiv.appendChild(senderDiv);
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
    }
    
    chatMessages.appendChild(messageDiv);
}
// Formatage de l'heure pour les messages
function formatMessageTime(timestamp) {
    return timestamp.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Fonction utilitaire pour formater les dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
