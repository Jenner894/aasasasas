document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-form');
    const usernameInput = document.getElementById('username');
    const phoneInput = document.getElementById('phone');
    const snapchatInput = document.getElementById('snapchat');
    const telegramIdInput = document.getElementById('telegram-id');
    const referralCodeInput = document.getElementById('referral-code');
    const registerButton = document.getElementById('register-button');
    const notification = document.getElementById('notification');
    
    // Éléments de la popup
    const keyModalOverlay = document.getElementById('key-modal-overlay');
    const telegramKeyDisplay = document.getElementById('telegram-key-display');
    const closeModalButton = document.getElementById('close-modal-button');
    const goLoginButton = document.getElementById('go-login-button');
    
    // Fonction pour afficher la popup avec la clé
    function showKeyModal(key) {
        telegramKeyDisplay.textContent = key;
        keyModalOverlay.style.display = 'flex';
    }
    
    // Événements pour les boutons de la popup
    closeModalButton.addEventListener('click', function() {
        keyModalOverlay.style.display = 'none';
    });
    
    goLoginButton.addEventListener('click', function() {
        window.location.href = '/login.html';
    });
    
    // Valider le formulaire avant soumission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Réinitialiser les erreurs
        resetErrors();
        
        // Valider le nom d'utilisateur
        if (usernameInput.value.length < 3) {
            showError('username-error');
            return;
        }
        
        // Valider le numéro de téléphone (format simple)
        const phoneRegex = /^[0-9+]{10,15}$/;
        if (!phoneRegex.test(phoneInput.value)) {
            showError('phone-error');
            return;
        }
        
        // Désactiver le bouton pour éviter les soumissions multiples
        registerButton.disabled = true;
        registerButton.textContent = "Inscription en cours...";
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usernameInput.value,
                    phone: phoneInput.value,
                    snapchat: snapchatInput.value,
                    telegramId: telegramIdInput.value,
                    referralCode: referralCodeInput.value
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de l\'inscription');
            }
            
            // Afficher la popup avec la clé au lieu de la notification
            showKeyModal(data.key);
            
            // Réinitialiser le formulaire
            form.reset();
            
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            showNotification(error.message, 'error');
        } finally {
            // Réactiver le bouton
            registerButton.disabled = false;
            registerButton.textContent = "S'inscrire";
        }
    });
    
    // Fonction pour afficher une notification
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = 'notification ' + type + ' show';
        
        // Cacher la notification après 5 secondes
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    // Fonction pour afficher une erreur spécifique
    function showError(errorId) {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.style.display = 'block';
        }
    }
    
    // Fonction pour réinitialiser toutes les erreurs
    function resetErrors() {
        const errors = document.querySelectorAll('.input-error');
        errors.forEach(error => {
            error.style.display = 'none';
        });
    }
    
    // Masquer les erreurs lorsque l'utilisateur commence à taper
    usernameInput.addEventListener('input', function() {
        document.getElementById('username-error').style.display = 'none';
    });
    
    phoneInput.addEventListener('input', function() {
        document.getElementById('phone-error').style.display = 'none';
    });
});
