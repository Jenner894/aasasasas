# 🎛️ CMS Decap - Guide d'Utilisation

## 📋 Vue d'ensemble

Ce système CMS permet à tes collègues de modifier facilement le contenu de ton site sans toucher au code. Toutes les zones principales sont modifiables via une interface d'administration intuitive.

## 🚀 Accès à l'Administration

### URL d'Administration
```
http://localhost:3000/admin
```

### Première Configuration
1. Accède à `/admin` sur ton site
2. Clique sur "Login with Netlify Identity" 
3. Crée un compte administrateur
4. Commence à éditer le contenu !

## 📝 Sections Modifiables

### 1. **Configuration du Site** (`site_config`)
- Nom du site
- Description SEO
- Mots-clés
- URL canonique
- Couleur du thème

### 2. **Section Hero** (`hero`)
- Titre principal
- Texte en surbrillance
- Sous-titre
- Bouton CTA
- Badges de confiance
- Statistiques
- Témoignages clients

### 3. **Section Performance** (`performance`)
- Titre de section
- Titre du graphique
- Description
- Pourcentage d'augmentation
- Cartes de performance
- Statistiques

### 4. **Portfolio** (`portfolio`)
- Titre de section
- Sous-titre
- Projets (titre, description, image, lien)
- Tags des projets
- Témoignages clients
- Bouton CTA

### 5. **Section Réservation** (`booking`)
- Titre de section
- Sous-titre
- Avantages de la consultation
- URL du calendrier

### 6. **Footer** (`footer`)
- Copyright
- Graphiques de performance

### 7. **Navigation** (`navigation`)
- Liens du menu
- Bouton devis

### 8. **Page Devis** (`quote_page`)
- Titre de la page
- Description
- Sous-titre
- Note sur les tarifs

## 🛠️ Structure des Fichiers

```
├── admin/
│   ├── index.html          # Interface d'administration
│   └── config.yml         # Configuration du CMS
├── content/               # Fichiers de contenu JSON
│   ├── site-config.json
│   ├── hero.json
│   ├── performance.json
│   ├── portfolio.json
│   ├── booking.json
│   ├── footer.json
│   ├── navigation.json
│   └── quote-page.json
└── cms-loader.js         # Script de chargement dynamique
```

## 🔧 Fonctionnement Technique

### Chargement Dynamique
- Le script `cms-loader.js` charge automatiquement le contenu depuis les fichiers JSON
- Le contenu est injecté dans les templates HTML existants
- Aucune modification du code HTML n'est nécessaire

### Sauvegarde
- Les modifications sont sauvegardées dans les fichiers JSON
- Les changements sont immédiatement visibles sur le site
- Pas de redémarrage du serveur nécessaire

## 📱 Interface d'Administration

### Types de Champs Disponibles
- **String** : Texte simple
- **Text** : Texte long (paragraphes)
- **Number** : Valeurs numériques
- **Color** : Sélecteur de couleur
- **Image** : Upload d'images
- **List** : Listes d'éléments
- **Select** : Menu déroulant

### Édition en Temps Réel
- Prévisualisation instantanée
- Sauvegarde automatique
- Interface intuitive et responsive

## 🎯 Avantages

### Pour les Éditeurs
- ✅ Interface simple et intuitive
- ✅ Pas besoin de connaissances techniques
- ✅ Prévisualisation en temps réel
- ✅ Sauvegarde automatique

### Pour les Développeurs
- ✅ Code HTML préservé
- ✅ Design intact
- ✅ Structure maintenue
- ✅ Facile à maintenir

## 🚨 Bonnes Pratiques

### Contenu
- Garde les textes courts et percutants
- Utilise des images optimisées
- Vérifie l'orthographe avant publication
- Teste sur mobile après modification

### Images
- Format recommandé : WebP ou JPEG
- Taille optimale : 1200px de largeur max
- Compression : 80-90% de qualité

### SEO
- Remplis toujours la description
- Utilise des mots-clés pertinents
- Garde les titres courts et clairs

## 🔄 Workflow Recommandé

1. **Planification** : Définis les modifications à apporter
2. **Édition** : Utilise l'interface d'administration
3. **Vérification** : Contrôle le rendu sur le site
4. **Publication** : Les changements sont automatiquement appliqués

## 🆘 Support

### Problèmes Courants
- **Contenu ne se charge pas** : Vérifie que les fichiers JSON sont accessibles
- **Images ne s'affichent pas** : Vérifie l'URL de l'image
- **Modifications non sauvegardées** : Rafraîchis la page d'administration

### Contact
Pour toute question technique, contacte l'équipe de développement.

---

**🎉 Félicitations !** Ton site est maintenant entièrement modifiable par tes collègues sans risque de casser le design !
