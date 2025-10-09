# Configuration Google Analytics 4 pour Looker Studio

## 🎯 Objectif
Ce guide vous explique comment configurer Google Analytics 4 (GA4) sur votre site pour suivre les statistiques et créer des tableaux de bord dans Looker Studio.

## 📋 Étapes de Configuration

### 1. Créer un Compte Google Analytics 4

1. Allez sur [Google Analytics](https://analytics.google.com/)
2. Cliquez sur "Commencer la mesure"
3. Créez un compte et une propriété GA4
4. Notez votre **ID de mesure** (format: `G-XXXXXXXXXX`)

### 2. Remplacer l'ID dans les Fichiers

Recherchez et remplacez `G-XXXXXXXXXX` par votre véritable ID de mesure dans les fichiers suivants:

#### Dans `index.html` (lignes 13-31):
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=VOTRE-ID-GA4"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'VOTRE-ID-GA4', {
    'send_page_view': true,
    'page_title': document.title,
    'page_location': window.location.href
  });
</script>
```

#### Dans `devis.html` (lignes 13-31):
Remplacez également `G-XXXXXXXXXX` par votre ID.

### 3. Événements Trackés Automatiquement

Le site track automatiquement les événements suivants pour Looker Studio:

#### Page d'accueil (index.html)
- ✅ **page_view** - Vues de page
- ✅ **navigation_click** - Clics sur les liens de navigation
- ✅ **click** (CTA) - Clics sur les boutons CTA principaux
  - Header - Simuler un devis
  - Hero - Réserver un Appel

#### Page de devis (devis.html)
- ✅ **page_view** - Vues de page
- ✅ **select_item** - Sélection d'options dans le formulaire
- ✅ **form_step_completed** - Progression dans les étapes du formulaire
- ✅ **generate_lead** - Conversion (soumission du formulaire)
- ✅ **form_submit** - Soumission du formulaire avec valeur totale

### 4. Connecter GA4 à Looker Studio

1. Allez sur [Looker Studio](https://lookerstudio.google.com/)
2. Créez un nouveau rapport
3. Sélectionnez "Google Analytics" comme source de données
4. Choisissez votre propriété GA4
5. Créez vos visualisations avec les métriques disponibles

### 5. Métriques Recommandées pour Looker Studio

#### Métriques Principales
- **Utilisateurs actifs** - Nombre de visiteurs
- **Sessions** - Nombre de visites
- **Taux de conversion** - % de leads générés
- **Valeur moyenne des devis** - Montant moyen

#### Événements Personnalisés
- **generate_lead** - Nombre de leads
  - Dimension: `page_type`, `design_level`, `options_count`
  - Métrique: `value` (montant du devis)
  
- **form_step_completed** - Abandon de formulaire
  - Dimension: `step_name`, `step_number`
  
- **select_item** - Options populaires
  - Dimension: `item_name`, `item_category`

### 6. Tableaux de Bord Suggérés

#### Dashboard 1: Performance Globale
- Graphique des sessions par jour
- Taux de conversion
- Sources de trafic
- Appareils utilisés

#### Dashboard 2: Tunnel de Conversion
- Entonnoir des étapes du formulaire
- Taux d'abandon par étape
- Options les plus sélectionnées
- Valeur moyenne par type de page

#### Dashboard 3: ROI & Revenus
- Nombre total de leads
- Valeur totale des devis
- Valeur moyenne par lead
- Tendance mensuelle

## 🔧 Support Technique

### Vérification de l'Installation

Pour vérifier que GA4 est bien installé:

1. Ouvrez votre site dans le navigateur
2. Ouvrez la console développeur (F12)
3. Tapez: `dataLayer`
4. Vous devriez voir un tableau avec les événements

### Problèmes Courants

**Problème**: Les événements ne s'enregistrent pas
- Solution: Vérifiez que l'ID GA4 est correct
- Vérifiez dans la console qu'il n'y a pas d'erreurs

**Problème**: Les données n'apparaissent pas dans Looker Studio
- Solution: Attendez 24-48h pour que les données s'accumulent
- Vérifiez que la propriété GA4 est bien connectée

## 📊 Exemples de Rapports Looker Studio

### Rapport Mensuel
```
Total Visiteurs: [Métrique: Users]
Total Sessions: [Métrique: Sessions]  
Taux Conversion: [Métrique: Conversions / Sessions]
Valeur Totale Devis: [Métrique: Event Value pour generate_lead]
```

### Analyse du Formulaire
```
Étape 1 (Type): [Métrique: event_count pour step_name=Type de Landing Page]
Étape 2 (Design): [Métrique: event_count pour step_name=Niveau de Personnalisation]
Étape 3 (Options): [Métrique: event_count pour step_name=Options & Fonctionnalités]
Étape 4 (Contact): [Métrique: event_count pour step_name=Informations de Contact]
Conversions: [Métrique: event_count pour generate_lead]
```

## 🎯 Objectifs et Conversions

Dans GA4, configurez les conversions suivantes:
1. `generate_lead` - Lead généré (événement principal)
2. `form_submit` - Formulaire soumis
3. `click` avec `event_label` contenant "Réserver" - Réservation d'appel

## 📈 Optimisation Continue

Utilisez les données pour:
- Identifier les étapes avec le plus d'abandon
- Comprendre quels types de pages sont les plus demandés
- Optimiser les prix selon les sélections populaires
- A/B tester différentes versions

---

**Note**: Remplacez impérativement `G-XXXXXXXXXX` par votre véritable ID Google Analytics 4 dans les fichiers `index.html` et `devis.html` pour que le tracking fonctionne.
