// Script principal pour le dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let currentUser = null;
    let userOrders = [];
    let products = [];
    let cart = []; // Panier d'achat
    
    // Vérification de l'authentification
// Vérification de l'authentification
async function checkAuth() {
    try {
        console.log("Tentative de vérification d'authentification...");
        
        // Utiliser la nouvelle route API avec gestion de session explicite
        const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'  // Important pour envoyer les cookies de session
        });
        
        console.log("Statut de réponse:", response.status);
        console.log("Headers:", [...response.headers.entries()]);
        
        if (response.status === 401) {
            console.log('Utilisateur non authentifié, redirection vers la page de connexion');
            // COMMENTER cette ligne pour empêcher la redirection automatique
            // window.location.href = '/login.html';
            return false;
        }
        
        if (!response.ok) {
            throw new Error('Erreur d\'authentification');
        }
        
        const userData = await response.json();
        console.log('Utilisateur authentifié:', userData.username);
        
        // Stocker les données utilisateur
        currentUser = userData;
        displayUsername();
        
        return {
            authenticated: true,
            user: userData
        };
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        window.location.href = '/login.html';
        return false;
    }
}
    
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



    // Création du modal de livraison
function createDeliveryModal() {
    // Vérifier si le modal existe déjà
    let deliveryModal = document.getElementById('delivery-modal');
    
    if (!deliveryModal) {
        // Créer le modal de livraison
        deliveryModal = document.createElement('div');
        deliveryModal.id = 'delivery-modal';
        deliveryModal.className = 'delivery-modal';
        
        // Structure initiale du modal (première étape)
        deliveryModal.innerHTML = `
            <div class="delivery-modal-content">
                <div class="delivery-modal-header">
                    <div class="delivery-modal-title">Choisir votre mode de livraison</div>
                    <button class="delivery-modal-close" id="close-delivery-modal">×</button>
                </div>
                <div class="delivery-modal-body" id="delivery-modal-body">
                    <!-- Étape 1: Choix du type de livraison -->
                    <div id="delivery-step-1" class="delivery-step">
                        <div class="delivery-options">
                            <div class="delivery-option" data-option="instant">
                                <div class="delivery-option-icon">🚀</div>
                                <div class="delivery-option-content">
                                    <div class="delivery-option-title">Livraison instantanée</div>
                                    <div class="delivery-option-description">Livraison dans les plus brefs délais</div>
                                </div>
                            </div>
                            <div class="delivery-option" data-option="scheduled">
                                <div class="delivery-option-icon">📅</div>
                                <div class="delivery-option-content">
                                    <div class="delivery-option-title">Livraison planifiée</div>
                                    <div class="delivery-option-description">Choisissez une heure qui vous convient</div>
                                </div>
                            </div>
                        </div>
                        <div class="delivery-actions">
                            <button class="delivery-btn delivery-back-btn" id="cancel-delivery">Annuler</button>
                            <button class="delivery-btn delivery-next-btn" id="next-delivery-step" disabled>Continuer</button>
                        </div>
                    </div>
                    
                    <!-- Les autres étapes seront ajoutées dynamiquement -->
                </div>
            </div>
        `;
        
        // Ajouter le modal au body
        document.body.appendChild(deliveryModal);
        
        // Ajouter les gestionnaires d'événements
        setupDeliveryModalEvents();
    }
    
    return deliveryModal;
}

// Configuration des événements pour le modal de livraison
function setupDeliveryModalEvents() {
    // Fermer le modal
    document.getElementById('close-delivery-modal').addEventListener('click', () => {
        closeDeliveryModal();
    });
    
    // Annuler la livraison
    document.getElementById('cancel-delivery').addEventListener('click', () => {
        closeDeliveryModal();
    });
    
    // Gérer la sélection des options de livraison
    const deliveryOptions = document.querySelectorAll('.delivery-option');
    deliveryOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Enlever la classe "selected" de toutes les options
            deliveryOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Ajouter la classe "selected" à l'option cliquée
            this.classList.add('selected');
            
            // Activer le bouton "Continuer"
            document.getElementById('next-delivery-step').removeAttribute('disabled');
            
            // Stocker l'option sélectionnée
            currentDeliveryOption = this.getAttribute('data-option');
        });
    });
    
    // Passer à l'étape suivante
    document.getElementById('next-delivery-step').addEventListener('click', () => {
        goToNextDeliveryStep();
    });
}

