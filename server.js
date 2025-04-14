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
    },
    // Nouveau: informations de file d'attente
    queueInfo: {
        position: { type: Number, default: null },
        estimatedTime: { type: Number, default: null }, // en minutes
        enteredQueueAt: { type: Date, default: null },
        lastUpdated: { type: Date, default: null }
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



const MessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    orderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order', 
        required: true 
    },
    sender: { 
        type: String, 
        enum: ['client', 'livreur', 'system'],
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    },
    isRead: {
        type: Boolean,
        default: false
    },
    // Référence optionnelle aux utilisateurs
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deliveryPersonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Index pour des requêtes plus rapides
MessageSchema.index({ orderId: 1, timestamp: 1 });

// Méthode pour marquer un message comme lu
MessageSchema.methods.markAsRead = function() {
    this.isRead = true;
    return this.save();
};

// Création du modèle Message
const Message = mongoose.model('Message', MessageSchema);

// Schéma pour les conversations
const ConversationSchema = new mongoose.Schema({
    orderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Order', 
        required: true,
        unique: true // Une conversation unique par commande
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    participants: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        deliveryPerson: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    // Compteurs de messages non lus pour chaque partie
    unreadCount: {
        user: { type: Number, default: 0 },
        deliveryPerson: { type: Number, default: 0 }
    }
});

// Middleware pour mettre à jour updatedAt à chaque modification
ConversationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Création du modèle Conversation
const Conversation = mongoose.model('Conversation', ConversationSchema);


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

async function updateDeliveryQueue() {
    try {
        // Récupérer toutes les commandes non livrées et non annulées
        const pendingOrders = await Order.find({
            status: { $in: ['En attente', 'En préparation', 'Expédié'] }
        }).sort({ createdAt: 1 }); // Tri par ordre de création (FIFO)
        
        console.log(`Mise à jour de la file d'attente: ${pendingOrders.length} commandes trouvées`);
        
        // Pour chaque commande, mettre à jour la position et le temps estimé
        for (let i = 0; i < pendingOrders.length; i++) {
            const order = pendingOrders[i];
            
            // S'assurer que queueInfo existe et a les valeurs par défaut
            if (!order.queueInfo) {
                order.queueInfo = {};
            }
            
            // Si la commande n'est pas encore dans la file d'attente, l'ajouter
            if (!order.queueInfo.enteredQueueAt) {
                order.queueInfo.enteredQueueAt = new Date();
            }
            
            // Mise à jour de la position (indexée à partir de 1)
            order.queueInfo.position = i + 1;
            
            // Calcul du temps estimé (chaque commande prend environ 15 minutes)
            // Ajuster ces valeurs selon les données réelles
            const baseDeliveryTime = 10; // minutes par commande
            let estimatedTime;
            
            if (order.status === 'En attente') {
                estimatedTime = i * baseDeliveryTime;
            } else if (order.status === 'En préparation') {
                estimatedTime = Math.max(0, i * baseDeliveryTime / 2); // Préparation déjà commencée
            } else if (order.status === 'Expédié') {
                estimatedTime = 5; // Presque arrivé
            }
            
            order.queueInfo.estimatedTime = estimatedTime;
            order.queueInfo.lastUpdated = new Date();
            
            // Utiliser findByIdAndUpdate pour éviter de déclencher le middleware save
            // qui pourrait créer une boucle infinie
            await Order.findByIdAndUpdate(order._id, {
                'queueInfo.position': order.queueInfo.position,
                'queueInfo.estimatedTime': order.queueInfo.estimatedTime,
                'queueInfo.enteredQueueAt': order.queueInfo.enteredQueueAt,
                'queueInfo.lastUpdated': order.queueInfo.lastUpdated
            });
        }
        
        console.log(`File d'attente mise à jour: ${pendingOrders.length} commandes`);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la file d\'attente:', error);
    }
}
// 3. Middleware pour mettre à jour la file d'attente après chaque changement de statut
OrderSchema.post('save', async function(doc) {
    console.log(`Commande sauvegardée: ${doc._id}, statut: ${doc.status}`);
    
    // Mettre à jour la file d'attente même pour les nouvelles commandes
    try {
        // Utilisez setTimeout pour éviter les problèmes de contexte mongoose
        setTimeout(() => {
            updateDeliveryQueue().catch(err => 
                console.error('Erreur dans updateDeliveryQueue après save:', err)
            );
        }, 0);
    } catch (error) {
        console.error('Erreur dans le middleware post-save de Order:', error);
    }
});

