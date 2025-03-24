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
    },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['En attente', 'En préparation', 'Expédié', 'Livré', 'Annulé'],
        default: 'En attente'
    },
    createdAt: { type: Date, default: Date.now },
    // Ajout des informations de livraison
    delivery: {
        type: { 
            type: String, 
            enum: ['instant', 'scheduled'], 
            default: 'instant'
        },
        address: { 
            type: String, 
            required: true 
        },
        timeSlot: { 
            type: String, 
            required: function() { 
                return this.delivery.type === 'scheduled'; 
            } 
        },
        deliveryDate: { 
            type: Date,
            default: function() {
                return this.delivery.type === 'instant' ? new Date() : null;
            }
        }
    }
});


// Middleware pour mettre à jour la liste des commandes de l'utilisateur
OrderSchema.post('save', async function(doc) {
    await User.findByIdAndUpdate(
        doc.user,
        { $addToSet: { orders: doc._id } }
    );
});

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
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
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
    // Force 'secure: false' pour tester, même en production
    secure: false, 
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
        const { 
            name, 
            description, 
            category, 
            priceOptions, 
            thcContent, 
            videoUrl, 
            inStock 
        } = req.body;
        
        // Validation des données
        if (!name || !description || !category || !priceOptions || !videoUrl) {
            return res.status(400).json({ success: false, message: 'Tous les champs obligatoires doivent être remplis' });
        }
        
        // Vérification que les options de prix sont valides
        if (!Array.isArray(priceOptions) || priceOptions.length === 0) {
            return res.status(400).json({ success: false, message: 'Au moins une option de prix est requise' });
        }
        
        for (const option of priceOptions) {
            if (!option.quantity || !option.price || option.quantity <= 0 || option.price <= 0) {
                return res.status(400).json({ success: false, message: 'Options de prix invalides' });
            }
        }
        
        // Création du nouveau produit
        const newProduct = new Product({
            name,
            description,
            category,
            priceOptions,
            thcContent: thcContent || 0,
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

// Route pour mettre à jour un produit (protégée, admin seulement)
app.put('/api/products/:id', isAuthenticated, async (req, res) => {
    // Vérifier si l'utilisateur est admin
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    
    try {
        const { 
            name, 
            description, 
            category, 
            priceOptions, 
            thcContent, 
            videoUrl, 
            inStock 
        } = req.body;
        
        // Validation des données
        if (!name || !description || !category || !priceOptions || !videoUrl) {
            return res.status(400).json({ success: false, message: 'Tous les champs obligatoires doivent être remplis' });
        }
        
        // Vérification que les options de prix sont valides
        if (!Array.isArray(priceOptions) || priceOptions.length === 0) {
            return res.status(400).json({ success: false, message: 'Au moins une option de prix est requise' });
        }
        
        for (const option of priceOptions) {
            if (!option.quantity || !option.price || option.quantity <= 0 || option.price <= 0) {
                return res.status(400).json({ success: false, message: 'Options de prix invalides' });
            }
        }
        
        // Trouver et mettre à jour le produit
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                category,
                priceOptions,
                thcContent: thcContent || 0,
                videoUrl,
                inStock: inStock !== undefined ? inStock : true,
                updatedAt: Date.now()
            },
            { new: true } // Retourner le document mis à jour
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
        // Vérifier si le produit existe
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Produit non trouvé' });
        }
        
        // Vérifier si le produit est utilisé dans des commandes
        const orderWithProduct = await Order.findOne({ productName: product.name });
        
        if (orderWithProduct) {
            return res.status(400).json({ 
                success: false, 
                message: 'Ce produit ne peut pas être supprimé car il est associé à des commandes existantes' 
            });
        }
        
        // Supprimer le produit
        await Product.findByIdAndDelete(req.params.id);
        
        res.status(200).json({ success: true, message: 'Produit supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du produit:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression du produit' });
    }
});

// Route pour rechercher des produits
app.get('/api/products/search', async (req, res) => {
    try {
        const { query, category } = req.query;
        
        // Construire les critères de recherche
        const searchCriteria = {};
        
        if (category) {
            searchCriteria.category = category;
        }
        
        if (query) {
            searchCriteria.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }
        
        // Exécuter la recherche
        const products = await Product.find(searchCriteria);
        
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Erreur lors de la recherche des produits:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la recherche des produits' });
    }
});

