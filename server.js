const express = require('express');
const path = require('path');
const helmet = require('helmet'); // Ajout de l'import helmet
const cors = require('cors'); // Ajout de l'import cors
const session = require('express-session'); // Ajout de l'import express-session
const mongoose = require('mongoose'); // Ajout de l'import mongoose
const app = express();
require('dotenv').config();
const router = express.Router();
const PORT = process.env.PORT || 3000;


const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    keys: { type: String, required: true },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
});
const User = mongoose.model('User', UserSchema);

// Middleware d'authentification par session
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/404.html'); // Rediriger vers la page 404 si non authentifié
  }
};

// Middleware de sécurité avec helmet
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Désactive COEP pour éviter les erreurs de chargement
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["*"],
      },
    },
  })
);

const debugSession = (req, res, next) => {
  console.log('Session user:', req.session?.user);
  next();
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = ['https://allob-1.onrender.com', 'http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Important pour envoyer les cookies de session
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Configuration des sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'mySecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Passe à true si HTTPS
    httpOnly: true, // Empêche l'accès au cookie via JS côté client
    sameSite: 'lax' // Assure le partage des cookies via CORS
  }
}));

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connecté à MongoDB'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));




// Route d'authentification pour vérifier la clé Telegram
app.post('/api/auth/login', async (req, res) => {
    try {
        const { key } = req.body;
        
        if (!key) {
            return res.status(400).json({ message: 'Clé Telegram requise' });
        }
        
        // Recherche de l'utilisateur par clé dans la base de données
        const user = await User.findOne({ keys: key });
        
        if (!user) {
            return res.status(401).json({ message: 'Clé Telegram invalide' });
        }
        
        // Création d'une session pour l'utilisateur
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role
        };
        
        // Déterminer l'URL de redirection en fonction du rôle
        let redirectUrl = '/dashboard';
        if (user.role === 'admin') {
            redirectUrl = '/admin-dashboard';
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
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        return res.status(500).json({ message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
});
app.get('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
        }
        res.redirect('/login');
    });
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Routes publiques
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Création du serveur HTTP
const server = require('http').createServer(app); // Ajout de la création du serveur

server.listen(PORT, '0.0.0.0', () => console.log(`Serveur démarré sur le port ${PORT}`));
