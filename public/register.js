document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-form');
    const usernameInput = document.getElementById('username');
    const telegramIdInput = document.getElementById('telegram-id');
    const referralCodeInput = document.getElementById('referral-code');
    const registerButton = document.getElementById('register-button');
    const notification = document.getElementById('notification');
    
    // Valider le formulaire avant soumission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Réinitialiser les erreurs
        resetErrors();
        
        // Vérifier le nom d'utilisateur
        if (usernameInput.value.length < 3) {
            showError('username-error');
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
                    telegramId: telegramIdInput.value,
                    referralCode: referralCodeInput.value
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors de l\'inscription');
            }
            
            // Afficher la notification de succès
            showNotification('Inscription réussie ! Voici votre clé Telegram: ' + data.key, 'success');
            
            // Rediriger vers la page de login après un délai
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 5000);
            
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            showNotification(error.message, 'error');
            
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
});