// Également déclencher une mise à jour périodique (toutes les 5 minutes)
setInterval(updateDeliveryQueue, 5 * 60 * 1000);

// 4. Créer des routes API pour la file d'attente

// Route pour obtenir les informations de file d'attente d'une commande spécifique
// Route pour obtenir les informations de file d'attente d'une commande spécifique
app.get('/api/orders/:id/queue', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'ID est au format BD*, chercher la commande d'abord
        let orderId = req.params.id;
        
        let order;
        if (orderId.startsWith('BD')) {
            // Trouver la commande par son numéro d'affichage
            order = await Order.findOne({
                $or: [
                    { orderNumber: orderId },
                    // Chercher aussi dans le champ _id au cas où
                    { _id: orderId }
                ],
                user: req.session.user.id
            });
        } else {
            // L'ID est peut-être déjà un ObjectId
            order = await Order.findOne({
                _id: orderId,
                user: req.session.user.id
            });
        }
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Commande non trouvée' 
            });
        }
        
        // Si la commande est livrée ou annulée, elle n'est plus dans la file d'attente
        if (order.status === 'Livré' || order.status === 'Annulé') {
            return res.status(200).json({
                success: true,
                inQueue: false,
                message: order.status === 'Livré' ? 'Commande livrée' : 'Commande annulée'
            });
        }
        
        // S'assurer que queueInfo existe et a des valeurs par défaut
        if (!order.queueInfo || !order.queueInfo.position) {
            // Si les informations de file d'attente ne sont pas encore disponibles,
            // déclencher une mise à jour de la file d'attente
            await updateDeliveryQueue();
            
            // Récupérer la commande mise à jour
            const updatedOrder = await Order.findById(order._id);
            if (updatedOrder && updatedOrder.queueInfo) {
                order.queueInfo = updatedOrder.queueInfo;
            } else {
                // Si toujours pas d'informations, utiliser des valeurs par défaut
                order.queueInfo = {
                    position: 1, // Si c'est la seule commande, elle est en première position
                    estimatedTime: 0, // Livraison immédiate si première commande
                    enteredQueueAt: new Date(),
                    lastUpdated: new Date()
                };
            }
        }
        
        // Récupérer les informations de file d'attente
        res.status(200).json({
            success: true,
            inQueue: true,
            queueInfo: order.queueInfo,
            status: order.status
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de file d\'attente:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des informations de file d\'attente' 
        });
    }
});
// Route pour obtenir un résumé de la file d'attente (pour l'administrateur)
app.get('/api/admin/delivery-queue', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        // Récupérer toutes les commandes dans la file d'attente
        const queuedOrders = await Order.find({
            status: { $in: ['En attente', 'En préparation', 'Expédié'] }
        })
        .sort({ 'queueInfo.position': 1 })
        .populate('user', 'username telegramId');
        
        // Construire la réponse
        const queueSummary = queuedOrders.map(order => ({
            orderId: order._id,
            status: order.status,
            username: order.user.username,
            telegramId: order.user.telegramId,
            productName: order.productName,
            deliveryType: order.delivery.type,
            address: order.delivery.address,
            position: order.queueInfo.position,
            estimatedTime: order.queueInfo.estimatedTime,
            createdAt: order.createdAt
        }));
        
        res.status(200).json({
            success: true,
            queueLength: queuedOrders.length,
            queue: queueSummary
        });
        
    } catch (error) {
        console.error('Erreur lors de la récupération de la file d\'attente:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération de la file d\'attente' 
        });
    }
});