// Route pour récupérer les produits en stock
app.get('/api/products/filter/in-stock', async (req, res) => {
    try {
        const products = await Product.find({ inStock: true });
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Erreur lors de la récupération des produits en stock:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des produits en stock' });
    }
});

// Route pour récupérer les produits par catégorie
app.get('/api/products/category/:category', async (req, res) => {
    try {
        const products = await Product.find({ category: req.params.category });
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('Erreur lors de la récupération des produits par catégorie:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des produits par catégorie' });
    }
});

// ========================== ROUTES POUR LES COMMANDES ==========================
// Route pour créer une nouvelle commande (modifiée pour prendre en charge la livraison)
app.post('/api/orders', isAuthenticated, async (req, res) => {
    try {
        const { productName, quantity, totalPrice, delivery } = req.body;
        
        // Validation des données
        if (!productName || !quantity || !totalPrice) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }
        
        // Création de la commande
        const newOrder = new Order({
            user: req.session.user.id,
            productName,
            quantity,
            totalPrice,
            status: 'En attente',
            // Ajouter les informations de livraison si fournies
            delivery: delivery ? {
                type: delivery.type || 'instant',
                address: delivery.address,
                timeSlot: delivery.timeSlot
            } : undefined
        });
        
        await newOrder.save();
        
        res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
        console.error('Erreur lors de la création de la commande:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création de la commande' });
    }
});
// Route pour récupérer toutes les commandes de l'utilisateur connecté
app.get('/api/orders/user', isAuthenticated, async (req, res) => {
    try {
        // Trouver toutes les commandes pour l'utilisateur connecté
        const orders = await Order.find({ user: req.session.user.id })
            .sort({ createdAt: -1 }); // Tri par date décroissante
        
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commandes' });
    }
});

// Route pour récupérer une commande spécifique
app.get('/api/orders/:id', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.user.id // S'assurer que la commande appartient à l'utilisateur
        });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }
        
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Erreur lors de la récupération de la commande:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la commande' });
    }
});

// Route pour créer une nouvelle commande
app.post('/api/orders', isAuthenticated, async (req, res) => {
    try {
        const { productName, quantity, totalPrice } = req.body;
        
        // Validation des données
        if (!productName || !quantity || !totalPrice) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }
        
        // Création de la commande
        const newOrder = new Order({
            user: req.session.user.id,
            productName,
            quantity,
            totalPrice,
            status: 'En attente'
        });
        
        await newOrder.save();
        
        res.status(201).json({ success: true, order: newOrder });
    } catch (error) {
        console.error('Erreur lors de la création de la commande:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la création de la commande' });
    }
});

// Route pour mettre à jour le statut d'une commande
app.put('/api/orders/:id/status', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ success: false, message: 'Le statut est requis' });
        }
        
        // Vérifier si l'utilisateur est admin pour cette action
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Action non autorisée' });
        }
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }
        
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du statut' });
    }
});

// Route pour annuler une commande
app.put('/api/orders/:id/cancel', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.user.id
        });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }
        
        // Vérifier si la commande peut être annulée (seulement si elle est en attente ou en préparation)
        if (order.status !== 'En attente' && order.status !== 'En préparation') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cette commande ne peut plus être annulée'
            });
        }
        
        order.status = 'Annulé';
        await order.save();
        
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Erreur lors de l\'annulation de la commande:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'annulation de la commande' });
    }
});

// Route pour récupérer les messages de chat d'une commande
app.get('/api/orders/:id/chat', isAuthenticated, async (req, res) => {
    try {
        // Si vous implémentez un système de chat réel, vous devriez avoir un modèle ChatMessage
        // Pour l'instant, renvoyez des données fictives
        res.status(200).json({ 
            success: true, 
            messages: [
                {
                    sender: 'system',
                    content: 'Début de la conversation avec votre livreur.',
                    timestamp: new Date()
                },
                {
                    sender: 'livreur',
                    content: 'Bonjour ! Je suis votre livreur pour cette commande. Je vous contacterai dès que votre commande sera prête à être livrée.',
                    timestamp: new Date()
                }
            ]
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des messages' });
    }
});

// Route pour envoyer un message dans le chat d'une commande
app.post('/api/orders/:id/chat', isAuthenticated, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Le message est requis' });
        }
        
        // Vérifier si la commande appartient à l'utilisateur
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.user.id
        });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }
        
        // Si vous implémentez un système de chat réel, enregistrez le message ici
        // Pour l'instant, simulez une réponse
        
        res.status(200).json({ 
            success: true, 
            message: {
                sender: 'utilisateur',
                content: message,
                timestamp: new Date()
            },
            response: {
                sender: 'livreur',
                content: 'Merci pour votre message. Je suis actuellement en train de préparer votre commande.',
                timestamp: new Date(Date.now() + 1000) // 1 seconde plus tard
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du message' });
    }
});
// ===================== ROUTES POUR LA COMMANDE AVEC LIVRAISON =====================

