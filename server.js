const express = require('express');
const path = require('path');
const compression = require('compression');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Route API pour générer la landing page avec Claude
app.post('/api/generate-landing', async (req, res) => {
    try {
        const { sector, objective, style, companyName, tagline } = req.body;

        // Validation des données
        if (!sector || !objective || !style) {
            return res.status(400).json({ 
                error: 'Tous les champs obligatoires doivent être remplis' 
            });
        }

        console.log('Génération en cours pour:', { sector, objective, style, companyName });

        // Mapping des secteurs en français pour le prompt
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

        // Créer le prompt pour Claude
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

        // Appel à l'API Claude
        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            temperature: 0.7,
            messages: [{
                role: "user",
                content: prompt
            }]
        });

        // Extraire le contenu HTML
        let generatedHTML = message.content[0].text;

        // Nettoyer le code si Claude a ajouté des balises markdown
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
        
        // Retourner une erreur détaillée
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
    res.json({ 
        status: 'OK', 
        message: 'API fonctionnelle',
        claude_api: apiConfigured ? 'Configurée' : 'Non configurée'
    });
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
    if (!process.env.ANTHROPIC_API_KEY) {
        console.log('⚠️  Ajoutez ANTHROPIC_API_KEY dans votre fichier .env');
    }
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
    console.log('👋 Arrêt du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n👋 Arrêt du serveur...');
    process.exit(0);
});