// Variables globales pour le système de livraison
let currentDeliveryStep = 1;
let currentDeliveryOption = null;
let selectedTimeSlot = null;
let deliveryAddress = null;

// Fermer le modal de livraison
function closeDeliveryModal() {
    const deliveryModal = document.getElementById('delivery-modal');
    if (deliveryModal) {
        deliveryModal.classList.remove('active');
        
        // Réinitialiser les variables
        currentDeliveryStep = 1;
        currentDeliveryOption = null;
        selectedTimeSlot = null;
        deliveryAddress = null;
        
        // Revenir à la première étape après un court délai
        setTimeout(() => {
            resetDeliveryModal();
        }, 300);
    }
}

// Réinitialiser le modal de livraison
function resetDeliveryModal() {
    const modalBody = document.getElementById('delivery-modal-body');
    if (modalBody) {
        // Garder uniquement la première étape
        const allSteps = modalBody.querySelectorAll('.delivery-step');
        allSteps.forEach((step, index) => {
            if (index > 0) {
                step.remove();
            }
        });
        
        // Réinitialiser la première étape
        const firstStep = document.getElementById('delivery-step-1');
        if (firstStep) {
            const options = firstStep.querySelectorAll('.delivery-option');
            options.forEach(opt => opt.classList.remove('selected'));
            
            const continueBtn = document.getElementById('next-delivery-step');
            if (continueBtn) {
                continueBtn.setAttribute('disabled', 'disabled');
            }
        }
        
        // Réinitialiser le titre
        const modalTitle = document.querySelector('.delivery-modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Choisir votre mode de livraison';
        }
    }
}