// Route pour mettre à jour manuellement la file d'attente (pour l'administrateur)
app.post('/api/admin/update-queue', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        // Déclencher la mise à jour de la file d'attente
        await updateDeliveryQueue();
        
        res.status(200).json({
            success: true,
            message: 'File d\'attente mise à jour avec succès'
        });
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la file d\'attente:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour de la file d\'attente' 
        });
    }
});

// Route pour réorganiser manuellement la file d'attente (pour l'administrateur)
app.post('/api/admin/reorder-queue', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.session.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }
        
        const { orderId, newPosition } = req.body;
        
        if (!orderId || !newPosition) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de commande et nouvelle position requis' 
            });
        }
        
        // Récupérer l'ordre à déplacer
        const orderToMove = await Order.findById(orderId);
        
        if (!orderToMove) {
            return res.status(404).json({ 
                success: false, 
                message: 'Commande non trouvée' 
            });
        }
        
        // Récupérer toutes les commandes dans la file d'attente
        const queuedOrders = await Order.find({
            status: { $in: ['En attente', 'En préparation', 'Expédié'] }
        }).sort({ 'queueInfo.position': 1 });
        
        // Vérifier que la nouvelle position est valide
        if (newPosition < 1 || newPosition > queuedOrders.length) {
            return res.status(400).json({ 
                success: false, 
                message: 'Position invalide' 
            });
        }
        
        // Mettre à jour les positions
        const currentPosition = orderToMove.queueInfo.position;
        
        // Si déplacement vers le bas
        if (newPosition > currentPosition) {
            for (const order of queuedOrders) {
                if (order.queueInfo.position > currentPosition && order.queueInfo.position <= newPosition) {
                    order.queueInfo.position--;
                    await order.save();
                }
            }
        } 
        // Si déplacement vers le haut
        else if (newPosition < currentPosition) {
            for (const order of queuedOrders) {
                if (order.queueInfo.position >= newPosition && order.queueInfo.position < currentPosition) {
                    order.queueInfo.position++;
                    await order.save();
                }
            }
        }
        
        // Mettre à jour la position de la commande déplacée
        orderToMove.queueInfo.position = newPosition;
        await orderToMove.save();
        
        // Mettre à jour les temps estimés
        await updateDeliveryQueue();
        
        res.status(200).json({
            success: true,
            message: 'File d\'attente réorganisée avec succès'
        });
        
    } catch (error) {
        console.error('Erreur lors de la réorganisation de la file d\'attente:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la réorganisation de la file d\'attente' 
        });
    }
});
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
app.post('/api/orders/:id/chat', isAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Le message ne peut pas être vide' 
            });
        }
        
        // Vérifier si l'ID est au format BD*, chercher la commande d'abord
        let orderId = req.params.id;
        let order;
        
        if (orderId.startsWith('BD')) {
            // Trouver la commande par son numéro d'affichage
            order = await Order.findOne({ 
                $or: [
                    { orderNumber: orderId },
                    // Chercher aussi dans le champ _id au cas où
                    { _id: orderId }
                ]
            });
            
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Commande non trouvée ou accès non autorisé' 
                });
            }
            
            orderId = order._id;
        } else {
            // L'ID est peut-être déjà un ObjectId, vérifier la commande
            const query = { _id: orderId };
            
            // Si l'utilisateur n'est pas admin, on ajoute une restriction
            if (req.session.user.role !== 'admin') {
                query.user = req.session.user.id;
            }
            
            order = await Order.findOne(query);
            
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Commande non trouvée ou accès non autorisé' 
                });
            }
        }
        
        // Vérifier si la commande appartient à l'utilisateur (sauf pour admin)
        if (req.session.user.role !== 'admin' && order.user.toString() !== req.session.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Vous n\'êtes pas autorisé à accéder à cette commande' 
            });
        }
        
        // Trouver ou créer la conversation
        let conversation = await Conversation.findOne({ orderId: orderId });
        
        if (!conversation) {
            conversation = new Conversation({
                orderId: orderId,
                participants: {
                    user: order.user,
                    // deliveryPerson sera défini lorsqu'un livreur sera assigné
                },
                lastMessageAt: new Date()
            });
            
            await conversation.save();
        }
        
        // Déterminer le type d'expéditeur
        const sender = req.session.user.role === 'admin' ? 'livreur' : 'client';
        
        // Créer le nouveau message
        const newMessage = new Message({
            conversationId: conversation._id,
            orderId: orderId,
            sender: sender,
            content: content.trim(),
            timestamp: new Date(),
            userId: req.session.user.id,
            isRead: false
        });
        
        await newMessage.save();
        
        // Mettre à jour le compteur de messages non lus dans la conversation
        if (sender === 'client') {
            conversation.unreadCount.deliveryPerson = (conversation.unreadCount.deliveryPerson || 0) + 1;
        } else {
            conversation.unreadCount.user = (conversation.unreadCount.user || 0) + 1;
        }
        
        // Mettre à jour l'horodatage du dernier message
        conversation.lastMessageAt = newMessage.timestamp;
        await conversation.save();
        
        // Retourner le message créé
        res.status(201).json({ 
            success: true, 
            message: newMessage
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de l\'envoi du message' 
        });
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
// ===================== CHAT=====================
// ===================== CHAT =====================
// Route pour récupérer l'historique du chat d'une commande
// Route pour récupérer l'historique du chat d'une commande
app.get('/api/orders/:id/chat', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'ID est au format BD*, chercher la commande d'abord
        let orderId = req.params.id;
        let order;
        
        if (orderId.startsWith('BD')) {
            // Trouver la commande par son numéro d'affichage
            order = await Order.findOne({ 
                $or: [
                    { orderNumber: orderId },
                    // Chercher aussi dans le champ _id au cas où
                    { _id: orderId }
                ]
            });
            
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Commande non trouvée ou accès non autorisé' 
                });
            }
            
            orderId = order._id;
        } else {
            // L'ID est peut-être déjà un ObjectId, vérifier la commande
            const query = { _id: orderId };
            
            // Si l'utilisateur n'est pas admin, on ajoute une restriction
            if (req.session.user.role !== 'admin') {
                query.user = req.session.user.id;
            }
            
            order = await Order.findOne(query);
            
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Commande non trouvée ou accès non autorisé' 
                });
            }
        }
        
        // Vérifier si la commande appartient à l'utilisateur (sauf pour admin)
        if (req.session.user.role !== 'admin' && order.user.toString() !== req.session.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Vous n\'êtes pas autorisé à accéder à cette commande' 
            });
        }
        
        // Récupérer tous les messages pour cette commande
        const messages = await Message.find({ 
            orderId: orderId 
        }).sort({ timestamp: 1 });
        
        // Si aucun message n'existe encore, créer un message système d'accueil
        if (messages.length === 0) {
            const welcomeMessage = new Message({
                orderId: orderId,
                sender: 'system',
                content: 'Début de la conversation avec votre livreur.',
                timestamp: new Date()
            });
            
            await welcomeMessage.save();
            
            // Ajouter un message de bienvenue du livreur
            const deliveryMessage = new Message({
                orderId: orderId,
                sender: 'livreur',
                content: `Bonjour ! Je suis votre livreur pour la commande #${order.orderNumber || orderId.toString().substr(-6)}. Je vous contacterai dès que votre commande sera prête à être livrée.`,
                timestamp: new Date(Date.now() + 1000)
            });
            
            await deliveryMessage.save();
            
            // Récupérer les messages à nouveau pour les renvoyer
            const initialMessages = await Message.find({ 
                orderId: orderId 
            }).sort({ timestamp: 1 });
            
            return res.status(200).json({ 
                success: true, 
                messages: initialMessages
            });
        }
        
        // Marquer les messages non lus comme lus (seulement ceux destinés à l'utilisateur courant)
        if (req.session.user.role === 'client') {
            await Message.updateMany(
                { orderId: orderId, sender: 'livreur', isRead: false },
                { $set: { isRead: true } }
            );
        } else if (req.session.user.role === 'admin') {
            await Message.updateMany(
                { orderId: orderId, sender: 'client', isRead: false },
                { $set: { isRead: true } }
            );
        }
        
        res.status(200).json({ 
            success: true, 
            messages: messages
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des messages' 
        });
    }
});
// Route pour envoyer un message dans le chat
// Route pour envoyer un message dans le chat
app.post('/api/orders/:id/chat', isAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Le message ne peut pas être vide' 
            });
        }
        
        // Vérifier si l'ID est au format BD*, chercher la commande d'abord
        let orderId = req.params.id;
        let order;
        
        if (orderId.startsWith('BD')) {
            // Trouver la commande par son numéro d'affichage
            order = await Order.findOne({ 
                $or: [
                    { orderNumber: orderId },
                    // Chercher aussi dans le champ _id au cas où
                    { _id: orderId }
                ]
            });
            
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Commande non trouvée ou accès non autorisé' 
                });
            }
            
            orderId = order._id;
        } else {
            // L'ID est peut-être déjà un ObjectId, vérifier la commande
            const query = { _id: orderId };
            
            // Si l'utilisateur n'est pas admin, on ajoute une restriction
            if (req.session.user.role !== 'admin') {
                query.user = req.session.user.id;
            }
            
            order = await Order.findOne(query);
            
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Commande non trouvée ou accès non autorisé' 
                });
            }
        }
        
        // Vérifier si la commande appartient à l'utilisateur (sauf pour admin)
        if (req.session.user.role !== 'admin' && order.user.toString() !== req.session.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Vous n\'êtes pas autorisé à accéder à cette commande' 
            });
        }
        
        // Déterminer le type d'expéditeur
        const sender = req.session.user.role === 'admin' ? 'livreur' : 'client';
        
        // Créer le nouveau message
        const newMessage = new Message({
            orderId: orderId,
            sender: sender,
            content: content.trim(),
            timestamp: new Date(),
            userId: req.session.user.id
        });
        
        await newMessage.save();
        
        // Retourner le message créé
        res.status(201).json({ 
            success: true, 
            message: newMessage
        });
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de l\'envoi du message' 
        });
    }
});

