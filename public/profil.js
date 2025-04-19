// État global pour stocker les informations de l'utilisateur
let currentUser = null;

// Fonction pour récupérer les informations de l'utilisateur
// Fonction pour récupérer les informations de l'utilisateur
async function getUserProfile() {
    try {
        // Utiliser la nouvelle route API
        const response = await fetch('/api/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'  // Important pour envoyer les cookies de session
        });
        
        if (response.status === 401) {
            console.warn('Session utilisateur non authentifiée');
            showNotification('Session expirée, veuillez vous reconnecter', 'error');
            
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            
            return false;
        }
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const userData = await response.json();
        console.log("Données utilisateur reçues:", userData);
        
        // Mettre à jour l'utilisateur actuel
        currentUser = userData;
        updateProfileUI(currentUser);
        return true;
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        showNotification('Erreur lors du chargement du profil', 'error');
        return false;
    }
}
// Fonction pour basculer l'affichage de la clé Telegram
function toggleTelegramKey() {
    const keyElement = document.getElementById('profile-telegram-key');
    const eyeIcon = document.getElementById('eye-icon');
    
    if (keyElement.textContent === '•••••••••••••' && currentUser && currentUser.telegramKey) {
        keyElement.textContent = currentUser.telegramKey;
        eyeIcon.textContent = '🔒';
    } else {
        keyElement.textContent = '•••••••••••••';
        eyeIcon.textContent = '👁️';
    }
}

// Fonction pour ouvrir le modal de modification du nom d'utilisateur
function openUsernameModal() {
    const modal = document.getElementById('username-modal');
    const overlay = document.getElementById('modal-overlay');
    const usernameInput = document.getElementById('new-username');
    
    // Pré-remplir avec le nom d'utilisateur actuel
    if (currentUser && currentUser.username) {
        usernameInput.value = currentUser.username;
    }
    
    modal.classList.add('active');
    overlay.classList.add('active');
    usernameInput.focus();
}

// Fonction pour fermer tous les modals
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    const overlay = document.getElementById('modal-overlay');
    
    modals.forEach(modal => modal.classList.remove('active'));
    if (overlay) overlay.classList.remove('active');
}

// Fonction pour ouvrir le modal de confirmation de régénération de clé
function openRegenerateKeyModal() {
    const modal = document.getElementById('regenerate-key-modal');
    const overlay = document.getElementById('modal-overlay');
    
    modal.classList.add('active');
    overlay.classList.add('active');
}

// Fonction pour mettre à jour l'interface utilisateur avec les données du profil
function updateProfileUI(user) {
    if (!user) {
        console.error("Pas de données utilisateur disponibles pour mettre à jour l'UI");
        return;
    }
    
    console.log("Mise à jour de l'interface avec les données utilisateur:", user);
    
    // Mettre à jour les informations principales du profil
    const usernameElement = document.getElementById('profile-username');
    if (usernameElement) usernameElement.textContent = user.username || 'Non défini';
    
    const joinDateElement = document.getElementById('profile-join-date');
    if (joinDateElement) joinDateElement.textContent = user.joinDate || 'Non défini';
    
    const accountTypeElement = document.getElementById('profile-account-type');
    if (accountTypeElement) accountTypeElement.textContent = user.accountType || 'Client';
    
    const telegramKeyElement = document.getElementById('profile-telegram-key');
    if (telegramKeyElement) telegramKeyElement.textContent = user.telegramKey || '•••••••••••••';
    
    // Mettre à jour les statistiques
    if (user.stats) {
        const totalOrdersElement = document.getElementById('stat-total-orders');
        if (totalOrdersElement) totalOrdersElement.textContent = user.stats.totalOrders || '0';
        
        const totalSpentElement = document.getElementById('stat-total-spent');
        if (totalSpentElement) totalSpentElement.textContent = user.stats.totalSpent || '0€';
        
        const lastOrderElement = document.getElementById('stat-last-order');
        if (lastOrderElement) lastOrderElement.textContent = user.stats.lastOrder || 'N/A';
        
        // Ajouter les points de fidélité si disponibles
        const loyaltyPointsElement = document.getElementById('stat-loyalty-points');
        if (loyaltyPointsElement) {
            loyaltyPointsElement.textContent = user.stats.loyaltyPoints || '0';
        }
        
        // Gestion du programme de parrainage
        const referralCodeElement = document.querySelector('.referral-code');
        if (referralCodeElement && user.stats.referralCode) {
            referralCodeElement.textContent = user.stats.referralCode;
            
            // Ajouter le bouton de copie s'il n'existe pas déjà
            if (!referralCodeElement.querySelector('.copy-btn')) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.title = 'Copier';
                copyBtn.innerHTML = '📋';
                copyBtn.addEventListener('click', () => copyToClipboard(user.stats.referralCode));
                referralCodeElement.appendChild(copyBtn);
            }
        }
    }
    
    // Initialiser l'identifiant Telegram dans l'input si disponible
    const telegramInput = document.getElementById('telegram-notification');
    if (telegramInput && user.telegamId) {
        telegramInput.value = user.telegamId;
    }
}