// Passer à l'étape suivante
function goToNextDeliveryStep() {
    currentDeliveryStep++;
    
    const modalBody = document.getElementById('delivery-modal-body');
    const modalTitle = document.querySelector('.delivery-modal-title');
    
    if (currentDeliveryOption === 'instant') {
        // Étape 2 pour la livraison instantanée: adresse
        if (currentDeliveryStep === 2) {
            modalTitle.textContent = 'Adresse de livraison';
            
            const addressStep = document.createElement('div');
            addressStep.id = 'delivery-step-2';
            addressStep.className = 'delivery-step fade-in';
            
            addressStep.innerHTML = `
                <div class="delivery-form">
                    <div class="form-group">
                        <label for="delivery-address">Adresse de livraison</label>
                        <input type="text" id="delivery-address" class="form-control" placeholder="Entrez votre adresse complète">
                        <div class="error-message" id="address-error" style="display: none;">Veuillez entrer une adresse valide</div>
                    </div>
                </div>
                <div class="delivery-actions">
                    <button class="delivery-btn delivery-back-btn" id="back-to-step-1">Retour</button>
                    <button class="delivery-btn delivery-next-btn" id="go-to-confirm">Continuer</button>
                </div>
            `;
            
            // Cacher l'étape 1
            document.getElementById('delivery-step-1').style.display = 'none';
            
            // Ajouter l'étape 2
            modalBody.appendChild(addressStep);
            
            // Ajouter les événements
            document.getElementById('back-to-step-1').addEventListener('click', () => {
                goBackToPreviousStep();
            });
            
            document.getElementById('go-to-confirm').addEventListener('click', () => {
                // Valider l'adresse
                const addressInput = document.getElementById('delivery-address');
                const addressError = document.getElementById('address-error');
                
                if (!addressInput.value.trim()) {
                    addressError.style.display = 'block';
                    return;
                } else {
                    addressError.style.display = 'none';
                }
                
                // Stocker l'adresse
                deliveryAddress = addressInput.value.trim();
                
                // Passer à l'étape de confirmation
                goToNextDeliveryStep();
            });
        } 
        // Étape 3 pour la livraison instantanée: confirmation
        else if (currentDeliveryStep === 3) {
            modalTitle.textContent = 'Confirmation de commande';
            
            const confirmStep = document.createElement('div');
            confirmStep.id = 'delivery-step-3';
            confirmStep.className = 'delivery-step fade-in';
            
            // Calcul du total
            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.count), 0);
            
            // Préparer le résumé des articles du panier
            let itemsSummary = '';
            cart.forEach(item => {
                itemsSummary += `
                <div class="summary-row">
                    <div>${item.name} (${item.quantity}g x ${item.count})</div>
                    <div>${(item.price * item.count).toFixed(2)}€</div>
                </div>
                `;
            });
            
            confirmStep.innerHTML = `
                <div class="order-summary">
                    <div class="summary-section-title">Votre commande</div>
                    ${itemsSummary}
                    
                    <div class="summary-section-title">Livraison</div>
                    <div class="summary-row">
                        <div>Type de livraison</div>
                        <div>Instantanée</div>
                    </div>
                    <div class="summary-row">
                        <div>Adresse</div>
                        <div>${deliveryAddress}</div>
                    </div>
                    
                    <div class="summary-row summary-total">
                        <div>Total</div>
                        <div>${totalAmount.toFixed(2)}€</div>
                    </div>
                </div>
                <div class="delivery-actions">
                    <button class="delivery-btn delivery-back-btn" id="back-to-step-2">Modifier</button>
                    <button class="delivery-btn delivery-next-btn" id="confirm-order">Confirmer la commande</button>
                </div>
            `;
            
            // Cacher l'étape 2
            document.getElementById('delivery-step-2').style.display = 'none';
            
            // Ajouter l'étape 3
            modalBody.appendChild(confirmStep);
            
            // Ajouter les événements
            document.getElementById('back-to-step-2').addEventListener('click', () => {
                goBackToPreviousStep();
            });
            
            document.getElementById('confirm-order').addEventListener('click', () => {
                // Traiter la commande
                processOrderWithDelivery();
            });
        }
    } 
    else if (currentDeliveryOption === 'scheduled') {
        // Étape 2 pour la livraison planifiée: heure
        if (currentDeliveryStep === 2) {
            modalTitle.textContent = 'Choisir l\'heure de livraison';
            
            const timeStep = document.createElement('div');
            timeStep.id = 'delivery-step-2';
            timeStep.className = 'delivery-step fade-in';
            
            // Générer les créneaux horaires
            const now = new Date();
            const currentHour = now.getHours();
            let timeSlots = '';
            
            // Plages horaires de 10h à 22h
            for (let hour = 10; hour <= 22; hour++) {
                // Désactiver les heures déjà passées pour aujourd'hui
                const isDisabled = (hour <= currentHour) ? 'disabled' : '';
                timeSlots += `<div class="time-slot ${isDisabled}" data-hour="${hour}">${hour}:00</div>`;
            }
            
            timeStep.innerHTML = `
                <div class="form-group">
                    <label>Quand souhaitez-vous être livré?</label>
                    <div class="time-slots">
                        ${timeSlots}
                    </div>
                    <div class="error-message" id="time-error" style="display: none;">Veuillez sélectionner une heure valide</div>
                </div>
                <div class="delivery-actions">
                    <button class="delivery-btn delivery-back-btn" id="back-to-step-1">Retour</button>
                    <button class="delivery-btn delivery-next-btn" id="go-to-address">Continuer</button>
                </div>
            `;
            
            // Cacher l'étape 1
            document.getElementById('delivery-step-1').style.display = 'none';
            
            // Ajouter l'étape 2
            modalBody.appendChild(timeStep);
            
            // Ajouter les événements pour les créneaux horaires
            const timeSlotElements = timeStep.querySelectorAll('.time-slot:not(.disabled)');
            timeSlotElements.forEach(slot => {
                slot.addEventListener('click', function() {
                    // Enlever la classe "selected" de tous les créneaux
                    timeSlotElements.forEach(s => s.classList.remove('selected'));
                    
                    // Ajouter la classe "selected" au créneau cliqué
                    this.classList.add('selected');
                    
                    // Stocker le créneau horaire sélectionné
                    selectedTimeSlot = this.getAttribute('data-hour');
                });
            });
            
            // Ajouter les événements pour les boutons
            document.getElementById('back-to-step-1').addEventListener('click', () => {
                goBackToPreviousStep();
            });
            
            document.getElementById('go-to-address').addEventListener('click', () => {
                // Valider la sélection de l'heure
                const timeError = document.getElementById('time-error');
                
                if (!selectedTimeSlot) {
                    timeError.style.display = 'block';
                    return;
                } else {
                    timeError.style.display = 'none';
                }
                
                // Passer à l'étape suivante (adresse)
                goToNextDeliveryStep();
            });
        } 
        // Étape 3 pour la livraison planifiée: adresse
        else if (currentDeliveryStep === 3) {
            modalTitle.textContent = 'Adresse de livraison';
            
            const addressStep = document.createElement('div');
            addressStep.id = 'delivery-step-3';
            addressStep.className = 'delivery-step fade-in';
            
            addressStep.innerHTML = `
                <div class="delivery-form">
                    <div class="form-group">
                        <label for="delivery-address">Adresse de livraison</label>
                        <input type="text" id="delivery-address" class="form-control" placeholder="Entrez votre adresse complète">
                        <div class="error-message" id="address-error" style="display: none;">Veuillez entrer une adresse valide</div>
                    </div>
                </div>
                <div class="delivery-actions">
                    <button class="delivery-btn delivery-back-btn" id="back-to-step-2">Retour</button>
                    <button class="delivery-btn delivery-next-btn" id="go-to-confirm">Continuer</button>
                </div>
            `;
            
            // Cacher l'étape 2
            document.getElementById('delivery-step-2').style.display = 'none';
            
            // Ajouter l'étape 3
            modalBody.appendChild(addressStep);
            
            // Ajouter les événements
            document.getElementById('back-to-step-2').addEventListener('click', () => {
                goBackToPreviousStep();
            });
            
            document.getElementById('go-to-confirm').addEventListener('click', () => {
                // Valider l'adresse
                const addressInput = document.getElementById('delivery-address');
                const addressError = document.getElementById('address-error');
                
                if (!addressInput.value.trim()) {
                    addressError.style.display = 'block';
                    return;
                } else {
                    addressError.style.display = 'none';
                }
                
                // Stocker l'adresse
                deliveryAddress = addressInput.value.trim();
                
                // Passer à l'étape de confirmation
                goToNextDeliveryStep();
            });
        } 
        // Étape 4 pour la livraison planifiée: confirmation
        else if (currentDeliveryStep === 4) {
            modalTitle.textContent = 'Confirmation de commande';
            
            const confirmStep = document.createElement('div');
            confirmStep.id = 'delivery-step-4';
            confirmStep.className = 'delivery-step fade-in';
            
            // Calcul du total
            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.count), 0);
            
            // Préparer le résumé des articles du panier
            let itemsSummary = '';
            cart.forEach(item => {
                itemsSummary += `
                <div class="summary-row">
                    <div>${item.name} (${item.quantity}g x ${item.count})</div>
                    <div>${(item.price * item.count).toFixed(2)}€</div>
                </div>
                `;
            });
            
            confirmStep.innerHTML = `
                <div class="order-summary">
                    <div class="summary-section-title">Votre commande</div>
                    ${itemsSummary}
                    
                    <div class="summary-section-title">Livraison</div>
                    <div class="summary-row">
                        <div>Type de livraison</div>
                        <div>Planifiée</div>
                    </div>
                    <div class="summary-row">
                        <div>Heure de livraison</div>
                        <div>${selectedTimeSlot}:00</div>
                    </div>
                    <div class="summary-row">
                        <div>Adresse</div>
                        <div>${deliveryAddress}</div>
                    </div>
                    
                    <div class="summary-row summary-total">
                        <div>Total</div>
                        <div>${totalAmount.toFixed(2)}€</div>
                    </div>
                </div>
                <div class="delivery-actions">
                    <button class="delivery-btn delivery-back-btn" id="back-to-step-3">Modifier</button>
                    <button class="delivery-btn delivery-next-btn" id="confirm-order">Confirmer la commande</button>
                </div>
            `;
            
            // Cacher l'étape 3
            document.getElementById('delivery-step-3').style.display = 'none';
            
            // Ajouter l'étape 4
            modalBody.appendChild(confirmStep);
            
            // Ajouter les événements
            document.getElementById('back-to-step-3').addEventListener('click', () => {
                goBackToPreviousStep();
            });
            
            document.getElementById('confirm-order').addEventListener('click', () => {
                // Traiter la commande
                processOrderWithDelivery();
            });
        }
    }
}

