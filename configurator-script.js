class LandingPageConfigurator {
    constructor() {
        this.config = {
            structure: {
                sectionsCount: 5,
                layout: 'single-column',
                sections: ['hero', 'features', 'contact']
            },
            design: {
                style: 'minimalist',
                palette: 'blue',
                primaryColor: '#3B82F6',
                secondaryColor: '#1E40AF',
                accentColor: '#60A5FA',
                background: 'solid'
            },
            typography: {
                fontFamily: 'Inter',
                h1Size: 48,
                headingWeight: 700,
                lineHeight: 1.5,
                letterSpacing: 0
            },
            animations: {
                types: ['fadeIn'],
                speed: 600,
                hoverEffects: ['scale', 'shadow'],
                parallax: false
            },
            content: {
                sector: '',
                companyName: '',
                tagline: '',
                tone: 'professional',
                description: ''
            },
            cta: {
                objective: 'leads',
                text: 'Commencer Maintenant',
                style: 'solid',
                size: 'medium',
                trustElements: []
            }
        };

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.updateProgress();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.config-section');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetSection = item.dataset.section;

                navItems.forEach(nav => nav.classList.remove('active'));
                sections.forEach(section => section.classList.remove('active'));

                item.classList.add('active');
                document.getElementById(`${targetSection}-section`).classList.add('active');
            });
        });
    }

    setupEventListeners() {
        const sectionsCount = document.getElementById('sectionsCount');
        sectionsCount.addEventListener('input', (e) => {
            document.getElementById('sectionsCountValue').textContent = e.target.value;
            this.config.structure.sectionsCount = parseInt(e.target.value);
            this.updateProgress();
        });

        document.querySelectorAll('input[name="layout"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.config.structure.layout = e.target.value;
                this.updateProgress();
            });
        });

        document.querySelectorAll('input[name="sections"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.config.structure.sections = Array.from(
                    document.querySelectorAll('input[name="sections"]:checked')
                ).map(cb => cb.value);
                this.updateProgress();
            });
        });

        document.querySelectorAll('input[name="designStyle"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.config.design.style = e.target.value;
                this.updateProgress();
            });
        });

        document.querySelectorAll('.palette-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.palette-option').forEach(opt =>
                    opt.classList.remove('active')
                );
                option.classList.add('active');
                this.config.design.palette = option.dataset.palette;
                this.updateProgress();
            });
        });

        ['primaryColor', 'secondaryColor', 'accentColor'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                this.config.design[id] = e.target.value;
            });
        });

        document.querySelectorAll('input[name="background"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.config.design.background = e.target.value;
                this.updateProgress();
            });
        });

        const fontFamily = document.getElementById('fontFamily');
        fontFamily.addEventListener('change', (e) => {
            this.config.typography.fontFamily = e.target.value;
            this.updateProgress();
        });

        const h1Size = document.getElementById('h1Size');
        h1Size.addEventListener('input', (e) => {
            document.getElementById('h1SizeValue').textContent = e.target.value + 'px';
            this.config.typography.h1Size = parseInt(e.target.value);
        });

        const headingWeight = document.getElementById('headingWeight');
        headingWeight.addEventListener('change', (e) => {
            this.config.typography.headingWeight = parseInt(e.target.value);
        });

        const lineHeight = document.getElementById('lineHeight');
        lineHeight.addEventListener('input', (e) => {
            document.getElementById('lineHeightValue').textContent = e.target.value;
            this.config.typography.lineHeight = parseFloat(e.target.value);
        });

        const letterSpacing = document.getElementById('letterSpacing');
        letterSpacing.addEventListener('input', (e) => {
            document.getElementById('letterSpacingValue').textContent = e.target.value + 'px';
            this.config.typography.letterSpacing = parseFloat(e.target.value);
        });

        document.querySelectorAll('input[name="animations"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.config.animations.types = Array.from(
                    document.querySelectorAll('input[name="animations"]:checked')
                ).map(cb => cb.value);
            });
        });

        const animationSpeed = document.getElementById('animationSpeed');
        animationSpeed.addEventListener('input', (e) => {
            document.getElementById('animationSpeedValue').textContent = e.target.value + 'ms';
            this.config.animations.speed = parseInt(e.target.value);
        });

        document.querySelectorAll('input[name="hoverEffects"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.config.animations.hoverEffects = Array.from(
                    document.querySelectorAll('input[name="hoverEffects"]:checked')
                ).map(cb => cb.value);
            });
        });

        const parallaxEnabled = document.getElementById('parallaxEnabled');
        parallaxEnabled.addEventListener('change', (e) => {
            this.config.animations.parallax = e.target.checked;
        });

        const sector = document.getElementById('sector');
        sector.addEventListener('change', (e) => {
            this.config.content.sector = e.target.value;
            this.updateProgress();
        });

        const companyName = document.getElementById('companyName');
        companyName.addEventListener('input', (e) => {
            this.config.content.companyName = e.target.value;
            this.updateProgress();
        });

        const tagline = document.getElementById('tagline');
        tagline.addEventListener('input', (e) => {
            this.config.content.tagline = e.target.value;
        });

        document.querySelectorAll('input[name="tone"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.config.content.tone = e.target.value;
                this.updateProgress();
            });
        });

        const projectDescription = document.getElementById('projectDescription');
        projectDescription.addEventListener('input', (e) => {
            this.config.content.description = e.target.value;
        });

        const ctaObjective = document.getElementById('ctaObjective');
        ctaObjective.addEventListener('change', (e) => {
            this.config.cta.objective = e.target.value;
            this.updateProgress();
        });

        const ctaText = document.getElementById('ctaText');
        ctaText.addEventListener('input', (e) => {
            this.config.cta.text = e.target.value;
        });

        document.querySelectorAll('input[name="ctaStyle"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.config.cta.style = e.target.value;
            });
        });

        document.querySelectorAll('input[name="ctaSize"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.config.cta.size = e.target.value;
            });
        });

        document.querySelectorAll('input[name="trustElements"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.config.cta.trustElements = Array.from(
                    document.querySelectorAll('input[name="trustElements"]:checked')
                ).map(cb => cb.value);
            });
        });

        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateLandingPage();
        });

        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            this.saveConfiguration();
        });

        document.getElementById('loadConfigBtn').addEventListener('click', () => {
            this.loadConfiguration();
        });
    }

    updateProgress() {
        const requiredFields = [
            !!this.config.structure.sectionsCount,
            !!this.config.structure.layout,
            this.config.structure.sections.length > 0,
            !!this.config.design.style,
            !!this.config.design.palette,
            !!this.config.content.sector,
            !!this.config.content.companyName,
            !!this.config.content.tone,
            !!this.config.cta.objective
        ];

        const completed = requiredFields.filter(Boolean).length;
        const total = requiredFields.length;
        const percentage = Math.round((completed / total) * 100);

        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `${percentage}% complété`;
    }

    buildOptimizedPrompt() {
        const { structure, design, typography, animations, content, cta } = this.config;

        const sectorContext = {
            restaurant: { keywords: 'gastronomie, ambiance, menu, réservation', vibe: 'chaleureux et gourmand' },
            tech: { keywords: 'innovation, performance, solution, technologie', vibe: 'moderne et professionnel' },
            ecommerce: { keywords: 'produits, boutique, livraison, garantie', vibe: 'attractif et rassurant' },
            immobilier: { keywords: 'propriété, localisation, investissement, visite', vibe: 'sérieux et aspirationnel' },
            sante: { keywords: 'bien-être, soins, expertise, confiance', vibe: 'apaisant et professionnel' },
            coaching: { keywords: 'transformation, accompagnement, réussite, potentiel', vibe: 'motivant et inspirant' },
            event: { keywords: 'expérience, moments, organisation, succès', vibe: 'festif et dynamique' },
            finance: { keywords: 'sécurité, croissance, expertise, patrimoine', vibe: 'confiant et professionnel' },
            beauty: { keywords: 'beauté, soin, élégance, transformation', vibe: 'luxueux et raffiné' },
            sport: { keywords: 'performance, énergie, dépassement, résultats', vibe: 'dynamique et motivant' }
        };

        const styleGuide = {
            minimalist: 'design épuré, espaces blancs généreux, typographie claire, contraste fort',
            bold: 'couleurs vibrantes, typographie imposante, contrastes forts, éléments graphiques marqués',
            elegant: 'couleurs subtiles, typographie raffinée, espacements aérés, détails sophistiqués',
            modern: 'design tech, animations fluides, couleurs vives, interfaces intuitives'
        };

        const layoutInstructions = {
            'single-column': 'Structure en une seule colonne centrée, max-width 1200px',
            'two-columns': 'Alternance de sections en deux colonnes (texte/image)',
            'grid': 'Layout en grille avec cards et éléments organisés en grid CSS moderne'
        };

        const animationsCSS = animations.types.map(type => {
            const animationMap = {
                fadeIn: 'opacity: 0; animation: fadeIn ${speed}ms ease forwards;',
                slideUp: 'transform: translateY(30px); opacity: 0; animation: slideUp ${speed}ms ease forwards;',
                slideRight: 'transform: translateX(-30px); opacity: 0; animation: slideRight ${speed}ms ease forwards;',
                zoomIn: 'transform: scale(0.9); opacity: 0; animation: zoomIn ${speed}ms ease forwards;',
                rotateIn: 'transform: rotate(-5deg); opacity: 0; animation: rotateIn ${speed}ms ease forwards;'
            };
            return animationMap[type]?.replace('${speed}', animations.speed);
        }).join('\n');

        const hoverEffectsCSS = animations.hoverEffects.map(effect => {
            const effectMap = {
                scale: 'transform: scale(1.05);',
                shadow: 'box-shadow: 0 20px 50px rgba(0,0,0,0.2);',
                lift: 'transform: translateY(-5px);',
                glow: 'box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);'
            };
            return effectMap[effect];
        }).join(' ');

        const ctaStyles = {
            solid: `background: ${design.primaryColor}; color: white; border: none;`,
            outline: `background: transparent; color: ${design.primaryColor}; border: 2px solid ${design.primaryColor};`,
            gradient: `background: linear-gradient(135deg, ${design.primaryColor}, ${design.accentColor}); color: white; border: none;`
        };

        const ctaSizes = {
            small: 'padding: 0.75rem 1.5rem; font-size: 0.9rem;',
            medium: 'padding: 1rem 2rem; font-size: 1rem;',
            large: 'padding: 1.25rem 3rem; font-size: 1.125rem;'
        };

        const sectorInfo = sectorContext[content.sector] || { keywords: '', vibe: 'professionnel' };

        const prompt = `Tu es un expert en design web et développement frontend. Génère une landing page HTML complète, moderne et performante.

## INFORMATIONS CLIENT
Entreprise: ${content.companyName || 'Mon Entreprise'}
Secteur: ${content.sector || 'professionnel'} (${sectorInfo.keywords})
Tagline: ${content.tagline || 'Votre message clé'}
Ton: ${content.tone}
Vibe recherchée: ${sectorInfo.vibe}
${content.description ? `Brief: ${content.description}` : ''}

## STRUCTURE (${structure.sectionsCount} sections)
Layout: ${layoutInstructions[structure.layout]}
Sections requises: ${structure.sections.join(', ')}

Chaque section doit être:
- Responsive (mobile-first)
- Avec un padding vertical de 80-120px
- Séparées visuellement

## DESIGN & COULEURS
Style: ${styleGuide[design.style]}
Palette: ${design.palette}
- Couleur principale: ${design.primaryColor}
- Couleur secondaire: ${design.secondaryColor}
- Couleur accent: ${design.accentColor}

Background: ${design.background === 'gradient' ? `linear-gradient(135deg, ${design.primaryColor}20, ${design.accentColor}20)` : design.background === 'pattern' ? 'avec motif subtil SVG' : design.primaryColor + '05'}

Utiliser ces couleurs de manière cohérente:
- Titres: couleur principale ou dégradé
- CTA: couleur principale
- Accents: couleur accent
- Hover states: variations des couleurs

## TYPOGRAPHIE
Police: ${typography.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- H1: ${typography.h1Size}px, weight ${typography.headingWeight}, line-height ${typography.lineHeight}, letter-spacing ${typography.letterSpacing}px
- H2: ${typography.h1Size * 0.7}px
- H3: ${typography.h1Size * 0.5}px
- Body: 16-18px, line-height 1.6

Importer la police depuis Google Fonts dans le <head>.

## ANIMATIONS & INTERACTIONS
Animations CSS (créer @keyframes):
${animationsCSS}

Effets hover sur les boutons et cards:
${hoverEffectsCSS}
transition: all 0.3s ease;

${animations.parallax ? 'Ajouter effet parallax subtil avec transform: translateY() sur scroll (CSS pur)' : ''}

Délais d'animation échelonnés (animation-delay: 0.1s, 0.2s, 0.3s...) pour effet cascade

## CALL-TO-ACTION
Objectif: ${cta.objective}
Texte principal: "${cta.text}"
Style du bouton:
${ctaStyles[cta.style]}
${ctaSizes[cta.size]}
border-radius: 12px;
cursor: pointer;
font-weight: 600;

Placer des CTA:
- Dans le hero (principal)
- En fin de page (secondaire)
- Éventuellement entre sections

${cta.trustElements.includes('testimonials') ? 'Ajouter 2-3 témoignages clients avec étoiles et photos' : ''}
${cta.trustElements.includes('guarantees') ? 'Ajouter badge "Satisfait ou Remboursé"' : ''}
${cta.trustElements.includes('socialProof') ? 'Ajouter preuve sociale (ex: "+500 clients satisfaits")' : ''}
${cta.trustElements.includes('security') ? 'Ajouter badges de sécurité (paiement sécurisé, SSL)' : ''}

## SECTIONS DÉTAILLÉES

### Hero Section
- Titre percutant avec le tagline
- Sous-titre expliquant la proposition de valeur
- CTA principal visible
- Image/illustration hero de qualité (utiliser Pexels si approprié)
- Possiblement stats ou badges de confiance

${structure.sections.includes('features') ? `### Features Section
- 3 à 6 avantages principaux
- Icônes ou émojis pertinents
- Descriptions concises et impactantes
- Layout en grid moderne` : ''}

${structure.sections.includes('testimonials') ? `### Testimonials
- 3 témoignages authentiques
- Avec noms, fonctions, et note étoilée
- Photos en rond ou cards élégantes` : ''}

${structure.sections.includes('pricing') ? `### Pricing
- 2-3 options tarifaires claires
- Mise en avant de l'option recommandée
- Liste des fonctionnalités incluses` : ''}

${structure.sections.includes('faq') ? `### FAQ
- 5-7 questions fréquentes
- Format accordéon ou liste
- Réponses rassurantes` : ''}

${structure.sections.includes('team') ? `### Team
- 3-4 membres de l'équipe
- Photos professionnelles
- Noms, rôles, et brève bio` : ''}

${structure.sections.includes('portfolio') ? `### Portfolio
- 3-6 projets/réalisations
- Images de qualité
- Descriptions courtes` : ''}

${structure.sections.includes('contact') ? `### Contact
- Formulaire simple (nom, email, message)
- Coordonnées visibles
- Éventuellement carte ou localisation` : ''}

## CONTRAINTES TECHNIQUES
- HTML5 sémantique valide
- CSS inline dans <style> en début de document
- Pas de JavaScript (sauf animations CSS pures)
- Mobile-first responsive (breakpoints: 768px, 1024px, 1280px)
- Performance: max-width sur conteneurs, optimisation images
- Accessibilité: alt texts, contraste, focus states
- Pas de liens externes sauf polices et images Pexels

## OPTIMISATIONS CONVERSION
- Hiérarchie visuelle claire guidant vers le CTA
- Messages orientés bénéfices client (pas features techniques)
- Urgence subtile si approprié ("Offre limitée", "Places disponibles")
- Réassurance et preuves sociales
- Copy persuasif et orienté action

RETOURNE UNIQUEMENT LE CODE HTML COMPLET, sans balises markdown, sans explications. Le code doit être production-ready et optimisé pour maximiser les conversions.`;

        return prompt;
    }

    async generateLandingPage() {
        const btn = document.getElementById('generateBtn');
        const btnText = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.loader');
        const previewContent = document.getElementById('previewContent');

        if (!this.config.content.sector || !this.config.content.companyName) {
            alert('Veuillez remplir au minimum le secteur et le nom de l\'entreprise');
            return;
        }

        btn.classList.add('loading');
        btn.disabled = true;
        btnText.style.opacity = '0';
        loader.style.display = 'block';

        previewContent.innerHTML = `
            <div class="preview-placeholder">
                <div class="loader"></div>
                <p style="margin-top: 1rem;">Génération en cours...<br>Cela peut prendre 20-30 secondes</p>
            </div>
        `;

        try {
            const prompt = this.buildOptimizedPrompt();

            const response = await fetch('/api/generate-landing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sector: this.config.content.sector,
                    objective: this.config.cta.objective,
                    style: this.config.design.style,
                    companyName: this.config.content.companyName,
                    tagline: this.config.content.tagline,
                    customPrompt: prompt
                })
            });

            const data = await response.json();

            if (data.success) {
                previewContent.innerHTML = data.html;

                const blob = new Blob([data.html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = `${this.config.content.companyName.replace(/\s+/g, '-').toLowerCase()}-landing-page.html`;

                const downloadBtn = document.createElement('button');
                downloadBtn.textContent = '📥 Télécharger la Page';
                downloadBtn.className = 'btn-secondary';
                downloadBtn.style.marginTop = '1rem';
                downloadBtn.onclick = () => downloadLink.click();

                document.querySelector('.config-actions').appendChild(downloadBtn);
            } else {
                throw new Error(data.error || 'Erreur de génération');
            }

        } catch (error) {
            console.error('Erreur:', error);
            previewContent.innerHTML = `
                <div class="preview-placeholder">
                    <p style="color: #EF4444;">❌ Erreur lors de la génération</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">${error.message}</p>
                </div>
            `;
        } finally {
            btn.classList.remove('loading');
            btn.disabled = false;
            btnText.style.opacity = '1';
            loader.style.display = 'none';
        }
    }

    async saveConfiguration() {
        const configName = prompt('Nom de cette configuration:');

        if (!configName) {
            return;
        }

        try {
            const response = await fetch('/api/save-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: configName,
                    config: this.config,
                    userId: localStorage.getItem('userId') || 'anonymous'
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Configuration sauvegardée avec succès!');

                const savedConfigs = JSON.parse(localStorage.getItem('landingConfigs') || '[]');
                savedConfigs.push({
                    id: data.configId,
                    name: configName,
                    date: new Date().toISOString(),
                    config: this.config
                });
                localStorage.setItem('landingConfigs', JSON.stringify(savedConfigs));
            } else {
                throw new Error(data.error);
            }

        } catch (error) {
            console.error('Erreur sauvegarde:', error);

            const savedConfigs = JSON.parse(localStorage.getItem('landingConfigs') || '[]');
            savedConfigs.push({
                name: configName,
                date: new Date().toISOString(),
                config: this.config
            });
            localStorage.setItem('landingConfigs', JSON.stringify(savedConfigs));
            alert('Configuration sauvegardée localement (hors ligne)');
        }
    }

    async loadConfiguration() {
        const savedConfigs = JSON.parse(localStorage.getItem('landingConfigs') || '[]');

        if (savedConfigs.length === 0) {
            alert('Aucune configuration sauvegardée');
            return;
        }

        const configList = savedConfigs.map((c, i) =>
            `${i + 1}. ${c.name} (${new Date(c.date).toLocaleDateString()})`
        ).join('\n');

        const choice = prompt(`Configurations sauvegardées:\n${configList}\n\nNuméro à charger:`);

        if (choice && savedConfigs[parseInt(choice) - 1]) {
            const selectedConfig = savedConfigs[parseInt(choice) - 1];

            if (selectedConfig.id) {
                try {
                    const response = await fetch(`/api/configs/${selectedConfig.id}`);
                    const data = await response.json();

                    if (data.success) {
                        const { structure, design, typography, animations, content, cta } = data.config;
                        this.config = { structure, design, typography, animations, content, cta };
                    } else {
                        this.config = selectedConfig.config;
                    }
                } catch (error) {
                    console.error('Erreur chargement distant:', error);
                    this.config = selectedConfig.config;
                }
            } else {
                this.config = selectedConfig.config;
            }

            this.loadConfigToForm();
            alert('Configuration chargée!');
        }
    }

    loadConfigToForm() {
        document.getElementById('sectionsCount').value = this.config.structure.sectionsCount;
        document.getElementById('sectionsCountValue').textContent = this.config.structure.sectionsCount;

        document.getElementById('sector').value = this.config.content.sector;
        document.getElementById('companyName').value = this.config.content.companyName;
        document.getElementById('tagline').value = this.config.content.tagline;
        document.getElementById('ctaText').value = this.config.cta.text;

        this.updateProgress();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LandingPageConfigurator();
});
