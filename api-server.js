#!/usr/bin/env node

/**
 * Serveur API pour le CMS
 * Gère la sauvegarde des fichiers de contenu
 */

import { createServer } from 'http';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.API_PORT || 3001;

const server = createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/save-content' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const { name, data } = JSON.parse(body);
        const filePath = join(__dirname, 'content', `${name}.json`);
        
        // Créer le dossier content s'il n'existe pas
        const contentDir = join(__dirname, 'content');
        if (!existsSync(contentDir)) {
          require('fs').mkdirSync(contentDir, { recursive: true });
        }
        
        writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Contenu sauvegardé' }));
        
        console.log(`✅ Contenu sauvegardé: ${name}.json`);
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint non trouvé' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📁 Content directory: ${join(__dirname, 'content')}`);
});