// Retourner à l'étape précédente
function goBackToPreviousStep() {
    // Récupérer l'étape actuelle et l'étape précédente
    const currentStepElement = document.getElementById(`delivery-step-${currentDeliveryStep}`);
    const previousStepElement = document.getElementById(`delivery-step-${currentDeliveryStep - 1}`);
    
    if (currentStepElement && previousStepElement) {
        // Cacher l'étape actuelle
        currentStepElement.style.display = 'none';
        
        // Afficher l'étape précédente
        previousStepElement.style.display = 'block';
        
        // Décrémenter le compteur d'étape
        currentDeliveryStep--;
        
        // Mettre à jour le titre
        const modalTitle = document.querySelector('.delivery-modal-title');
        if (modalTitle) {
            if (currentDeliveryStep === 1) {
                modalTitle.textContent = 'Choisir votre mode de livraison';
            } else if (currentDeliveryStep === 2) {
                if (currentDeliveryOption === 'scheduled') {
                    modalTitle.textContent = 'Choisir l\'heure de livraison';
                } else {
                    modalTitle.textContent = 'Adresse de livraison';
                }
            } else if (currentDeliveryStep === 3) {
                modalTitle.textContent = 'Adresse de livraison';
            }
        }
    }
}

// Traiter la commande avec la livraison
async function processOrderWithDelivery() {
    if (!currentUser) {
        alert('Veuillez vous connecter pour passer commande.');
        return;
    }
    
    try {
        // Préparer les données de commande
        const orderItems = cart.map(item => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity * item.count,
            price: item.price,
            total: item.price * item.count
        }));
        
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.count), 0);
        
        // Préparer les données de livraison
        const deliveryData = {
            type: currentDeliveryOption,
            address: deliveryAddress,
            timeSlot: currentDeliveryOption === 'scheduled' ? selectedTimeSlot : null
        };
        
        // Simuler l'envoi de la commande au serveur
        // Dans une application réelle, vous feriez un appel API ici
        console.log('Envoi de la commande avec livraison:', {
            items: orderItems,
            totalAmount,
            delivery: deliveryData
        });
        
        // Simuler une réponse positive
        setTimeout(() => {
            // Afficher un message de confirmation
            alert('Votre commande a été enregistrée avec succès! Un livreur va vous contacter bientôt.');
            
            // Vider le panier
            cart = [];
            saveCart();
            updateCartCount();
            
            // Fermer le modal de livraison
            closeDeliveryModal();
            
// Fermer le modal du panier
            const cartModal = document.getElementById('cart-modal');
            const overlay = document.getElementById('overlay');
            
            if (cartModal) cartModal.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
            
            // Mettre à jour les commandes
            fetchUserOrders();
        }, 1000);
        
    } catch (error) {
        console.error('Erreur lors du traitement de la commande:', error);
        alert(`Erreur lors du traitement de la commande: ${error.message}`);
    }
}

