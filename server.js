import express from 'express';
import path from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.url.match(/\.html$/)) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    next();
});

// Fonction pour obtenir l'IP publique
async function getPublicIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'Non disponible';
    }
}

// Fonction de diagnostic et connexion MongoDB
async function connectDatabase() {
    console.log('\n🔍 === DIAGNOSTIC DE CONNEXION ===');
    
    // 1. Afficher l'IP publique
    const publicIP = await getPublicIP();
    console.log('🌍 IP Publique du serveur Render:', publicIP);
    console.log('💡 Ajoutez cette IP dans MongoDB Atlas Network Access\n');
    
    // 2. Vérifier les variables d'environnement
    console.log('📋 Variables d\'environnement:');
    console.log('   - PORT:', process.env.PORT || '3000');
    console.log('   - NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('   - MONGO_URL:', process.env.MONGO_URL ? '✅ Défini' : '❌ NON DÉFINI');
    console.log('   - TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Défini' : '⚠️  Non défini');
    console.log('   - ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Défini' : '⚠️  Non défini');
    
    console.log('\n=====================================');
    
    // 3. Connexion à MongoDB
    if (!process.env.MONGO_URL) {
        console.error('\n❌ ERREUR: MONGO_URL n\'est pas défini dans les variables d\'environnement');
        console.error('💡 Ajoutez MONGO_URL dans votre fichier .env ou dans Render Dashboard');
        return;
    }
    
    console.log('\n📡 Tentative de connexion à MongoDB...');
    
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // Timeout de 10 secondes
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ MongoDB connecté avec succès !');
        console.log('📊 État:', mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté');
        
    } catch (err) {
        console.error('\n❌ ERREUR DE CONNEXION MONGODB:');
        console.error('Message:', err.message);
        
        // Diagnostics selon le type d'erreur
        if (err.message.includes('authentication failed')) {
            console.error('\n💡 SOLUTION: Vérifiez vos identifiants MongoDB');
            console.error('   - Username et password corrects dans MONGO_URL');
        } else if (err.message.includes('ENOTFOUND') || err.message.includes('connect')) {
            console.error('\n💡 SOLUTION: Problème de réseau ou URL incorrecte');
            console.error('   - Vérifiez que MONGO_URL est correct');
            console.error('   - Format: mongodb+srv://username:password@cluster.mongodb.net/database');
        } else if (err.message.includes('IP') || err.message.includes('not allowed')) {
            console.error('\n💡 SOLUTION: IP non autorisée dans MongoDB Atlas');
            console.error('   1. Connectez-vous à MongoDB Atlas');
            console.error('   2. Network Access → Add IP Address');
            console.error('   3. Ajoutez:', publicIP);
            console.error('   4. OU autorisez toutes les IPs: 0.0.0.0/0');
        }
        
        console.error('\n⚠️  Le serveur démarre sans connexion à la base de données');
    }
}

// Exécuter la connexion
connectDatabase();

// Schémas MongoDB
const quoteSchema = new mongoose.Schema({
    clientInfo: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: String,
        company: String
    },
    projectDetails: {
        pageType: { 
            type: String, 
            required: true,
            enum: ['simple', 'standard', 'complete', 'multipage']
        },
        designLevel: { 
            type: String, 
            required: true,
            enum: ['template', 'custom', 'premium', 'luxury']
        },
        options: [{
            name: String,
            price: Number
        }],
        deadline: String,
        details: String
    },
    pricing: {
        basePrice: { type: Number, required: true },
        designPrice: { type: Number, default: 0 },
        optionsPrice: { type: Number, default: 0 },
        urgentFee: { type: Number, default: 0 },
        totalPrice: { type: Number, required: true },
        priceRange: {
            min: Number,
            max: Number
        }
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
});

const Quote = mongoose.model('Quote', quoteSchema);

const pricingConfigSchema = new mongoose.Schema({
    pageTypes: {
        simple: { type: Number, default: 497 },
        standard: { type: Number, default: 897 },
        complete: { type: Number, default: 1497 },
        multipage: { type: Number, default: 2497 }
    },
    designLevels: {
        template: { type: Number, default: 0 },
        custom: { type: Number, default: 397 },
        premium: { type: Number, default: 797 },
        luxury: { type: Number, default: 1497 }
    },
    options: {
        animations: { type: Number, default: 197 },
        seo: { type: Number, default: 297 },
        analytics: { type: Number, default: 147 },
        crm: { type: Number, default: 347 },
        copywriting: { type: Number, default: 397 },
        multilingual: { type: Number, default: 297 },
        maintenance: { type: Number, default: 147 }
    },
    urgentMultiplier: { type: Number, default: 0.3 },
    updatedAt: { type: Date, default: Date.now }
});

const PricingConfig = mongoose.model('PricingConfig', pricingConfigSchema);

const landingConfigSchema = new mongoose.Schema({
    userId: String,
    name: { type: String, required: true },
    structure: {
        sectionsCount: Number,
        layout: String,
        sections: [String]
    },
    design: {
        style: String,
        palette: String,
        primaryColor: String,
        secondaryColor: String,
        accentColor: String,
        background: String
    },
    typography: {
        fontFamily: String,
        h1Size: Number,
        headingWeight: Number,
        lineHeight: Number,
        letterSpacing: Number
    },
    animations: {
        types: [String],
        speed: Number,
        hoverEffects: [String],
        parallax: Boolean
    },
    content: {
        sector: String,
        companyName: String,
        tagline: String,
        tone: String,
        description: String
    },
    cta: {
        objective: String,
        text: String,
        style: String,
        size: String,
        trustElements: [String]
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const LandingConfig = mongoose.model('LandingConfig', landingConfigSchema);

// Anthropic/IA generation removed

// Middleware
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname), {
    maxAge: '1d',
    etag: true
}));

// Configuration Telegram
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Fonction pour envoyer un message sur Telegram
async function sendTelegramNotification(quoteData) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('⚠️ Configuration Telegram manquante');
        return false;
    }

    const { clientInfo, projectDetails, pricing } = quoteData;
    
    const pageTypeLabels = {
        simple: 'Page Simple',
        standard: 'Page Standard',
        complete: 'Page Complète',
        multipage: 'Site Multi-pages'
    };
    
    const designLevelLabels = {
        template: 'Template Adapté',
        custom: 'Design Sur-Mesure',
        premium: 'Design Premium',
        luxury: 'Design Luxe'
    };
    
    const optionsLabels = {
        animations: 'Animations Avancées',
        seo: 'Optimisation SEO',
        analytics: 'Analytics & Tracking',
        crm: 'Intégration CRM',
        copywriting: 'Copywriting Pro',
        multilingual: 'Version Multilingue',
        maintenance: 'Maintenance Mensuelle'
    };

    const deadlineLabels = {
        urgent: '🔥 Urgent (72h)',
        week: 'Sous 1 semaine',
        twoweeks: 'Sous 2 semaines',
        month: 'Sous 1 mois',
        flexible: 'Flexible'
    };

    let message = `🎯 <b>NOUVEAU DEVIS REÇU</b>\n\n`;
    message += `👤 <b>CLIENT</b>\n`;
    message += `• Nom: ${clientInfo.name}\n`;
    message += `• Email: ${clientInfo.email}\n`;
    if (clientInfo.phone) message += `• Tél: ${clientInfo.phone}\n`;
    if (clientInfo.company) message += `• Entreprise: ${clientInfo.company}\n`;
    
    message += `\n📋 <b>PROJET</b>\n`;
    message += `• Type: ${pageTypeLabels[projectDetails.pageType]}\n`;
    message += `• Design: ${designLevelLabels[projectDetails.designLevel]}\n`;
    
    if (projectDetails.options && projectDetails.options.length > 0) {
        message += `• Options:\n`;
        projectDetails.options.forEach(opt => {
            message += `  - ${optionsLabels[opt.name]} (+${opt.price}€)\n`;
        });
    }
    
    if (projectDetails.deadline) {
        message += `• Délai: ${deadlineLabels[projectDetails.deadline] || projectDetails.deadline}\n`;
    }
    
    if (projectDetails.details) {
        message += `• Détails: ${projectDetails.details.substring(0, 200)}${projectDetails.details.length > 200 ? '...' : ''}\n`;
    }
    
    message += `\n💰 <b>ESTIMATION</b>\n`;
    message += `• Base: ${pricing.basePrice}€\n`;
    if (pricing.designPrice > 0) message += `• Design: +${pricing.designPrice}€\n`;
    if (pricing.optionsPrice > 0) message += `• Options: +${pricing.optionsPrice}€\n`;
    if (pricing.urgentFee > 0) message += `• Express: +${pricing.urgentFee}€\n`;
    message += `\n<b>TOTAL: ${pricing.totalPrice}€</b>`;
    
    if (pricing.priceRange) {
        message += `\nFourchette: ${pricing.priceRange.min}-${pricing.priceRange.max}€`;
    }
    
    message += `\n\n🔗 ID: ${quoteData._id}`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Notification Telegram envoyée');
            return true;
        } else {
            console.error('❌ Erreur Telegram:', result.description);
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur envoi Telegram:', error);
        return false;
    }
}

