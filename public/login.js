document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const telegramKey = document.getElementById('telegram-key').value.trim();
        
        if (!telegramKey) {
            alert('Veuillez entrer votre clé Telegram');
            return;
        }
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ key: telegramKey }),
                credentials: 'include' // Important pour les cookies de session
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Connexion réussie
                alert('Connexion réussie!');
                window.location.href = data.redirectUrl || '/dashboard';
            } else {
                // Erreur de connexion
                alert(data.message || 'Clé invalide. Veuillez réessayer.');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            alert('Une erreur est survenue. Veuillez réessayer plus tard.');
        }
    });
});