// Fonction pour copier le texte dans le presse-papier
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => showNotification('Copié dans le presse-papier!', 'success'))
        .catch(err => showNotification('Erreur lors de la copie', 'error'));
}

// Fonction pour afficher une notification
function showNotification(message, type = 'info') {
    // Créer l'élément de notification s'il n'existe pas déjà
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        notification.style.zIndex = '9999';
        notification.style.transition = 'all 0.3s ease';
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        document.body.appendChild(notification);
    }
    
    // Définir le style en fonction du type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4caf50';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            notification.style.color = 'white';
            break;
        default:
            notification.style.backgroundColor = '#2196f3';
            notification.style.color = 'white';
    }
    
    // Mettre à jour le message et afficher la notification
    notification.textContent = message;
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
    
    // Cacher la notification après 3 secondes
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
    }, 3000);
}

// Gestionnaire pour modifier le nom d'utilisateur
async function updateUsername(newUsername) {
    if (!newUsername || (currentUser && newUsername === currentUser.username)) return;
    
    try {
        const response = await fetch('/api/user/username', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: newUsername }),
            credentials: 'include' // Important pour envoyer les cookies de session
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de la mise à jour du nom d\'utilisateur');
        }
        
        if (currentUser) {
            currentUser.username = data.username;
            document.getElementById('profile-username').textContent = currentUser.username;
        }
        showNotification('Nom d\'utilisateur mis à jour avec succès!', 'success');
    } catch (error) {
        console.error('Erreur lors de la mise à jour du nom d\'utilisateur:', error);
        showNotification(error.message, 'error');
    }
}

// Gestionnaire pour mettre à jour l'identifiant Telegram
async function updateTelegramId(telegramId) {
    try {
        const response = await fetch('/api/user/telegram-id', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ telegramId }),
            credentials: 'include' // Important pour envoyer les cookies de session
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de la mise à jour de l\'identifiant Telegram');
        }
        
        if (currentUser) {
            currentUser.telegamId = telegramId;
        }
        showNotification('Identifiant Telegram mis à jour avec succès!', 'success');
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'identifiant Telegram:', error);
        showNotification(error.message, 'error');
    }
}

// Gestionnaire pour régénérer la clé Telegram
async function regenerateKey() {
    if (!confirm('Êtes-vous sûr de vouloir régénérer votre clé Telegram? Cette action est irréversible.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/user/regenerate-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // Important pour envoyer les cookies de session
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de la régénération de la clé');
        }
        
        if (currentUser) {
            currentUser.telegramKey = data.newKey;
            document.getElementById('profile-telegram-key').textContent = data.newKey;
        }
        
        // Afficher la nouvelle clé à l'utilisateur
        alert(`Votre nouvelle clé Telegram est: ${data.newKey}\nVeuillez la conserver en lieu sûr.`);
        showNotification('Clé Telegram régénérée avec succès!', 'success');
    } catch (error) {
        console.error('Erreur lors de la régénération de la clé:', error);
        showNotification(error.message, 'error');
    }
}

// Gestionnaire pour la déconnexion
function logout() {
    fetch('/api/auth/logout', {
        credentials: 'include' // Important pour envoyer les cookies de session
    })
    .then(() => {
        window.location.href = '/login.html';
    })
    .catch(error => {
        console.error('Erreur lors de la déconnexion:', error);
    });
}

