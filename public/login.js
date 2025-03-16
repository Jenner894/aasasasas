document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');

    // Vérifier si l'utilisateur est déjà connecté lors du chargement de la page
    checkAuthStatus();
    
    // Fonction pour vérifier le statut d'authentification
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status', {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.authenticated) {
                // Utilisateur déjà connecté, rediriger vers le dashboard
                window.location.href = data.user.role === 'admin' ? '/admin-dashboard.html' : '/dashboard.html';
            }
        } catch (error) {
            console.error('Erreur lors de la vérification du statut d\'authentification:', error);
        }
    }
    
    // Créer la structure de notification
    function createNotification() {
        // Vérifier si la notification existe déjà
        if (document.getElementById('notification-container')) {
            return document.getElementById('notification-container');
        }
        
        // Créer l'élément conteneur de notification
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
        notificationContainer.style.maxWidth = '300px';
        
        document.body.appendChild(notificationContainer);
        return notificationContainer;
    }
    
    // Afficher une notification
    function showNotification(message, type = 'success') {
        const container = createNotification();
        
        // Créer la notification
        const notification = document.createElement('div');
        notification.className = 'notification ' + type;
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '10px';
        notification.style.marginBottom = '10px';
        notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        notification.style.display = 'flex';
        notification.style.alignItems = 'center';
        notification.style.justifyContent = 'space-between';
        notification.style.animation = 'slideIn 0.3s ease-out forwards';
        
        // Couleurs en fonction du type
        if (type === 'success') {
            notification.style.backgroundColor = '#45d3ff';
            notification.style.color = 'white';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ff4545';
            notification.style.color = 'white';
        }
        
        // Contenu de la notification
        notification.innerHTML = `
            <div style="margin-right: 10px;">${message}</div>
            <button style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">&times;</button>
        `;
        
        // Ajouter la notification au conteneur
        container.appendChild(notification);
        
        // Ajouter le style d'animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Fermer la notification au clic sur le bouton
        const closeButton = notification.querySelector('button');
        closeButton.addEventListener('click', function() {
            notification.style.animation = 'fadeOut 0.3s ease-in forwards';
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        });
        
        // Fermer automatiquement après 5 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'fadeOut 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        container.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }
    
    // Gestion de la soumission du formulaire
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const telegramKey = document.getElementById('telegram-key').value.trim();
        
        if (!telegramKey) {
            showNotification('Veuillez entrer votre clé Telegram', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key: telegramKey }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Connexion réussie
                showNotification(`Connexion réussie! Bienvenue ${data.user.username}`, 'success');
                
                // Rediriger après un court délai pour que l'utilisateur puisse voir la notification
                setTimeout(() => {
                    window.location.href = data.redirectUrl || '/dashboard.html';
                }, 1500);
            } else {
                // Erreur de connexion
                showNotification(data.message || 'Clé invalide. Veuillez réessayer.', 'error');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            showNotification('Une erreur est survenue. Veuillez réessayer plus tard.', 'error');
        }
    });
});