// Route pour créer une nouvelle commande avec informations de livraison
app.post('/api/orders/delivery', isAuthenticated, async (req, res) => {
    try {
        const { 
            items,
            totalAmount,
            delivery 
        } = req.body;
        
        // Validation des données
        if (!items || !items.length || !totalAmount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Informations de commande incomplètes' 
            });
        }
        
        if (!delivery || !delivery.address) {
            return res.status(400).json({ 
                success: false, 
                message: 'Informations de livraison requises' 
            });
        }
        
        // Vérification si livraison planifiée nécessite une heure
        if (delivery.type === 'scheduled' && !delivery.timeSlot) {
            return res.status(400).json({ 
                success: false, 
                message: 'Heure de livraison requise pour une livraison planifiée' 
            });
        }
        
        // Création d'une commande pour chaque article
        const createdOrders = [];
        
        for (const item of items) {
            const newOrder = new Order({
                user: req.session.user.id,
                productName: item.productName,
                quantity: item.quantity,
                totalPrice: item.total,
                status: 'En attente',
                delivery: {
                    type: delivery.type,
                    address: delivery.address,
                    timeSlot: delivery.timeSlot
                }
            });
            
            await newOrder.save();
            createdOrders.push(newOrder);
        }
        
        // Réponse avec les commandes créées
        res.status(201).json({ 
            success: true, 
            message: 'Commande créée avec succès',
            orders: createdOrders 
        });
    } catch (error) {
        console.error('Erreur lors de la création de la commande avec livraison:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la création de la commande' 
        });
    }
});

// Route pour une commande avec un seul article (alternative simplifiée)
app.post('/api/orders/simple-delivery', isAuthenticated, async (req, res) => {
    try {
        const { 
            productName,
            quantity,
            totalPrice, 
            deliveryType,
            deliveryAddress,
            deliveryTimeSlot
        } = req.body;
        
        // Validation des données basiques
        if (!productName || !quantity || !totalPrice || !deliveryAddress) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tous les champs sont requis' 
            });
        }
        
        // Vérification du créneau horaire pour livraison planifiée
        if (deliveryType === 'scheduled' && !deliveryTimeSlot) {
            return res.status(400).json({ 
                success: false, 
                message: 'Créneau horaire requis pour livraison planifiée' 
            });
        }
        
        // Création de la commande
        const newOrder = new Order({
            user: req.session.user.id,
            productName,
            quantity,
            totalPrice,
            status: 'En attente',
            delivery: {
                type: deliveryType || 'instant',
                address: deliveryAddress,
                timeSlot: deliveryTimeSlot
            }
        });
        
        await newOrder.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Commande créée avec succès',
            order: newOrder 
        });
    } catch (error) {
        console.error('Erreur lors de la création de la commande simple:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la création de la commande' 
        });
    }
});

// Route pour obtenir les horaires de livraison disponibles
app.get('/api/delivery/timeslots', isAuthenticated, (req, res) => {
    try {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Génération des créneaux de 10h à 22h
        const availableSlots = [];
        
        for (let hour = 10; hour <= 22; hour++) {
            // Pour aujourd'hui, ne pas proposer les heures déjà passées
            if (hour > currentHour) {
                availableSlots.push({
                    hour: hour,
                    label: `${hour}:00`,
                    available: true
                });
            }
        }
        
        res.status(200).json({
            success: true,
            today: now.toISOString().split('T')[0],
            slots: availableSlots
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des créneaux horaires:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des créneaux horaires' 
        });
    }
});

// Route pour récupérer les détails de livraison d'une commande
app.get('/api/orders/:id/delivery', isAuthenticated, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.user.id
        });
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Commande non trouvée' 
            });
        }
        
        // Si la commande n'a pas d'informations de livraison
        if (!order.delivery) {
            return res.status(404).json({ 
                success: false, 
                message: 'Informations de livraison non disponibles' 
            });
        }
        
        res.status(200).json({
            success: true,
            delivery: order.delivery
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de livraison:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des informations de livraison' 
        });
    }
});

