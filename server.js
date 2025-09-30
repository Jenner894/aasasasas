const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de compression pour optimiser les performances
app.use(compression());

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname), {
    maxAge: '1d', // Cache les fichiers pour 1 jour
    etag: true
}));

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur LandingIA démarré sur le port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
    console.log('👋 Arrêt du serveur...');
    process.exit(0);
});