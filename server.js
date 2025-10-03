const express = require('express');
const path = require('path');
const compression = require('compression');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/landingia';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => console.error('❌ Erreur MongoDB:', err));

// Schémas MongoDB
const quoteSchema = new mongoose.Schema({
    // Informations client
    clientInfo: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: String,
        company: String
    },
    
    // Détails du projet
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
    
    // Calcul du prix
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
    
    // Statut
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    
    // Métadonnées
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
});

const Quote = mongoose.model('Quote', quoteSchema);

// Schéma pour les paramètres de prix (modifiable via admin)
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

// Configuration Anthropic Claude
const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    
    // Mapping des labels
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

    // Construction du message
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
// Route pour récupérer la configuration des prix
app.get('/api/pricing-config', async (req, res) => {
    try {
        let config = await PricingConfig.findOne();
        
        // Si aucune config n'existe, en créer une par défaut
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
        
        // Validation
        if (!clientInfo.name || !clientInfo.email || !projectDetails.pageType || !projectDetails.designLevel) {
            return res.status(400).json({ 
                error: 'Informations obligatoires manquantes' 
            });
        }
        
        // Récupérer l'IP et User Agent
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        // Créer le devis
        const quote = await Quote.create({
            clientInfo,
            projectDetails,
            pricing,
            ipAddress,
            userAgent
        });
        
        console.log('✅ Devis créé:', quote._id);
        
        // Envoyer notification Telegram
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

// Route API pour générer la landing page avec Claude
app.post('/api/generate-landing', async (req, res) => {
    try {
        const { sector, objective, style, companyName, tagline } = req.body;

        if (!sector || !objective || !style) {
            return res.status(400).json({ 
                error: 'Tous les champs obligatoires doivent être remplis' 
            });
        }

        console.log('Génération en cours pour:', { sector, objective, style, companyName });

        const sectorNames = {
            restaurant: 'Restaurant / Café',
            tech: 'Tech / SaaS',
            ecommerce: 'E-commerce',
            immobilier: 'Immobilier',
            sante: 'Santé / Bien-être',
            coaching: 'Coaching / Formation',
            event: 'Événementiel',
            autre: 'Autre'
        };

        const objectiveNames = {
            leads: 'Capturer des leads',
            vente: 'Vendre un produit/service',
            inscription: 'Inscription événement',
            info: 'Présentation entreprise',
            portfolio: 'Portfolio / CV'
        };

        const styleNames = {
            minimaliste: 'Minimaliste',
            bold: 'Bold / Audacieux',
            elegant: 'Élégant / Luxe',
            moderne: 'Moderne / Tech',
            fun: 'Fun / Créatif'
        };

        const prompt = `Tu es un expert en design web et copywriting professionnel. Génère une landing page HTML complète et professionnelle avec ces caractéristiques:

**Secteur d'activité**: ${sectorNames[sector] || sector}
**Objectif principal**: ${objectiveNames[objective] || objective}
**Style visuel**: ${styleNames[style] || style}
**Nom de l'entreprise**: ${companyName || 'Mon Entreprise'}
**Slogan/Message clé**: ${tagline || 'Votre message clé'}

**Exigences techniques**:
1. Code HTML5 valide avec CSS inline dans une balise <style> en début de document
2. Design moderne, responsive (mobile-first) et professionnel
3. Palette de couleurs cohérente adaptée au style demandé
4. Typographie élégante (utiliser des polices system ou Google Fonts)
5. Animations CSS subtiles au survol
6. Structure claire: header, hero section, 3 features/avantages, CTA, footer simple

**Exigences contenu**:
1. Titre accrocheur (H1) adapté au secteur
2. Sous-titre engageant expliquant la proposition de valeur
3. CTA (Call-to-Action) clair et incitatif adapté à l'objectif
4. 3 features/avantages pertinents pour le secteur avec icônes émojis
5. Texte professionnel, persuasif et optimisé pour la conversion
6. Ton adapté au style (luxueux pour élégant, dynamique pour bold, etc.)

**Contraintes**:
- Largeur max du contenu: 1200px centré
- Pas de JavaScript
- Pas de liens externes sauf polices
- Code propre et bien structuré
- Height minimum de 600px pour permettre l'aperçu

Retourne UNIQUEMENT le code HTML complet prêt à être affiché, sans balises markdown, sans explications avant ou après.`;

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            temperature: 0.7,
            messages: [{
                role: "user",
                content: prompt
            }]
        });

        let generatedHTML = message.content[0].text;
        generatedHTML = generatedHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '');

        console.log('Génération réussie');

        res.json({
            success: true,
            html: generatedHTML,
            metadata: {
                sector: sectorNames[sector],
                objective: objectiveNames[objective],
                style: styleNames[style],
                companyName: companyName || 'Mon Entreprise',
                tagline: tagline || 'Votre message clé',
                tokens: message.usage
            }
        });

    } catch (error) {
        console.error('Erreur lors de la génération:', error);
        res.status(500).json({
            error: 'Erreur lors de la génération de la landing page',
            details: error.message,
            type: error.type || 'unknown'
        });
    }
});

// Route de test pour vérifier l'API
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

// Route pour la page de devis
app.get('/devis', (req, res) => {
    res.sendFile(path.join(__dirname, 'devis.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur LandingIA démarré sur le port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🤖 Claude API: ${process.env.ANTHROPIC_API_KEY ? '✅ Configurée' : '❌ Non configurée'}`);
    console.log(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connectée' : '⏳ Connexion...'}`);
    
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⚠️  Ajoutez ANTHROPIC_API_KEY dans votre fichier .env');
    }
});
app.get('/api/ip', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.json({ 
        ip: ip,
        headers: req.headers 
    });
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