// Initialisation des boutons de partage
function initializeShareButtons() {
    // Attendre que currentUser soit initialisé
    if (!currentUser || !currentUser.stats || !currentUser.stats.referralCode) {
        console.warn("Informations de référence non disponibles pour les boutons de partage");
        setTimeout(initializeShareButtons, 500); // Réessayer dans 500ms
        return;
    }
    
    const referralCode = currentUser.stats.referralCode;
    console.log("Initialisation des boutons de partage avec le code:", referralCode);
    
    // Boutons de partage
    const shareTelegram = document.querySelector('.share-telegram');
    const shareWhatsapp = document.querySelector('.share-whatsapp');
    const shareEmail = document.querySelector('.share-email');
    
    if (shareTelegram) {
        shareTelegram.addEventListener('click', () => {
            const message = `Rejoins Allo Bedo avec mon code de parrainage: ${referralCode}`;
            window.open(`https://t.me/share/url?url=${encodeURIComponent(message)}`);
        });
    }
    
    if (shareWhatsapp) {
        shareWhatsapp.addEventListener('click', () => {
            const message = `Rejoins Allo Bedo avec mon code de parrainage: ${referralCode}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
        });
    }
    
    if (shareEmail) {
        shareEmail.addEventListener('click', () => {
            const subject = 'Rejoins Allo Bedo';
            const body = `Utilise mon code de parrainage pour rejoindre Allo Bedo: ${referralCode}`;
            window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        });
    }
    
    console.log("Boutons de partage initialisés avec succès");
}

// Fonction pour initialiser les gestionnaires d'événements une fois que le DOM est chargé
function initEventListeners() {
    console.log("Initialisation des gestionnaires d'événements");
    
    // Gestionnaires existants (sidebar, navigation, etc.)
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            console.log("Toggle sidebar");
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
        });
    }
    
    if (closeSidebar && sidebar) {
        closeSidebar.addEventListener('click', () => {
            console.log("Close sidebar");
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (sidebar) sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
    
    // Navigation dans la barre latérale
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        const text = item.textContent.trim();
        
        item.addEventListener('click', () => {
            console.log("Sidebar item clicked:", text);
            
            if (text.includes('Produits')) {
                window.location.href = '/dashboard';
            } else if (text.includes('Commandes')) {
                window.location.href = '/commandes';
            } else if (text.includes('Déconnexion')) {
                logout();
            }
        });
    });
    
    // Bouton de commandes dans le header
    const ordersButton = document.getElementById('orders-button');
    if (ordersButton) {
        ordersButton.addEventListener('click', () => {
            window.location.href = '/dashboard.html';
        });
    }
    
    // Bouton de modification de profil
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openUsernameModal);
    }
    
    // Bouton pour afficher/masquer la clé Telegram
    const toggleKeyBtn = document.getElementById('toggle-key-btn');
    if (toggleKeyBtn) {
        toggleKeyBtn.addEventListener('click', toggleTelegramKey);
    }
    
    // Bouton pour régénérer la clé Telegram
    const regenerateKeyBtn = document.getElementById('regenerate-key-btn');
    if (regenerateKeyBtn) {
        regenerateKeyBtn.addEventListener('click', openRegenerateKeyModal);
    }
    
    // Gestion des modals
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    // Overlay des modals
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModals);
    }
    
    // Boutons du modal de nom d'utilisateur
    const saveUsernameBtn = document.getElementById('save-username-btn');
    if (saveUsernameBtn) {
        saveUsernameBtn.addEventListener('click', () => {
            const newUsername = document.getElementById('new-username').value;
            updateUsername(newUsername);
            closeModals();
        });
    }
    
    const cancelUsernameBtn = document.getElementById('cancel-username-btn');
    if (cancelUsernameBtn) {
        cancelUsernameBtn.addEventListener('click', closeModals);
    }
    
    // Boutons du modal de régénération de clé
    const confirmRegenerateBtn = document.getElementById('confirm-regenerate-btn');
    if (confirmRegenerateBtn) {
        confirmRegenerateBtn.addEventListener('click', () => {
            regenerateKey();
            closeModals();
        });
    }
    
    const cancelRegenerateBtn = document.getElementById('cancel-regenerate-btn');
    if (cancelRegenerateBtn) {
        cancelRegenerateBtn.addEventListener('click', closeModals);
    }
    
    // Bouton de déconnexion
    const logoutItem = document.getElementById('logout-item');
    if (logoutItem) {
        logoutItem.addEventListener('click', logout);
    }
    
    // Bouton de sauvegarde des paramètres
    const saveSettingsBtn = document.querySelector('.save-settings-btn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const telegramId = document.getElementById('telegram-notification').value;
            updateTelegramId(telegramId);
        });
    }
    
    // Initialiser les boutons de partage séparément
    initializeShareButtons();
    
    console.log("Gestionnaires d'événements initialisés avec succès");
}

// Fonction principale d'initialisation
async function init() {
    console.log("Initialisation de la page profil");
    try {
        // Attendre explicitement la récupération du profil avant de continuer
        const profileSuccess = await getUserProfile();
        
        // Seulement initialiser les événements si la récupération du profil a réussi
        if (profileSuccess) {
            initEventListeners();
            console.log("Profil initialisé avec succès");
        } else {
            console.warn("Échec de l'initialisation du profil - les événements n'ont pas été configurés");
        }
    } catch (error) {
        console.error("Erreur d'initialisation:", error);
        showNotification("Erreur lors du chargement du profil", "error");
    }
}

// Exécuter la fonction d'initialisation lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', init);
