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


const ProductSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        required: true 
    },
    category: { 
        type: String, 
        required: true,
        enum: ['Fleurs', 'Résines'] // Correction de "Fleur" à "Fleurs"
    },
    // Utilisation uniquement de priceOptions pour les prix
    priceOptions: [{
        quantity: { type: Number, required: true }, // quantité en grammes
        price: { type: Number, required: true } // prix pour cette quantité
    }],
    thcContent: { 
        type: Number, 
        required: true,
        min: 0,
        max: 100
    },
    videoUrl: { 
        type: String,
        required: true
    },
    inStock: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Middleware pour mettre à jour la date de modification
ProductSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Création du modèle Product
const Product = mongoose.model('Product', ProductSchema);
const OrderSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },  // Référence à l'utilisateur qui a passé la commande
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['En attente', 'En préparation', 'Expédié', 'Livré', 'Annulé'],
        default: 'En attente'
    },
    createdAt: { type: Date, default: Date.now }
});

// Middleware pour mettre à jour la liste des commandes de l'utilisateur
OrderSchema.post('save', async function(doc) {
    await User.findByIdAndUpdate(
        doc.user,
        { $addToSet: { orders: doc._id } }
    );
});
// Méthode pour régénérer la clé Telegram
UserSchema.methods.regenerateKeys = function() {
    // Générer une nouvelle clé de 16 caractères
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let newKey = '';
    for (let i = 0; i < 16; i++) {
        newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.keys = newKey;
    return this.save();
};
// Modification du middleware post-save de Order pour mettre à jour les statistiques de l'utilisateur
OrderSchema.post('save', async function(doc) {
    try {
        // Trouver l'utilisateur associé à cette commande
        const user = await User.findById(doc.user);
        
        if (user) {
            // Ajouter cette commande à la liste des commandes de l'utilisateur
            await User.findByIdAndUpdate(
                doc.user,
                { 
                    $addToSet: { orders: doc._id },
                    $inc: { totalSpent: doc.totalPrice }, // Incrémenter le total dépensé
                    lastOrderDate: doc.createdAt // Mettre à jour la date de dernière commande
                }
            );
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des statistiques utilisateur:', error);
    }
});

// Ajout d'un middleware post-delete pour mettre à jour les statistiques en cas d'annulation de commande
OrderSchema.post('deleteOne', { document: true }, async function() {
    try {
        // Trouver l'utilisateur associé à cette commande
        const user = await User.findById(this.user);
        
        if (user) {
            // Retirer cette commande de la liste et réduire le total dépensé
            await User.findByIdAndUpdate(
                this.user,
                { 
                    $pull: { orders: this._id },
                    $inc: { totalSpent: -this.totalPrice } // Décrémenter le total dépensé
                }
            );
            
            // Mise à jour de la date de dernière commande (prendre la plus récente parmi les commandes restantes)
            const latestOrder = await Order.findOne({ user: this.user }).sort({ createdAt: -1 });
            if (latestOrder) {
                await User.findByIdAndUpdate(
                    this.user,
                    { lastOrderDate: latestOrder.createdAt }
                );
            }
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des statistiques utilisateur après suppression:', error);
    }
});
const Order = mongoose.model('Order', OrderSchema);
// Définition du schéma utilisateur
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    keys: { type: String, required: true },
    role: { type: String, enum: ['client', 'admin'], default: 'client' },
    createdAt: { type: Date, default: Date.now },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    totalSpent: { type: Number, default: 0 },
    lastOrderDate: { type: Date },
    referralCode: { type: String, unique: true },
    telegramId: { type: String, default: '' }
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



////////////    Dashboard ////////////////


// Route pour récupérer tous les produits
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des produits' });
    }
});

// Route pour récupérer un produit par son ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }
        res.status(200).json({ success: true, product });
    } catch (error) {
        console.error('Erreur lors de la récupération du produit:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du produit' });
    }
});

// Route pour ajouter un produit (protégée, admin seulement)
app.post('/api/products', isAuthenticated, async (req, res) => {
    // Vérifier si l'utilisateur est admin
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    
    try {
        const { name, description, category, pricePerGram, thcContent, videoUrl, inStock } = req.body;
        
        // Validation des données
        if (!name || !description || !category || !pricePerGram || thcContent === undefined || !videoUrl) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }
        
        const newProduct = new Product({
            name,
            description,
            category,
            pricePerGram,
            thcContent,
            videoUrl,
            inStock: inStock !== undefined ? inStock : true
        });
        
        await newProduct.save();
        
        res.status(201).json({ success: true, product: newProduct });
    } catch (error) {
        console.error('Erreur lors de la création du produit:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création du produit' });
    }
});