// Route pour mettre à jour les informations de livraison
app.put('/api/orders/:id/delivery', isAuthenticated, async (req, res) => {
    try {
        const { address, timeSlot, type } = req.body;
        
        // Vérifier si la commande appartient à l'utilisateur
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.session.user.id
        });
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Commande non trouvée' 
            });
        }
        
        // Vérifier si la commande peut encore être modifiée
        if (order.status !== 'En attente') {
            return res.status(400).json({ 
                success: false, 
                message: 'La commande ne peut plus être modifiée' 
            });
        }
        
        // Construire l'objet de mise à jour
        const updateData = {};
        
        if (address) updateData['delivery.address'] = address;
        if (type) updateData['delivery.type'] = type;
        if (timeSlot) updateData['delivery.timeSlot'] = timeSlot;
        
        // Mettre à jour la commande
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );
        
        res.status(200).json({
            success: true,
            message: 'Informations de livraison mises à jour',
            delivery: updatedOrder.delivery
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des informations de livraison:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour des informations de livraison' 
        });
    }
});

// ===================== ROUTES POUR ADMINISTRATEURS =====================
// ===================== ROUTES POUR ADMINISTRATION DES LIVRAISONS =====================

// Route pour récupérer toutes les commandes avec leurs détails de livraison (pour admin)
app.get('/api/admin/orders', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        // Récupérer toutes les commandes avec peuplement des informations utilisateur
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .populate('user', 'username telegramId');
        
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commandes' });
    }
});

// Route pour obtenir les statistiques des livraisons (pour admin)
app.get('/api/admin/deliveries/stats', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        // Compter les commandes par statut
        const pendingCount = await Order.countDocuments({ status: 'En attente' });
        const processingCount = await Order.countDocuments({ status: 'En préparation' });
        const shippedCount = await Order.countDocuments({ status: 'Expédié' });
        const deliveredCount = await Order.countDocuments({ status: 'Livré' });
        const cancelledCount = await Order.countDocuments({ status: 'Annulé' });
        
        // Compter les livraisons planifiées
        const scheduledCount = await Order.countDocuments({ 'delivery.type': 'scheduled' });
        
        // Livraisons aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayDeliveries = await Order.countDocuments({
            createdAt: { $gte: today, $lt: tomorrow }
        });
        
        res.status(200).json({
            success: true,
            stats: {
                pending: pendingCount,
                processing: processingCount,
                shipped: shippedCount,
                delivered: deliveredCount,
                cancelled: cancelledCount,
                scheduled: scheduledCount,
                today: todayDeliveries
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques' });
    }
});

// Route pour mettre à jour le statut d'une commande (pour admin)
app.put('/api/orders/:id/status', isAuthenticated, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ success: false, message: 'Le statut est requis' });
        }
        
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Action non autorisée' });
        }
        
        // Vérifier si le statut est valide
        const validStatuses = ['En attente', 'En préparation', 'Expédié', 'Livré', 'Annulé'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Statut invalide' });
        }
        
        // Mettre à jour la commande
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }
        
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du statut' });
    }
});

// Route pour obtenir les messages de chat d'une commande (pour admin)
app.get('/api/orders/:id/chat', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        // Vérifier si la commande existe
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }
        
        // Simuler des messages (normalement vous les récupéreriez d'une collection de messages)
        const messages = [
            {
                sender: 'system',
                content: 'Début de la conversation avec le client.',
                timestamp: new Date(Date.now() - 3600000) // 1 heure dans le passé
            },
            {
                sender: 'livreur',
                content: 'Bonjour ! Je suis votre livreur pour cette commande. Je vous contacterai dès que votre commande sera prête à être livrée.',
                timestamp: new Date(Date.now() - 3500000) // 58 minutes dans le passé
            },
            {
                sender: 'client',
                content: 'D\'accord, merci. Est-ce que vous avez une estimation du temps de livraison ?',
                timestamp: new Date(Date.now() - 3400000) // 56 minutes dans le passé
            },
            {
                sender: 'livreur',
                content: 'Pour le moment, votre commande est en préparation. Je pense pouvoir vous livrer dans environ 30 minutes.',
                timestamp: new Date(Date.now() - 3300000) // 55 minutes dans le passé
            }
        ];
        
        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des messages' });
    }
});

