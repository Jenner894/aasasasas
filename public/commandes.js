document.addEventListener('DOMContentLoaded', function() {
    // Vérifier l'état d'authentification
    checkAuthStatus();
    
    // Charger les commandes de l'utilisateur
    loadUserOrders();
    
    // Initialiser les filtres et écouteurs d'événements
    initFilterButtons();
    initExpandButtons();
    setupSearchOrder();
        // Initialiser le modal de file d'attente
    initQueueModal();
    // Initialiser le modal de chat
    initChatModal();
    enhanceModalAnimations();
    setupStatusChangeNotifications();
    // Initialiser l'aperçu de la file d'attente
    initQueuePreview();
});
/////////////////////////////////////////////////////////////////////////////////// fileee d'attente //////////////////////// 
function createQueueModal() {
    console.log('Création du modal de file d\'attente');
    
    // Vérifier si le modal existe déjà
    if (document.getElementById('queue-modal')) {
        console.log('Le modal existe déjà');
        return;
    }
    
    // Créer l'élément modal
    const modal = document.createElement('div');
    modal.id = 'queue-modal';
    modal.className = 'modal';
    
    // Définir le contenu HTML du modal
    modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <div class="modal-title">File d'attente - Commande #<span id="queue-order-id"></span></div>
            <button class="modal-close" id="close-queue-modal">×</button>
        </div>
        <div class="modal-body">
            <div class="queue-info">
                <div class="queue-card">
                    <div class="queue-header">
                        <div class="queue-title">Votre position</div>
                        <div class="queue-icon">🚶</div>
                    </div>
                    <div class="queue-body">
                        <div class="queue-position" id="modal-queue-position">3</div>
                        <div class="queue-label">dans la file d'attente</div>
                    </div>
                </div>
                
                <div class="queue-card">
                    <div class="queue-header">
                        <div class="queue-title">Temps estimé</div>
                        <div class="queue-icon">⏱️</div>
                    </div>
                    <div class="queue-body">
                        <div class="queue-time" id="modal-queue-time">45 min</div>
                        <div class="queue-label">avant livraison</div>
                    </div>
                </div>
                
                <div class="queue-card">
                    <div class="queue-header">
                        <div class="queue-title">Statut actuel</div>
                        <div class="queue-icon">📋</div>
                    </div>
                    <div class="queue-body">
                        <div class="queue-status status-processing" id="modal-queue-status">En préparation</div>
                        <div class="queue-label">de votre commande</div>
                    </div>
                </div>
            </div>
            
            <div class="queue-visualization">
                <div class="queue-line">
                    <div class="queue-progress" id="modal-queue-progress" style="width: 50%;"></div>
                </div>
                <div class="queue-markers">
                    <div class="queue-marker active">
                        <div class="marker-icon">📋</div>
                        <div class="marker-label">Confirmation</div>
                    </div>
                    <div class="queue-marker active">
                        <div class="marker-icon">👨‍🍳</div>
                        <div class="marker-label">Préparation</div>
                    </div>
                    <div class="queue-marker">
                        <div class="marker-icon">🚚</div>
                        <div class="marker-label">En route</div>
                    </div>
                    <div class="queue-marker">
                        <div class="marker-icon">🎁</div>
                        <div class="marker-label">Livraison</div>
                    </div>
                </div>
            </div>
            
            <div class="queue-refresh">
                <button id="modal-refresh-queue" class="action-btn secondary">
                    <span class="refresh-icon">🔄</span> Actualiser le statut
                </button>
                <div class="last-updated" id="modal-last-updated">Dernière mise à jour: 14:35</div>
            </div>
        </div>
    </div>`;
    
    // Ajouter le modal au corps du document
    document.body.appendChild(modal);
    console.log('Modal de file d\'attente créé et ajouté au DOM');
}
// Fonction pour initialiser le modal de file d'attente
function initQueueModal() {
    // Créer le modal s'il n'existe pas
    createQueueModal();
    
    // Vérifier si le modal existe maintenant
    const queueModal = document.getElementById('queue-modal');
    
    if (queueModal) {
        console.log('Modal de file d\'attente trouvé');
        
        // Compter combien de boutons de file d'attente existent
        const queueButtons = document.querySelectorAll('.queue-btn');
        console.log('Nombre de boutons de file d\'attente:', queueButtons.length); // Ajout pour déboguer
        
        // Ajouter les événements pour les boutons de file d'attente
        document.querySelectorAll('.queue-modal').forEach(button => {
            button.addEventListener('click', function(e) {
                console.log('Bouton de file d\'attente cliqué');
                e.preventDefault(); 
                e.stopPropagation();
                
                const orderId = this.getAttribute('data-order');
                console.log('OrderID:', orderId);
                
                document.getElementById('queue-order-id').textContent = orderId;
                
                // Charger les données réelles de file d'attente
                updateQueueModal(orderId);
                
                // Afficher le modal
                queueModal.classList.add('active');
            });
        });
        
        // Fermer le modal
        document.getElementById('close-queue-modal').addEventListener('click', function() {
            queueModal.classList.remove('active');
        });
        
        // Bouton de rafraîchissement dans le modal
        document.getElementById('modal-refresh-queue').addEventListener('click', function() {
            const orderId = document.getElementById('queue-order-id').textContent;
            updateQueueModal(orderId);
        });
    } else {
        console.error('Impossible de trouver ou de créer le modal de file d\'attente');
    }
}
function updateQueueModal(orderId) {
    console.log('Mise à jour du modal de file d\'attente pour la commande:', orderId);
    
    // Mettre à jour l'ID de commande dans le modal
    document.getElementById('queue-order-id').textContent = orderId;
    
    // Simuler un chargement des données
    document.getElementById('modal-queue-position').textContent = "...";
    document.getElementById('modal-queue-time').textContent = "Chargement...";
    document.getElementById('modal-queue-status').textContent = "Chargement...";
    
    // Dans une application réelle, vous feriez un appel API ici pour obtenir les données
    // Par exemple:
    fetch(`/api/orders/${orderId}/queue`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.inQueue) {
                // Mettre à jour la position dans la file d'attente
                document.getElementById('modal-queue-position').textContent = data.queueInfo.position;
                
                // Mettre à jour le temps estimé
                const estimatedTime = data.queueInfo.estimatedTime;
                let timeDisplay = '30-45 min'; // Valeur par défaut
                
                if (estimatedTime !== undefined) {
                    if (estimatedTime <= 5) {
                        timeDisplay = '5-10 min';
                    } else if (estimatedTime <= 15) {
                        timeDisplay = '10-20 min';
                    } else if (estimatedTime <= 30) {
                        timeDisplay = '20-30 min';
                    } else if (estimatedTime <= 45) {
                        timeDisplay = '30-45 min';
                    } else {
                        timeDisplay = '45-60 min';
                    }
                }
                
                document.getElementById('modal-queue-time').textContent = timeDisplay;
                
                // Mettre à jour le statut
                document.getElementById('modal-queue-status').textContent = data.status;
                
                // Mettre à jour la classe CSS du statut
                const statusElement = document.getElementById('modal-queue-status');
                statusElement.className = 'queue-status';
                switch(data.status) {
                    case 'En attente':
                        statusElement.classList.add('status-pending');
                        break;
                    case 'En préparation':
                        statusElement.classList.add('status-processing');
                        break;
                    case 'Expédié':
                    case 'En route':
                    case 'Prête pour livraison':
                        statusElement.classList.add('status-shipped');
                        break;
                    case 'Livré':
                        statusElement.classList.add('status-delivered');
                        break;
                    case 'Annulé':
                        statusElement.classList.add('status-cancelled');
                        break;
                }
                
                // Mettre à jour les marqueurs d'étape
                updateQueueStepMarkers(data.status);
                
                // Mettre à jour l'heure de dernière mise à jour
                const now = new Date();
                const timeString = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
                document.getElementById('modal-last-updated').textContent = 'Dernière mise à jour: ' + timeString;
            } else {
                // La commande n'est plus en file d'attente (livrée ou annulée)
                document.getElementById('modal-queue-position').textContent = "-";
                document.getElementById('modal-queue-time').textContent = data.status === 'Livré' ? "Terminé" : "Annulé";
                document.getElementById('modal-queue-status').textContent = data.status;
                
                // Mettre à jour les marqueurs d'étape
                updateQueueStepMarkers(data.status);
            }
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des informations de file d\'attente:', error);
            
            // En cas d'erreur, montrer des données fictives
            document.getElementById('modal-queue-position').textContent = "3";
            document.getElementById('modal-queue-time').textContent = "30-45 min";
            document.getElementById('modal-queue-status').textContent = "En préparation";
            
            // Mettre à jour le style du statut
            const statusElement = document.getElementById('modal-queue-status');
            statusElement.className = 'queue-status status-processing';
            
            // Mettre à jour les marqueurs d'étape
            updateQueueStepMarkers('En préparation');
            
            // Mettre à jour l'heure de dernière mise à jour
            const now = new Date();
            const timeString = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
            document.getElementById('modal-last-updated').textContent = 'Dernière mise à jour: ' + timeString;
        });
}
function updateQueueStepMarkers(status) {
    // Récupérer tous les marqueurs d'étape dans le modal
    const markers = document.querySelectorAll('#queue-modal .queue-marker');
    
    // Réinitialiser tous les marqueurs (enlever la classe active)
    markers.forEach(marker => {
        marker.classList.remove('active');
    });
    
    // Activer les marqueurs appropriés en fonction du statut sélectionné
    switch(status) {
        case 'En attente':
            // Activer uniquement le premier marqueur (Confirmation)
            markers[0].classList.add('active');
            break;
            
        case 'En préparation':
            // Activer les deux premiers marqueurs (Confirmation et Préparation)
            markers[0].classList.add('active');
            markers[1].classList.add('active');
            break;
            
        case 'Expédié':
        case 'En route':
        case 'Prête pour livraison':
            // Activer les trois premiers marqueurs (Confirmation, Préparation, En route)
            markers[0].classList.add('active');
            markers[1].classList.add('active');
            markers[2].classList.add('active');
            break;
            
        case 'Livré':
            // Activer tous les marqueurs (commande complète)
            markers.forEach(marker => {
                marker.classList.add('active');
            });
            break;
            
        case 'Annulé':
            // Pour les commandes annulées, vous pourriez vouloir une visualisation spéciale
            // Par défaut, on garde juste le premier marqueur actif
            markers[0].classList.add('active');
            break;
            
        default:
            // Par défaut, activer seulement le premier marqueur
            markers[0].classList.add('active');
    }
    
    // Mettre à jour la barre de progression en fonction du statut
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
            progressPercentage = 25; // Pour les commandes annulées, on garde une progression minimale
            break;
        default:
            progressPercentage = 25;
    }
    
    // Mettre à jour la barre de progression
    const progressBar = document.getElementById('modal-queue-progress');
    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
    }
    
    // Mettre à jour l'affichage du statut dans le modal
    const statusElement = document.getElementById('modal-queue-status');
    if (statusElement) {
        statusElement.textContent = status;
        
        // Mettre à jour la classe du statut
        statusElement.className = 'queue-status';
        switch(status) {
            case 'En attente':
                statusElement.classList.add('status-pending');
                break;
            case 'En préparation':
                statusElement.classList.add('status-processing');
                break;
            case 'Expédié':
            case 'En route':
            case 'Prête pour livraison':
                statusElement.classList.add('status-shipped');
                break;
            case 'Livré':
                statusElement.classList.add('status-delivered');
                break;
            case 'Annulé':
                statusElement.classList.add('status-cancelled');
                break;
        }
    }
    
    // Mettre à jour l'affichage du temps estimé en fonction du statut
    updateEstimatedTimeDisplay(status);
}

/**
 * Met à jour l'affichage du temps estimé en fonction du statut
 * @param {string} status - Le statut sélectionné par l'admin
 */
function updateEstimatedTimeDisplay(status) {
    const timeElement = document.getElementById('modal-queue-time');
    if (!timeElement) return;
    
    // Définir le temps estimé en fonction du statut
    switch(status) {
        case 'En attente':
            // Pour les commandes en attente, on peut estimer un temps plus long
            timeElement.textContent = '45-60 min';
            break;
        case 'En préparation':
            // Pour les commandes en préparation, on réduit le temps estimé
            timeElement.textContent = '20-30 min';
            break;
        case 'Expédié':
        case 'En route':
        case 'Prête pour livraison':
            // Pour les commandes en route, le temps est encore plus court
            timeElement.textContent = '5-10 min';
            break;
        case 'Livré':
            // Pour les commandes livrées, on change le texte
            timeElement.textContent = 'Terminé';
            break;
        case 'Annulé':
            // Pour les commandes annulées, on indique l'annulation
            timeElement.textContent = 'Annulé';
            break;
        default:
            // Par défaut, on garde un temps estimé général
            timeElement.textContent = '30-45 min';
    }
}
// Fonction pour initialiser l'aperçu de la file d'attente dans les cartes de commande
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
    
    // Configurer le rafraîchissement périodique des informations (toutes les 2 minutes)
    setInterval(() => {
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
}

// Fonction pour récupérer les informations de file d'attente d'une commande
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
                    }
                    
                    // Mettre à jour l'attribut data-status de la carte
                    orderCard.setAttribute('data-status', getStatusClass(data.status));
                    
                    // Afficher une notification de changement de statut
                    showStatusChangeNotification(orderId, statusElement.textContent, data.status);
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

// Fonction auxiliaire pour obtenir la classe CSS correspondant au statut
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



















// Fonction pour modifier l'interface utilisateur de la commande
function updateOrderUI(orderId, position, estimatedTime, status) {
    // Trouver la carte de commande correspondante
    const orderCards = document.querySelectorAll('.order-card');
    let targetCard = null;
    
    orderCards.forEach(card => {
        const cardOrderId = card.querySelector('.order-header .order-id').textContent.split('#')[1].trim();
        if (cardOrderId === orderId) {
            targetCard = card;
        }
    });
    
    if (!targetCard) return;
    
    // Ajouter ou mettre à jour l'indicateur de position dans l'en-tête de la commande
    let positionIndicator = targetCard.querySelector('.queue-position-indicator');
    
    if (!positionIndicator) {
        // Créer l'élément s'il n'existe pas
        positionIndicator = document.createElement('div');
        positionIndicator.className = 'queue-position-indicator';
        
        // Insérer avant l'icône d'expansion
        const expandIcon = targetCard.querySelector('.expand-icon');
        targetCard.querySelector('.order-header').insertBefore(positionIndicator, expandIcon);
    }
    
    // Mettre à jour le contenu
    positionIndicator.innerHTML = `
        <span class="position-icon">🚶</span>
        <span>Position: ${position}</span>
    `;
    
    // Mettre à jour le style en fonction de la position
    if (position <= 2) {
        positionIndicator.style.color = 'var(--status-shipped)';
        positionIndicator.style.fontWeight = 'bold';
    } else if (position <= 5) {
        positionIndicator.style.color = 'var(--status-processing)';
    } else {
        positionIndicator.style.color = 'var(--text-dark)';
    }
}

// Fonction pour améliorer l'animation du modal
function enhanceModalAnimations() {
    // Ajouter des transitions plus fluides pour l'ouverture et la fermeture du modal
    const modalStyle = document.createElement('style');
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

// Fonction pour ajouter des notifications de changement de statut
function setupStatusChangeNotifications() {
    // Stocker les statuts initiaux des commandes
    const orderStatuses = {};
    
    document.querySelectorAll('.order-card').forEach(card => {
        const orderId = card.querySelector('.order-header .order-id').textContent.split('#')[1].trim();
        const statusText = card.querySelector('.order-status').textContent;
        orderStatuses[orderId] = statusText;
    });
    
    // Vérifier périodiquement les changements de statut (toutes les 2 minutes)
    setInterval(() => {
        document.querySelectorAll('.order-card').forEach(card => {
            const orderId = card.querySelector('.order-header .order-id').textContent.split('#')[1].trim();
            const currentStatus = card.querySelector('.order-status').textContent;
            
            // Si le statut a changé
            if (orderStatuses[orderId] && orderStatuses[orderId] !== currentStatus) {
                // Créer une notification
                showStatusChangeNotification(orderId, orderStatuses[orderId], currentStatus);
                
                // Mettre à jour le statut stocké
                orderStatuses[orderId] = currentStatus;
            }
        });
    }, 120000);
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
    
    // Ajouter l'animation CSS
    const style = document.createElement('style');
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
            notification.remove();
        }, 500);
    });
    
    // Ajouter la notification au DOM
    document.body.appendChild(notification);
    
    // Fermer automatiquement après 5 secondes
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animation = 'slideOut 0.5s forwards';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }
    }, 5000);
}

///////////////////////////////////////////////////////////////////////////////////
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
                <button class="action-btn queue-modal" data-order="${displayOrderId}">
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