// Route pour récupérer le nombre de messages non lus pour une commande
app.get('/api/orders/:id/unread-messages', isAuthenticated, async (req, res) => {
    try {
        // Si l'ID est au format BD*, chercher la commande d'abord
        let orderId = req.params.id;
        
        if (orderId.startsWith('BD')) {
            // Trouver la commande par son numéro d'affichage
            const order = await Order.findOne({ orderNumber: orderId });
            if (order) {
                orderId = order._id;
            } else {
                // Si la commande n'est pas trouvée, renvoyer 0 messages non lus
                return res.status(200).json({ 
                    success: true, 
                    unreadCount: 0
                });
            }
        }
        
        // Trouver la conversation pour cette commande
        const conversation = await Conversation.findOne({ orderId: orderId });
        
        if (!conversation) {
            return res.status(200).json({ 
                success: true, 
                unreadCount: 0
            });
        }
        
        // Déterminer le compteur à renvoyer selon le rôle de l'utilisateur
        const unreadCount = req.session.user.role === 'admin' 
            ? conversation.unreadCount.deliveryPerson || 0
            : conversation.unreadCount.user || 0;
        
        res.status(200).json({ 
            success: true, 
            unreadCount: unreadCount
        });
    } catch (error) {
        console.error('Erreur lors du comptage des messages non lus:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du comptage des messages non lus' 
        });
    }
});