// Afficher le modal de livraison
function showDeliveryModal() {
    // Créer ou récupérer le modal
    const deliveryModal = createDeliveryModal();
    
    // Si le panier est vide, afficher un message et ne pas ouvrir le modal
    if (!cart || cart.length === 0) {
        alert('Votre panier est vide. Veuillez ajouter des produits avant de passer commande.');
        return;
    }
    
    // Afficher le modal
    deliveryModal.classList.add('active');
    
    // Fermer le modal du panier
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.classList.remove('open');
    }
}

// Fonction utilitaire pour générer les créneaux horaires
function generateTimeSlots() {
    // Obtenir l'heure actuelle
    const now = new Date();
    const currentHour = now.getHours();
    
    let timeSlots = [];
    
    // Générer des créneaux de 10h à 22h
    for (let hour = 10; hour <= 22; hour++) {
        // Vérifier si l'heure est déjà passée
        const isPast = hour <= currentHour;
        
        timeSlots.push({
            hour: hour,
            label: `${hour}:00`,
            disabled: isPast
        });
    }
    
    return timeSlots;
}

// Fonction utilitaire pour valider l'adresse
function validateAddress(address) {
    // Simple validation: vérifier que l'adresse n'est pas vide
    return address && address.trim().length > 0;
}

// Fonction utilitaire pour formater le prix
function formatPrice(price) {
    return Number(price).toFixed(2) + '€';
}

