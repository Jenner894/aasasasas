# Configuration Google Analytics 4 et Looker Studio

## 🎯 Objectif
Configurer le suivi des statistiques du site avec Google Analytics 4 et créer des tableaux de bord avec Looker Studio.

## 📊 Étapes de Configuration

### 1. Créer un compte Google Analytics 4

1. Allez sur [Google Analytics](https://analytics.google.com/)
2. Cliquez sur "Commencer la mesure"
3. Créez un compte pour votre site
4. Sélectionnez "Web" comme plateforme
5. Configurez votre flux de données :
   - URL du site web : `https://votre-domaine.com`
   - Nom du flux : "Site Web Principal"

### 2. Obtenir l'ID de mesure

1. Dans Google Analytics, allez dans "Administration" (icône d'engrenage)
2. Sélectionnez votre compte et propriété
3. Dans "Flux de données", cliquez sur votre flux web
4. Copiez l'**ID de mesure** (format : G-XXXXXXXXXX)

### 3. Mettre à jour le code sur le site

Remplacez `G-XXXXXXXXXX` dans les fichiers suivants par votre vrai ID de mesure :
- `index.html` (ligne 13 et 18)
- `devis.html` (ligne 13 et 18)

### 4. Configuration des événements personnalisés

Le site est déjà configuré pour suivre :
- ✅ Vues de pages
- ✅ Clics sur les boutons CTA
- ✅ Soumissions de formulaires
- ✅ Temps passé sur la page
- ✅ Taux de rebond

### 5. Configuration Looker Studio

1. Allez sur [Looker Studio](https://lookerstudio.google.com/)
2. Cliquez sur "Créer" → "Source de données"
3. Sélectionnez "Google Analytics 4"
4. Connectez votre compte Google Analytics
5. Sélectionnez votre propriété GA4

### 6. Métriques recommandées à suivre

#### Métriques de base
- **Utilisateurs** : Nombre de visiteurs uniques
- **Sessions** : Nombre de visites
- **Pages vues** : Nombre de pages consultées
- **Durée moyenne des sessions** : Temps passé sur le site
- **Taux de rebond** : Pourcentage de sessions à une page

#### Métriques de conversion
- **Taux de conversion** : Pourcentage de visiteurs qui remplissent le formulaire
- **Objectifs atteints** : Nombre de devis demandés
- **Parcours utilisateur** : Pages les plus visitées
- **Sources de trafic** : D'où viennent vos visiteurs

#### Métriques avancées
- **Temps de chargement** : Performance du site
- **Appareils utilisés** : Desktop vs Mobile
- **Géolocalisation** : Pays/régions des visiteurs
- **Heures de pointe** : Quand vos visiteurs sont les plus actifs

### 7. Tableaux de bord recommandés

#### Tableau de bord principal
- Graphique des sessions par jour
- Top 10 des pages les plus visitées
- Sources de trafic (organique, direct, social, etc.)
- Répartition par appareil
- Carte géographique des visiteurs

#### Tableau de bord de conversion
- Taux de conversion par source de trafic
- Funnel de conversion (page d'accueil → devis → soumission)
- Temps moyen avant conversion
- Taux de rebond par page

#### Tableau de bord de performance
- Temps de chargement par page
- Erreurs 404
- Pages avec le plus haut taux de rebond
- Performance mobile vs desktop

### 8. Configuration des objectifs

Dans Google Analytics 4, configurez ces objectifs :

1. **Demande de devis** :
   - Événement : `form_submit`
   - Paramètre : `form_name = "quote_form"`

2. **Clic sur CTA principal** :
   - Événement : `click`
   - Paramètre : `link_text` contient "Réserver un Appel"

3. **Navigation vers devis** :
   - Événement : `page_view`
   - Paramètre : `page_location` contient "/devis"

### 9. Rapports automatisés

Configurez des rapports hebdomadaires qui incluent :
- Nombre de nouveaux visiteurs
- Taux de conversion
- Pages les plus performantes
- Sources de trafic les plus rentables
- Recommandations d'amélioration

### 10. Intégration avec d'autres outils

- **Google Search Console** : Pour les données SEO
- **Google Ads** : Pour le suivi des campagnes publicitaires
- **Facebook Pixel** : Pour le retargeting (déjà configuré)
- **Hotjar** : Pour l'analyse comportementale

## 🔧 Code de suivi avancé

Pour un suivi plus précis, vous pouvez ajouter ces événements personnalisés :

```javascript
// Suivi des clics sur les boutons CTA
document.querySelectorAll('.btn-primary').forEach(button => {
    button.addEventListener('click', function() {
        gtag('event', 'cta_click', {
            'event_category': 'engagement',
            'event_label': this.textContent.trim()
        });
    });
});

// Suivi du temps passé sur la page
let startTime = Date.now();
window.addEventListener('beforeunload', function() {
    let timeSpent = Math.round((Date.now() - startTime) / 1000);
    gtag('event', 'time_on_page', {
        'event_category': 'engagement',
        'value': timeSpent
    });
});

// Suivi des erreurs JavaScript
window.addEventListener('error', function(e) {
    gtag('event', 'javascript_error', {
        'event_category': 'error',
        'event_label': e.message,
        'value': 1
    });
});
```

## 📈 Métriques clés à surveiller

1. **Taux de conversion global** : Objectif > 2%
2. **Temps moyen sur la page** : Objectif > 2 minutes
3. **Taux de rebond** : Objectif < 60%
4. **Pages par session** : Objectif > 2.5
5. **Taux de conversion mobile** : Objectif > 1.5%

## 🚀 Optimisations recommandées

1. **A/B Testing** : Testez différents titres et CTA
2. **Optimisation mobile** : Améliorez l'expérience mobile
3. **Vitesse de chargement** : Objectif < 3 secondes
4. **SEO technique** : Optimisez les métadonnées
5. **Contenu** : Créez du contenu qui engage plus longtemps

## 📞 Support

Pour toute question sur la configuration :
- Documentation Google Analytics : https://support.google.com/analytics
- Documentation Looker Studio : https://support.google.com/looker-studio
- Support technique : contact@shift-agency.com