// Route pour envoyer un message dans le chat d'une commande (pour admin)
app.post('/api/orders/:id/chat', isAuthenticated, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, message: 'Le message est requis' });
        }
        
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        // Vérifier si la commande existe
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }
        
        // Simuler la sauvegarde du message et une réponse
        // (normalement vous les enregistreriez dans une collection de messages)
        const now = new Date();
        
        const newMessage = {
            sender: 'livreur',
            content: message,
            timestamp: now
        };
        
        // Simuler une réponse du client
        const responses = [
            'D\'accord, merci pour l\'info !',
            'Est-ce que vous pourriez me donner plus de détails ?',
            'Parfait, j\'attends votre arrivée.',
            'Merci pour votre réponse rapide.',
            'Je suis disponible à cette adresse dès maintenant.'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const clientResponse = {
            sender: 'client',
            content: randomResponse,
            timestamp: new Date(now.getTime() + 1000) // 1 seconde plus tard
        };
        
        res.status(200).json({ 
            success: true, 
            messages: [newMessage, clientResponse]
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi du message' });
    }
});

// Route pour obtenir les détails d'une commande spécifique (pour admin)
app.get('/api/admin/orders/:id', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        // Récupérer la commande avec les informations utilisateur
        const order = await Order.findById(req.params.id)
            .populate('user', 'username telegramId');
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }
        
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('Erreur lors de la récupération de la commande:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la commande' });
    }
});

// Route pour rechercher des commandes (pour admin)
app.get('/api/admin/orders/search', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        const { query, status, type } = req.query;
        
        // Construire les critères de recherche
        const searchCriteria = {};
        
        // Filtrer par statut si spécifié
        if (status && status !== 'all') {
            searchCriteria.status = status;
        }
        
        // Filtrer par type de livraison si spécifié
        if (type && type !== 'all') {
            searchCriteria['delivery.type'] = type;
        }
        
        // Recherche textuelle si spécifiée
        let orders = [];
        if (query) {
            // Recherche dans les champs pertinents
            const textSearchCriteria = {
                ...searchCriteria,
                $or: [
                    { productName: { $regex: query, $options: 'i' } },
                    { 'delivery.address': { $regex: query, $options: 'i' } },
                    { _id: { $regex: query, $options: 'i' } }
                ]
            };
            
            // Recherche par utilisateur (nécessite un traitement spécial)
            const users = await User.find({
                $or: [
                    { username: { $regex: query, $options: 'i' } },
                    { telegramId: { $regex: query, $options: 'i' } }
                ]
            });
            
            const userIds = users.map(user => user._id);
            
            // Si des utilisateurs correspondent, ajouter un critère pour les inclure
            if (userIds.length > 0) {
                textSearchCriteria.$or.push({ user: { $in: userIds } });
            }
            
            orders = await Order.find(textSearchCriteria)
                .sort({ createdAt: -1 })
                .populate('user', 'username telegramId');
        } else {
            // Si pas de recherche textuelle, récupérer selon les critères de filtre uniquement
            orders = await Order.find(searchCriteria)
                .sort({ createdAt: -1 })
                .populate('user', 'username telegramId');
        }
        
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Erreur lors de la recherche des commandes:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la recherche des commandes' });
    }
});
// ========================== ROUTES POUR L'ADMINISTRATEUR ==========================

// Route pour récupérer toutes les commandes (admin seulement)
app.get('/api/admin/orders', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .populate('user', 'username telegramId'); // Récupérer les informations de l'utilisateur
        
        res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error('Erreur lors de la récupération des commandes:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des commandes' });
    }
});

// Route pour les statistiques des commandes (admin seulement)
app.get('/api/admin/orders/stats', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        // Statistiques des commandes
        const totalOrders = await Order.countDocuments({});
        const pendingOrders = await Order.countDocuments({ status: 'En attente' });
        const processingOrders = await Order.countDocuments({ status: 'En préparation' });
        const shippedOrders = await Order.countDocuments({ status: 'Expédié' });
        const deliveredOrders = await Order.countDocuments({ status: 'Livré' });
        const cancelledOrders = await Order.countDocuments({ status: 'Annulé' });
        
        // Total des ventes
        const totalSales = await Order.aggregate([
            {
                $match: { status: { $ne: 'Annulé' } }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPrice' }
                }
            }
        ]);
        
        // Ventes par jour (pour les 30 derniers jours)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const salesByDay = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'Annulé' },
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    total: { $sum: '$totalPrice' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        
        res.status(200).json({
            success: true,
            stats: {
                totalOrders,
                pendingOrders,
                processingOrders,
                shippedOrders,
                deliveredOrders,
                cancelledOrders,
                totalSales: totalSales.length > 0 ? totalSales[0].total : 0,
                salesByDay
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques' });
    }
});

// ========================== ROUTE POUR LA PAGE DES COMMANDES ==========================

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
            let redirectUrl = '/dashboard';
            if (user.role === 'admin') {
                redirectUrl = '/admin-panel';
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
        res.redirect('/dashboard');
    }
});