// Route pour récupérer tous les chats non lus (pour l'admin/dashboard)
app.get('/api/chats/unread', isAuthenticated, async (req, res) => {
    // Vérifier si l'utilisateur est admin
    if (req.session.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'Accès non autorisé' 
        });
    }
    
    try {
        // Trouver toutes les commandes avec des messages non lus du client
        const ordersWithUnreadMessages = await Message.aggregate([
            { 
                $match: { 
                    sender: 'client', 
                    isRead: false 
                } 
            },
            { 
                $group: { 
                    _id: '$orderId', 
                    unreadCount: { $sum: 1 },
                    lastMessage: { $last: '$content' },
                    lastTimestamp: { $max: '$timestamp' }
                } 
            },
            { $sort: { lastTimestamp: -1 } }
        ]);
        
        // Récupérer les détails des commandes
        const result = [];
        for (const item of ordersWithUnreadMessages) {
            const order = await Order.findById(item._id).populate('user', 'username');
            if (order) {
                result.push({
                    orderId: item._id,
                    orderNumber: order.orderNumber || item._id.toString().substr(-6),
                    username: order.user.username,
                    status: order.status,
                    unreadCount: item.unreadCount,
                    lastMessage: item.lastMessage,
                    lastTimestamp: item.lastTimestamp
                });
            }
        }
        
        res.status(200).json({ 
            success: true, 
            chats: result
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des chats non lus:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des chats non lus' 
        });
    }
});
// ===================== CHAT =====================
// ===================== CHAT =====================