// Route debug IP
app.get('/debug-ip', async (req, res) => {
    try {
        const publicIP = await getPublicIP();
        res.json({
            serverPublicIP: publicIP,
            clientIP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            headers: req.headers,
            mongoStatus: mongoose.connection.readyState === 1 ? 'Connecté' : 'Déconnecté'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route pour récupérer la configuration des prix
app.get('/api/pricing-config', async (req, res) => {
    try {
        let config = await PricingConfig.findOne();
        
        if (!config) {
            config = await PricingConfig.create({});
        }
        
        res.json({ success: true, config });
    } catch (error) {
        console.error('Erreur récupération config:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour soumettre un devis
app.post('/api/submit-quote', async (req, res) => {
    try {
        const { clientInfo, projectDetails, pricing } = req.body;
        
        if (!clientInfo.name || !clientInfo.email || !projectDetails.pageType || !projectDetails.designLevel) {
            return res.status(400).json({ 
                error: 'Informations obligatoires manquantes' 
            });
        }
        
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        const quote = await Quote.create({
            clientInfo,
            projectDetails,
            pricing,
            ipAddress,
            userAgent
        });
        
        console.log('✅ Devis créé:', quote._id);
        
        await sendTelegramNotification(quote);
        
        res.json({ 
            success: true, 
            quoteId: quote._id,
            message: 'Devis enregistré avec succès'
        });
        
    } catch (error) {
        console.error('Erreur création devis:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la création du devis',
            details: error.message 
        });
    }
});

// Route pour récupérer tous les devis (admin)
app.get('/api/quotes', async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        
        const query = status ? { status } : {};
        const quotes = await Quote.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const count = await Quote.countDocuments(query);
        
        res.json({
            success: true,
            quotes,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Erreur récupération devis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour récupérer un devis spécifique
app.get('/api/quotes/:id', async (req, res) => {
    try {
        const quote = await Quote.findById(req.params.id);
        
        if (!quote) {
            return res.status(404).json({ error: 'Devis non trouvé' });
        }
        
        res.json({ success: true, quote });
    } catch (error) {
        console.error('Erreur récupération devis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Route pour mettre à jour le statut d'un devis
app.patch('/api/quotes/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        const quote = await Quote.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        
        if (!quote) {
            return res.status(404).json({ error: 'Devis non trouvé' });
        }
        
        res.json({ success: true, quote });
    } catch (error) {
        console.error('Erreur mise à jour devis:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// IA generation route removed

app.get('/api/health', (req, res) => {
    const apiConfigured = !!process.env.ANTHROPIC_API_KEY;
    const dbConnected = mongoose.connection.readyState === 1;
    
    res.json({ 
        status: 'OK', 
        message: 'API fonctionnelle',
        claude_api: apiConfigured ? 'Configurée' : 'Non configurée',
        database: dbConnected ? 'Connectée' : 'Déconnectée'
    });
});

app.get('/devis', (req, res) => {
    res.sendFile(path.join(__dirname, 'devis.html'));
});
app.get('/tunnel-conversion', (req, res) => {
    res.sendFile(path.join(__dirname, 'tunnel-conversion.html'));
});
app.get('/identite-visuelle', (req, res) => {
    res.sendFile(path.join(__dirname, 'identite-visuelle.html'));
});
// Route pour l'administration CMS
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/simple-cms.html'));
});

// Route pour servir les fichiers de contenu JSON
app.get('/content/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'content', `${filename}.json`);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Erreur lors du chargement de ${filePath}:`, err);
            res.status(404).json({ error: 'Fichier de contenu non trouvé' });
        }
    });
});

// Route pour sauvegarder le contenu
app.post('/api/save-content', (req, res) => {
    try {
        const { filename, data } = req.body;
        
        if (!filename || !data) {
            return res.status(400).json({ error: 'Nom de fichier et données requis' });
        }

        // fs is already imported at the top
        const filePath = path.join(__dirname, 'content', `${filename}.json`);
        
        // Sauvegarder le fichier JSON
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        console.log(`✅ Contenu sauvegardé: ${filename}.json`);
        res.json({ success: true, message: 'Contenu sauvegardé avec succès' });
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

// Configurator routes removed

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`\n🚀 Serveur LandingIA démarré sur le port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🤖 Claude API: ${process.env.ANTHROPIC_API_KEY ? '✅ Configurée' : '❌ Non configurée'}`);
    console.log(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connectée' : '⏳ En cours...'}`);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
    console.log('👋 Arrêt du serveur...');
    mongoose.connection.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n👋 Arrêt du serveur...');
    mongoose.connection.close();
    process.exit(0);
});