// Fonction pour générer le récapitulatif de la commande
function generateOrderSummary() {
    // Calculer le total
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.count), 0);
    
    // Préparer le résumé des articles
    let itemsSummary = '';
    cart.forEach(item => {
        itemsSummary += `
        <div class="summary-row">
            <div>${item.name} (${item.quantity}g x ${item.count})</div>
            <div>${formatPrice(item.price * item.count)}</div>
        </div>
        `;
    });
    
    // Informations de livraison
    const deliveryInfo = `
    <div class="summary-section-title">Livraison</div>
    <div class="summary-row">
        <div>Type de livraison</div>
        <div>${currentDeliveryOption === 'instant' ? 'Instantanée' : 'Planifiée'}</div>
    </div>
    ${currentDeliveryOption === 'scheduled' ? 
        `<div class="summary-row">
            <div>Heure de livraison</div>
            <div>${selectedTimeSlot}:00</div>
        </div>` : ''}
    <div class="summary-row">
        <div>Adresse</div>
        <div>${deliveryAddress}</div>
    </div>
    `;
    
    // Assembler le récapitulatif complet
    return `
    <div class="order-summary">
        <div class="summary-section-title">Votre commande</div>
        ${itemsSummary}
        
        ${deliveryInfo}
        
        <div class="summary-row summary-total">
            <div>Total</div>
            <div>${formatPrice(totalAmount)}</div>
        </div>
    </div>
    `;
}


                                                    
    // Récupération des commandes utilisateur
    async function fetchUserOrders() {
        try {
            const response = await fetch('/api/orders/user', {
                credentials: 'include' // Important pour envoyer les cookies de session
            });
            
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
            const response = await fetch('/api/products', {
                credentials: 'include' // Important pour envoyer les cookies de session
            });
            
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
            productCard.dataset.category = product.category ? product.category.toLowerCase() : ''; // Ajouter la catégorie comme attribut de données
            
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
                    const response = await fetch('/api/auth/logout', {
                        credentials: 'include' // Important pour envoyer les cookies de session
                    });
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
            // Remplacer le gestionnaire d'événements existant par celui-ci
            checkoutBtn.addEventListener('click', function() {
                // Vérifier si le panier contient des articles
                if (cart.length > 0) {
                    // Ouvrir le modal de livraison au lieu de processOrder()
                    showDeliveryModal();
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
            
            // Fermer également le modal de livraison
            const deliveryModal = document.getElementById('delivery-modal');
            if (deliveryModal) {
                deliveryModal.classList.remove('active');
            }
            
            this.classList.remove('active');
        });
    }
}
    
    // Traitement de la commande
async function processOrder() {
    // Cette fonction est conservée pour compatibilité mais ne sera plus utilisée directement
    // Rediriger vers le modal de livraison
    showDeliveryModal();
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
                    
                    // Gérer la navigation
                    const text = this.textContent.trim();
                    
                    if (text.includes('Produits')) {
                        window.location.href = '/dashboard.html';
                    } else if (text.includes('Profil')) {
                        window.location.href = '/profil.html';
                    } else if (text.includes('Commandes')) {
                        window.location.href = '/commandes.html';
                    } else if (text.includes('Déconnexion')) {
                        logout();
                    }
                    
                    // Fermer la barre latérale sur mobile
                    if (window.innerWidth < 768) {
                        sidebar.classList.remove('open');
                        if (overlay) overlay.classList.remove('active');
                    }
                });
            });
        }
    }

    // Fonction de déconnexion
    async function logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                credentials: 'include' // Important pour envoyer les cookies de session
            });
            console.log('Réponse de déconnexion:', await response.text());
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    }

    // Configuration des événements
    function setupEventListeners() {
        const ordersButton = document.getElementById('orders-button');
        if (ordersButton) {
            ordersButton.addEventListener('click', displayOrders);
        }
        
        // Configurer le bouton de profil
        const profileButton = document.getElementById('profile-button');
        if (profileButton) {
            profileButton.addEventListener('click', () => {
                window.location.href = '/profil.html';
            });
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
function addDeliveryStyles() {
    // Vérifier si les styles existent déjà
    if (!document.getElementById('delivery-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'delivery-styles';
        
        // Ajouter les styles CSS
        styleSheet.innerHTML = `
        /* Styles pour le modal de livraison */
        .delivery-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
        }
        
        .delivery-modal.active {
            opacity: 1;
            visibility: visible;
        }
        
        .delivery-modal-content {
            width: 90%;
            max-width: 500px;
            background-color: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: var(--card-shadow);
            max-height: 90vh;
            display: flex;
            flex-direction: column;
        }
        
        .delivery-modal-header {
            background: linear-gradient(135deg, var(--primary-blue) 0%, var(--dark-blue) 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .delivery-modal-title {
            font-weight: bold;
            font-size: 1.2rem;
        }
        
        .delivery-modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
        }
        
        .delivery-modal-body {
            padding: 20px;
            overflow-y: auto;
        }
        
        .delivery-options {
            display: flex;
            gap: 15px;
            margin-bottom: 25px;
            flex-direction: column;
        }
        
        .delivery-option {
            background-color: white;
            border: 2px solid #ddd;
            border-radius: 15px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
        }
        
        .delivery-option:hover {
            border-color: var(--primary-blue);
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .delivery-option.selected {
            border-color: var(--primary-blue);
            background-color: rgba(69, 211, 255, 0.1);
        }
        
        .delivery-option-icon {
            font-size: 1.5rem;
            margin-right: 15px;
            color: var(--dark-blue);
        }
        
        .delivery-option-content {
            flex: 1;
        }
        
        .delivery-option-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .delivery-option-description {
            font-size: 0.9rem;
            color: #666;
        }
        
        .delivery-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .form-group label {
            font-weight: bold;
            font-size: 0.9rem;
        }
        
        .form-control {
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s;
        }
        
        .form-control:focus {
            outline: none;
            border-color: var(--primary-blue);
        }
        
        .time-slots {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
        }
        
        .time-slot {
            padding: 10px;
            text-align: center;
            border: 1px solid #ddd;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .time-slot:hover {
            background-color: rgba(69, 211, 255, 0.1);
            border-color: var(--primary-blue);
        }
        
        .time-slot.selected {
            background-color: var(--primary-blue);
            color: white;
            border-color: var(--primary-blue);
        }
        
        .time-slot.disabled {
            opacity: 0.5;
            cursor: not-allowed;
            background-color: #f0f0f0;
        }
        
        .delivery-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
        
        .delivery-btn {
            padding: 12px 20px;
            border-radius: 10px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }
        
        .delivery-back-btn {
            background-color: #f0f0f0;
            color: #333;
        }
        
        .delivery-next-btn {
            background-color: var(--primary-blue);
            color: white;
        }
        
        .delivery-next-btn:hover {
            background-color: var(--dark-blue);
            transform: translateY(-2px);
        }
        
        .delivery-next-btn:disabled {
            background-color: #ddd;
            color: #999;
            cursor: not-allowed;
            transform: none;
        }
        
        .order-summary {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 0.9rem;
        }
        
        .summary-section-title {
            font-weight: bold;
            margin: 10px 0 5px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #eee;
        }
        
        .summary-total {
            font-weight: bold;
            font-size: 1.1rem;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #ddd;
        }
        
        .fade-in {
            animation: fadeIn 0.5s forwards;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .error-message {
            color: #e74c3c;
            font-size: 0.85rem;
            margin-top: 5px;
        }
        
        @media (max-width: 576px) {
            .delivery-modal-content {
                width: 95%;
            }
            
            .time-slots {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .delivery-actions {
                flex-direction: column;
                gap: 10px;
            }
            
            .delivery-actions button {
                width: 100%;
            }
        }
        `;
        
        // Ajouter la feuille de style au head du document
        document.head.appendChild(styleSheet);
    }
}
// Initialisation
async function init() {
    console.log('Initialisation du dashboard');
    
    try {
        // Ajouter les styles CSS pour le système de livraison
        addDeliveryStyles();
        
        // Vérifier l'authentification avant de charger le reste
        const authStatus = await checkAuth();
        
        if (!authStatus) {
            console.error("L'authentification a échoué, redirection vers login");
            window.location.href = '/login.html';
            return;
        }
        
        console.log("Authentification réussie, chargement du dashboard");
        
        // Seulement si authentifié
        loadCart(); // Charger le panier depuis localStorage
        setupLogout();
        fetchUserOrders();
        fetchProducts(); // Cette fonction appellera setupCategoryFilters une fois les produits chargés
        setupEventListeners();
    } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
        // Ne pas rediriger automatiquement en cas d'erreur pour éviter les boucles infinies
    }
}
// Démarrer l'application
init();
});