// Route pour vérifier l'état de l'authentification
app.get('/api/auth/status', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.user.id,
                username: req.session.user.username,
                role: req.session.user.role
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});
////////////////////////////////////////// Profile //////////////////////////////////////
// Route pour récupérer les données utilisateur (ajoutez cela à votre fichier serveur)
app.get('/api/user', isAuthenticated, async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    try {
        const user = await User.findById(req.session.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        // Format de date pour l'affichage
        const joinDate = new Date(user.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Calcul du temps écoulé depuis la dernière commande
        let lastOrderTimeAgo = null;
        if (user.lastOrderDate) {
            const now = new Date();
            const diffTime = Math.abs(now - user.lastOrderDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            lastOrderTimeAgo = `${diffDays}j`;
        }
        
        res.json({
            id: user._id,
            username: user.username,
            role: user.role,
            joinDate: joinDate,
            telegramKey: user.keys,
            telegramId: user.telegramId || "",
            stats: {
                totalOrders: user.orders.length,
                totalSpent: user.totalSpent,
                lastOrder: lastOrderTimeAgo || 'N/A',
                referralCode: user.referralCode || "BEDO2025",
                loyaltyPoints: Math.floor(user.totalSpent * 0.5)
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        res.status(500).json({ message: 'Erreur du serveur' });
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


//////////////////// register ///////////////////////
app.get('/register.html', (req, res) => {
    // Si l'utilisateur est déjà connecté, le rediriger vers le dashboard
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Route pour l'inscription d'un nouvel utilisateur
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, telegramId, referralCode } = req.body;
        
        // Validation du nom d'utilisateur
        if (!username || username.length < 3) {
            return res.status(400).json({ success: false, message: 'Le nom d\'utilisateur doit contenir au moins 3 caractères' });
        }
        
        // Vérifier si le nom d'utilisateur existe déjà
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Ce nom d\'utilisateur est déjà utilisé' });
        }
        
        // Vérifier le code de parrainage si fourni
        if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (!referrer) {
                return res.status(400).json({ success: false, message: 'Code de parrainage invalide' });
            }
            // On pourrait ajouter ici une logique pour récompenser le parrain
        }
        
        // Générer une clé Telegram unique
        const generateUniqueKey = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let key = '';
            for (let i = 0; i < 16; i++) {
                key += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return key;
        };
        
        // Générer un code de parrainage unique
        const generateReferralCode = () => {
            return 'BEDO' + Math.floor(1000 + Math.random() * 9000);
        };
        
        // Vérifier si la clé ou le code de parrainage existe déjà et regénérer si nécessaire
        let telegramKey = generateUniqueKey();
        let newReferralCode = generateReferralCode();
        
        let keyExists = await User.findOne({ keys: telegramKey });
        while (keyExists) {
            telegramKey = generateUniqueKey();
            keyExists = await User.findOne({ keys: telegramKey });
        }
        
        let codeExists = await User.findOne({ referralCode: newReferralCode });
        while (codeExists) {
            newReferralCode = generateReferralCode();
            codeExists = await User.findOne({ referralCode: newReferralCode });
        }
        
        // Créer le nouvel utilisateur
        const newUser = new User({
            username,
            keys: telegramKey,
            telegramId: telegramId || '',
            referralCode: newReferralCode,
            role: 'client',  // Par défaut, tous les nouveaux utilisateurs sont des clients
            totalSpent: 0,
            lastOrderDate: null,
            orders: []
        });
        
        await newUser.save();
        
        // Retourner la réponse avec la clé Telegram
        res.status(201).json({ 
            success: true, 
            message: 'Compte créé avec succès',
            key: telegramKey
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
});
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
app.get('/admin-panel', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-panel.html'));
});
app.get('/admin-produit', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-produit.html'));
});
app.get('/commandes', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'commandes.html'));
});
app.get('/profil', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profil.html'));
});
app.get('/register', isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Création du serveur HTTP
const server = require('http').createServer(app);

// Démarrage du serveur
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});
