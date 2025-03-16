const express = require('express');
const path = require('path');
const axios = require('axios');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 3000;

// Définition du schéma utilisateur
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    keys: { type: String, required: true },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
});
const User = mongoose.model('User', UserSchema);

// Configuration pour servir les fichiers statiques depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware d'authentification par session
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/login.html'); // Redirection vers la page de login si non authentifié
  }
};

// Middleware de sécurité avec helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "*"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Middleware pour déboguer les sessions
const debugSession = (req, res, next) => {
  console.log('Session user:', req.session?.user);
  next();
};

// Middleware pour parser le JSON et les données de formulaire
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration CORS
const allowedOrigins = ['https://allob-1.onrender.com', 'http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    // Permettre les requêtes sans origine (comme les appels API mobiles)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(null, false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'mySecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure en production (HTTPS)
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
}));

// Vérifie l'adresse IP du serveur
axios.get('https://api.ipify.org?format=json')
  .then(response => {
    console.log('Adresse IP du serveur:', response.data.ip);
  })
  .catch(error => {
    console.error('Erreur lors de la récupération de l\'IP:', error);
  });

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Route d'authentification pour vérifier la clé Telegram
app.post('/api/auth/login', async (req, res) => {
    console.log('Requête reçue sur /api/auth/login:', req.body);
    try {
        const { key } = req.body;
        
        if (!key) {
            return res.status(400).json({ message: 'Clé Telegram requise' });
        }
        
        // Recherche de l'utilisateur par clé dans la base de données
        const user = await User.findOne({ keys: key });
        console.log('Utilisateur trouvé:', user);
        
        if (!user) {
            return res.status(401).json({ message: 'Clé Telegram invalide' });
        }
        
        // Création d'une session pour l'utilisateur
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role
        };
        
        // Sauvegarder explicitement la session
        req.session.save(err => {
            if (err) {
                console.error('Erreur lors de la sauvegarde de la session:', err);
                return res.status(500).json({ message: 'Erreur de session' });
            }
            
            // Déterminer l'URL de redirection en fonction du rôle
            let redirectUrl = '/dashboard.html';
            if (user.role === 'admin') {
                redirectUrl = '/admin-dashboard.html';
            }
            
            // Retourner les informations de l'utilisateur et l'URL de redirection
            return res.status(200).json({ 
                message: 'Connexion réussie',
                user: {
                    username: user.username,
                    role: user.role
                },
                redirectUrl
            });
        });
    } catch (error) {
        console.error('Erreur d\'authentification détaillée:', error);
        return res.status(500).json({ message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
});

// Route de déconnexion
app.get('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la destruction de la session:', err);
            return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
        }
        res.redirect('/login.html');
    });
});

// Route pour le dashboard (protégée)
app.get('/dashboard.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Route pour le dashboard admin (protégée)
app.get('/admin-dashboard.html', isAuthenticated, (req, res, next) => {
    // Vérification du rôle admin
    if (req.session.user.role === 'admin') {
        res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
    } else {
        res.redirect('/dashboard.html');
    }
});

// Route pour vérifier l'état de l'authentification
app.get('/api/auth/status', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            authenticated: true,
            user: {
                username: req.session.user.username,
                role: req.session.user.role
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Routes publiques - redirection vers la page de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Création du serveur HTTP
const server = require('http').createServer(app);

// Démarrage du serveur
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});
