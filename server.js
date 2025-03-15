const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();
const router = express.Router();
const PORT = process.env.PORT || 3000;


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

// CORS configuration (Assurez-vous que l'origine du client est correcte)
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


// Routes publiques
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
  });
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

server.listen(PORT, '0.0.0.0', () => console.log(`Serveur démarré sur le port ${PORT}`));