// Route pour récupérer les commandes de l'utilisateur connecté
app.get('/api/orders/user', isAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.session.user.id });
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commandes' });
    }
});
// Route pour mettre à jour un produit (protégée, admin seulement)
app.put('/api/products/:id', isAuthenticated, async (req, res) => {
    // Vérifier si l'utilisateur est admin
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    
    try {
        const { name, description, category, pricePerGram, thcContent, videoUrl, inStock } = req.body;
        
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                category,
                pricePerGram,
                thcContent,
                videoUrl,
                inStock
            },
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }
        
        res.status(200).json({ success: true, product: updatedProduct });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du produit:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du produit' });
    }
});

// Route pour supprimer un produit (protégée, admin seulement)
app.delete('/api/products/:id', isAuthenticated, async (req, res) => {
    // Vérifier si l'utilisateur est admin
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }
        
        res.status(200).json({ success: true, message: 'Produit supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression du produit' });
    }
});

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

////////////////////////////////////////// Profile //////////////////////////////////////
// Route pour obtenir les informations de l'utilisateur courant
app.get('/api/user/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id)
            .populate({
                path: 'orders',
                select: 'totalPrice createdAt status' // Sélection des champs nécessaires pour les stats
            });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        // Calcul du temps écoulé depuis la dernière commande
        let lastOrderTimeAgo = null;
        if (user.lastOrderDate) {
            const now = new Date();
            const diffTime = Math.abs(now - user.lastOrderDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            lastOrderTimeAgo = `${diffDays}j`;
        }

        // Format de date pour l'affichage
        const joinDate = new Date(user.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        // Préparation de la réponse avec les informations formatées
        const userProfile = {
            username: user.username,
            joinDate: joinDate,
            accountType: user.role === 'admin' ? 'Administrateur' : 'Client',
            telegramKey: user.keys,
            telegamId: user.telegramId || "",
            stats: {
                totalOrders: user.orders.length,
                totalSpent: `${user.totalSpent}€`,
                lastOrder: lastOrderTimeAgo || 'N/A',
                referralCode: user.referralCode
            }
        };

        res.status(200).json({ success: true, user: userProfile });
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du profil' });
    }
});

// Route pour mettre à jour le nom d'utilisateur
app.put('/api/user/username', isAuthenticated, async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ success: false, message: 'Nom d\'utilisateur requis' });
        }

        // Vérifier si le nom d'utilisateur est déjà utilisé
        const existingUser = await User.findOne({ username, _id: { $ne: req.session.user.id } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Ce nom d\'utilisateur est déjà utilisé' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.session.user.id,
            { username },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        // Mettre à jour la session
        req.session.user.username = updatedUser.username;
        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.status(200).json({ success: true, message: 'Nom d\'utilisateur mis à jour', username: updatedUser.username });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du nom d\'utilisateur:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du nom d\'utilisateur' });
    }
});

// Route pour mettre à jour l'identifiant Telegram
app.put('/api/user/telegram-id', isAuthenticated, async (req, res) => {
    try {
        const { telegramId } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.session.user.id,
            { telegramId },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({ success: true, message: 'Identifiant Telegram mis à jour', telegramId: updatedUser.telegramId });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'identifiant Telegram:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'identifiant Telegram' });
    }
});

// Route pour régénérer la clé Telegram
app.post('/api/user/regenerate-key', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        await user.regenerateKeys();

        res.status(200).json({ success: true, message: 'Clé Telegram régénérée', newKey: user.keys });
    } catch (error) {
        console.error('Erreur lors de la régénération de la clé:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la régénération de la clé' });
    }
});
//////////////////////////////////////////////////////////////////////// Profil ////////////////////
// Routes publiques - redirection vers la page de login
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    res.redirect(req.session.user.role === 'admin' ? '/admin-dashboard.html' : '/dashboard');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});
app.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
app.get('/profil', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profil.html'));
});

// Création du serveur HTTP
const server = require('http').createServer(app);

// Démarrage du serveur
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});
