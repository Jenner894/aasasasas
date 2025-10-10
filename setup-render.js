#!/usr/bin/env node

/**
 * Script de configuration pour Render
 * Ce script aide à configurer le CMS pour Render
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configuration pour Render...\n');

// Vérifier si on est dans le bon répertoire
if (!fs.existsSync('admin/config.yml')) {
    console.error('❌ Erreur: Ce script doit être exécuté depuis la racine du projet');
    process.exit(1);
}

console.log('📋 Étapes à suivre pour configurer Render:\n');

console.log('1. 🔑 Créer un Personal Access Token GitHub:');
console.log('   - Allez sur GitHub → Settings → Developer settings');
console.log('   - Personal access tokens → Tokens (classic)');
console.log('   - Generate new token (classic)');
console.log('   - Scopes requis: repo, user:email');
console.log('   - Copiez le token généré\n');

console.log('2. 📝 Modifier admin/config.yml:');
console.log('   - Remplacez "your-username/your-repo-name" par votre repository');
console.log('   - Exemple: "mon-username/shift-agency-website"\n');

console.log('3. 🌐 Déployer sur Render:');
console.log('   - Connectez votre repository GitHub');
console.log('   - Build Command: npm install');
console.log('   - Start Command: npm start');
console.log('   - Ajoutez les variables d\'environnement:\n');

console.log('   Variables d\'environnement à ajouter:');
console.log('   ┌─────────────────┬─────────────────────────────────────┐');
console.log('   │ GITHUB_TOKEN    │ [Votre token GitHub]               │');
console.log('   │ GITHUB_REPO     │ username/repo-name                  │');
console.log('   │ GITHUB_BRANCH   │ main                               │');
console.log('   │ NODE_ENV        │ production                         │');
console.log('   └─────────────────┴─────────────────────────────────────┘\n');

console.log('4. ✅ Tester l\'admin:');
console.log('   - Allez sur https://votre-site.onrender.com/admin');
console.log('   - Connectez-vous avec GitHub');
console.log('   - Testez la modification de contenu\n');

console.log('📚 Documentation complète: RENDER-DEPLOYMENT.md\n');

// Vérifier la configuration actuelle
const configPath = 'admin/config.yml';
const config = fs.readFileSync(configPath, 'utf8');

if (config.includes('your-username/your-repo-name')) {
    console.log('⚠️  ATTENTION: Vous devez remplacer "your-username/your-repo-name" par votre repository GitHub');
    console.log('   Dans le fichier admin/config.yml\n');
}

console.log('🎉 Configuration terminée! Suivez les étapes ci-dessus pour déployer sur Render.');
