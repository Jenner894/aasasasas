// État global pour stocker les informations de l'utilisateur
let currentUser = null;

// Fonction pour vérifier l'authentification
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/login.html';
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Fonction pour récupérer les informations de l'utilisateur
async function getUserProfile() {
    try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de la récupération du profil');
        }
        
        currentUser = data.user;
        updateProfileUI(currentUser);
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        showNotification('Erreur lors du chargement du profil', 'error');
    }
}

// Fonction pour mettre à jour l'interface utilisateur avec les données du profil
function updateProfileUI(user) {
    // Mettre à jour les informations principales du profil
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-join-date').textContent = user.joinDate;
    document.getElementById('profile-account-type').textContent = user.accountType;
    document.getElementById('profile-telegram-key').textContent = '•••••••••••••';
    
    // Mettre à jour les statistiques
    document.getElementById('stat-total-orders').textContent = user.stats.totalOrders;
    document.getElementById('stat-total-spent').textContent = user.stats.totalSpent;
    document.getElementById('stat-last-order').textContent = user.stats.lastOrder;
    
    // Mettre à jour le code de parrainage
    const referralCodeElement = document.querySelector('.referral-code');
    if (referralCodeElement) {
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
async function updateUsername() {
    const newUsername = prompt('Entrez votre nouveau nom d\'utilisateur:', currentUser.username);
    
    if (!newUsername || newUsername === currentUser.username) return;
    
    try {
        const response = await fetch('/api/user/username', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: newUsername })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de la mise à jour du nom d\'utilisateur');
        }
        
        currentUser.username = data.username;
        document.getElementById('profile-username').textContent = currentUser.username;
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
            body: JSON.stringify({ telegramId })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de la mise à jour de l\'identifiant Telegram');
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
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de la régénération de la clé');
        }
        
        currentUser.telegramKey = data.newKey;
        
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
    fetch('/api/auth/logout')
        .then(() => {
            window.location.href = '/login.html';
        })
        .catch(error => {
            console.error('Erreur lors de la déconnexion:', error);
        });
}

// Fonction pour initialiser les gestionnaires d'événements une fois que le DOM est chargé
function initEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }
    
    if (closeSidebar && sidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
    
    // Bouton de modification de profil
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            const options = [
                'Modifier mon nom d\'utilisateur',
                'Régénérer ma clé Telegram',
                'Annuler'
            ];
            
            const choice = prompt(`Choisissez une option:\n1. ${options[0]}\n2. ${options[1]}\n3. ${options[2]}`);
            
            switch (choice) {
                case '1':
                    updateUsername();
                    break;
                case '2':
                    regenerateKey();
                    break;
                default:
                    // Annuler
                    break;
            }
        });
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
    
    // Boutons de partage
    const shareTelegram = document.querySelector('.share-telegram');
    const shareWhatsapp = document.querySelector('.share-whatsapp');
    const shareEmail = document.querySelector('.share-email');
    
    if (shareTelegram && currentUser) {
        shareTelegram.addEventListener('click', () => {
            const message = `Rejoins Allo Bedo avec mon code de parrainage: ${currentUser.stats.referralCode}`;
            window.open(`https://t.me/share/url?url=${encodeURIComponent(message)}`);
        });
    }
    
    if (shareWhatsapp && currentUser) {
        shareWhatsapp.addEventListener('click', () => {
            const message = `Rejoins Allo Bedo avec mon code de parrainage: ${currentUser.stats.referralCode}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
        });
    }
    
    if (shareEmail && currentUser) {
        shareEmail.addEventListener('click', () => {
            const subject = 'Rejoins Allo Bedo';
            const body = `Utilise mon code de parrainage pour rejoindre Allo Bedo: ${currentUser.stats.referralCode}`;
            window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        });
    }
}

// Fonction principale d'initialisation
async function init() {
    const isAuthenticated = await checkAuth();
    
    if (isAuthenticated) {
        await getUserProfile();
        initEventListeners();
        
        // Initialiser l'identifiant Telegram dans l'input si disponible
        if (currentUser && currentUser.telegamId) {
            const telegramInput = document.getElementById('telegram-notification');
            if (telegramInput) {
                telegramInput.value = currentUser.telegamId;
            }
        }
    }
}

// Exécuter la fonction d'initialisation lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', init);