// ===================== ROUTES POUR LA COMMANDE AVEC LIVRAISON =====================
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
                },
                // Initialisation de la file d'attente directement ici
                queueInfo: {
                    enteredQueueAt: new Date(),
                    lastUpdated: new Date()
                }
            });
            
            await newOrder.save();
            createdOrders.push(newOrder);
            
            // NOUVEAU: Création automatique d'une conversation pour cette commande
            await createInitialChat(newOrder._id, req.session.user.id);
        }
        
        // Mettre à jour la file d'attente immédiatement après création
        await updateDeliveryQueue();
        
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
        
        // NOUVEAU: Création automatique d'une conversation pour cette commande
        await createInitialChat(newOrder._id, req.session.user.id);
        
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

// NOUVEAU: Fonction utilitaire pour créer la conversation initiale
async function createInitialChat(orderId, userId) {
    try {
        // Récupérer les détails de la commande pour les messages personnalisés
        const order = await Order.findById(orderId).populate('user', 'username');
        
        if (!order) {
            console.error('Commande non trouvée pour la création du chat:', orderId);
            return;
        }
        
        // Vérifier si une conversation existe déjà pour cette commande
        let conversation = await Conversation.findOne({ orderId: orderId });
        
        // Si aucune conversation n'existe, en créer une
        if (!conversation) {
            conversation = new Conversation({
                orderId: orderId,
                participants: {
                    user: order.user._id,
                    // deliveryPerson sera défini lorsqu'un livreur sera assigné
                },
                lastMessageAt: new Date()
            });
            
            await conversation.save();
            console.log(`Conversation créée pour la commande: ${orderId}`);
        }
        
        // Message de bienvenue du système
        const welcomeMessage = new Message({
            conversationId: conversation._id,
            orderId: orderId,
            sender: 'system',
            content: 'Bienvenue dans votre conversation avec votre livreur.',
            timestamp: new Date(),
            isRead: true,
            userId: userId
        });
        
        // Message initial du livreur
        const orderNumber = order.orderNumber || orderId.toString().substr(-6);
        const deliveryMessage = new Message({
            conversationId: conversation._id,
            orderId: orderId,
            sender: 'livreur',
            content: `Bonjour ${order.user.username} ! Je suis votre livreur pour la commande #${orderNumber}. Je vous contacterai dès que votre commande sera prête à être livrée.`,
            timestamp: new Date(Date.now() + 1000), // 1 seconde plus tard
            isRead: false,
            userId: userId
        });
        
        // Enregistrer les messages
        await welcomeMessage.save();
        await deliveryMessage.save();
        
        // Mettre à jour les compteurs de messages non lus
        conversation.unreadCount.user = 1; // Le message du livreur est non lu
        conversation.lastMessageAt = deliveryMessage.timestamp;
        await conversation.save();
        
        console.log(`Chat initial créé pour la commande: ${orderId}`);
        
    } catch (error) {
        console.error('Erreur lors de la création du chat initial:', error);
    }
}

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
// Route pour récupérer l'historique du chat d'une commande
app.get('/api/orders/:id/chat', isAuthenticated, async (req, res) => {
    try {
        // Vérifier si l'ID est au format BD*, chercher la commande d'abord
        let orderId = req.params.id;
        let order;
        
        if (orderId.startsWith('BD')) {
            // Trouver la commande par son numéro d'affichage
            order = await Order.findOne({ 
                $or: [
                    { orderNumber: orderId },
                    // Chercher aussi dans le champ _id au cas où
                    { _id: orderId }
                ]
            });
            
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Commande non trouvée ou accès non autorisé' 
                });
            }
            
            orderId = order._id;
        } else {
            // L'ID est peut-être déjà un ObjectId, vérifier la commande
            const query = { _id: orderId };
            
            // Si l'utilisateur n'est pas admin, on ajoute une restriction
            if (req.session.user.role !== 'admin') {
                query.user = req.session.user.id;
            }
            
            order = await Order.findOne(query);
            
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Commande non trouvée ou accès non autorisé' 
                });
            }
        }
        
        // Vérifier si la commande appartient à l'utilisateur (sauf pour admin)
        if (req.session.user.role !== 'admin' && order.user.toString() !== req.session.user.id) {
            return res.status(403).json({ 
                success: false, 
                message: 'Vous n\'êtes pas autorisé à accéder à cette commande' 
            });
        }
        
        // Trouver la conversation correspondant à cette commande
        let conversation = await Conversation.findOne({ orderId: orderId });
        
        // Si aucune conversation n'existe, la créer avec des messages d'accueil
        if (!conversation) {
            await createInitialChat(orderId, req.session.user.id);
            
            // Récupérer la conversation nouvellement créée
            conversation = await Conversation.findOne({ orderId: orderId });
            
            if (!conversation) {
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la création de la conversation'
                });
            }
        }
        
        // Récupérer tous les messages pour cette conversation
        const messages = await Message.find({ 
            conversationId: conversation._id 
        }).sort({ timestamp: 1 });
        
        // Marquer les messages comme lus selon le rôle de l'utilisateur
        if (req.session.user.role === 'client') {
            // Marquer les messages du livreur comme lus pour le client
            await Message.updateMany(
                { conversationId: conversation._id, sender: 'livreur', isRead: false },
                { $set: { isRead: true } }
            );
            
            // Mettre à jour le compteur de messages non lus dans la conversation
            conversation.unreadCount.user = 0;
            await conversation.save();
        } else if (req.session.user.role === 'admin') {
            // Marquer les messages du client comme lus pour l'admin/livreur
            await Message.updateMany(
                { conversationId: conversation._id, sender: 'client', isRead: false },
                { $set: { isRead: true } }
            );
            
            // Mettre à jour le compteur de messages non lus dans la conversation
            conversation.unreadCount.deliveryPerson = 0;
            await conversation.save();
        }
        
        res.status(200).json({ 
            success: true, 
            conversation: {
                id: conversation._id,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
                lastMessageAt: conversation.lastMessageAt
            },
            messages: messages
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des messages:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des messages' 
        });
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
