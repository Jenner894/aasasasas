/**
 * CMS Content Loader
 * Charge dynamiquement le contenu depuis les fichiers JSON
 */

class CMSLoader {
    constructor() {
        this.content = {};
        this.loaded = false;
    }

    async loadContent() {
        if (this.loaded) return this.content;

        try {
            const contentFiles = [
                'site-config',
                'hero',
                'performance',
                'portfolio',
                'booking',
                'footer',
                'navigation',
                'quote-page'
            ];

            const loadPromises = contentFiles.map(async (file) => {
                try {
                    const response = await fetch(`/content/${file}.json`);
                    if (response.ok) {
                        const data = await response.json();
                        return { file, data };
                    }
                } catch (error) {
                    console.warn(`Impossible de charger ${file}.json:`, error);
                }
                return null;
            });

            const results = await Promise.all(loadPromises);
            
            results.forEach(result => {
                if (result) {
                    this.content[result.file] = result.data;
                }
            });

            this.loaded = true;
            console.log('Contenu CMS chargé:', this.content);
            return this.content;
        } catch (error) {
            console.error('Erreur lors du chargement du contenu CMS:', error);
            return {};
        }
    }

    getContent(section, key = null) {
        if (!this.loaded) {
            console.warn('Contenu CMS pas encore chargé');
            return null;
        }

        if (key) {
            return this.content[section]?.[key] || null;
        }
        return this.content[section] || null;
    }

    // Méthodes utilitaires pour remplacer le contenu
    replaceTextContent(selector, text) {
        const element = document.querySelector(selector);
        if (element && text) {
            element.textContent = text;
        }
    }

    replaceHTMLContent(selector, html) {
        const element = document.querySelector(selector);
        if (element && html) {
            element.innerHTML = html;
        }
    }

    replaceAttribute(selector, attribute, value) {
        const element = document.querySelector(selector);
        if (element && value) {
            element.setAttribute(attribute, value);
        }
    }

    // Charger et appliquer le contenu de la page d'accueil
    async loadHomePage() {
        await this.loadContent();
        
        // Configuration générale
        const siteConfig = this.getContent('site-config');
        if (siteConfig) {
            document.title = siteConfig.site_name + ' - ' + siteConfig.description;
            this.replaceAttribute('meta[name="description"]', 'content', siteConfig.description);
            this.replaceAttribute('meta[name="keywords"]', 'content', siteConfig.keywords);
            this.replaceAttribute('meta[name="theme-color"]', 'content', siteConfig.theme_color);
        }

        // Section Hero
        const hero = this.getContent('hero');
        if (hero) {
            this.replaceTextContent('.hero-title', `${hero.main_title} <span class="gradient-text">${hero.highlight_text}</span> The Future of Digital`);
            this.replaceTextContent('.hero-subtitle', hero.subtitle);
            this.replaceTextContent('.hero-cta .btn-primary', hero.cta_text);
            this.replaceAttribute('.hero-cta .btn-primary', 'href', hero.cta_link);

            // Statistiques
            if (hero.stats) {
                hero.stats.forEach((stat, index) => {
                    const statElement = document.querySelectorAll('.stat')[index];
                    if (statElement) {
                        const numberElement = statElement.querySelector('.stat-number');
                        const labelElement = statElement.querySelector('.stat-label');
                        if (numberElement) numberElement.textContent = stat.value;
                        if (labelElement) labelElement.textContent = stat.label;
                    }
                });
            }

            // Témoignages
            if (hero.testimonials) {
                const reviewItems = document.querySelectorAll('.review-item');
                hero.testimonials.forEach((testimonial, index) => {
                    if (reviewItems[index]) {
                        const starsElement = reviewItems[index].querySelector('.review-stars');
                        const textElement = reviewItems[index].querySelector('p');
                        if (starsElement) starsElement.textContent = testimonial.stars;
                        if (textElement) textElement.textContent = testimonial.text;
                    }
                });
            }
        }

        // Section Performance
        const performance = this.getContent('performance');
        if (performance) {
            this.replaceTextContent('#performance .section-title', performance.section_title);
            this.replaceTextContent('#chartTitle', performance.chart_title);
            this.replaceTextContent('#chartDesc', performance.chart_description);
            this.replaceTextContent('#badgeText', performance.increase_percentage);

            // Cartes de performance
            if (performance.performance_cards) {
                const cardElements = document.querySelectorAll('.perf-vision-card');
                performance.performance_cards.forEach((card, index) => {
                    if (cardElements[index]) {
                        const titleElement = cardElements[index].querySelector('h4');
                        const descElement = cardElements[index].querySelector('p');
                        if (titleElement) titleElement.textContent = card.title;
                        if (descElement) descElement.textContent = card.description;
                    }
                });
            }

            // Statistiques de performance
            if (performance.performance_stats) {
                const statElements = document.querySelectorAll('.perf-stat');
                performance.performance_stats.forEach((stat, index) => {
                    if (statElements[index]) {
                        const labelElement = statElements[index].querySelector('h5');
                        const valueElement = statElements[index].querySelector('.perf-stat-value');
                        if (labelElement) labelElement.textContent = stat.label;
                        if (valueElement) valueElement.textContent = stat.value;
                    }
                });
            }
        }

        // Section Portfolio
        const portfolio = this.getContent('portfolio');
        if (portfolio) {
            this.replaceTextContent('#portfolio .section-title', portfolio.section_title);
            this.replaceTextContent('#portfolio .section-subtitle', portfolio.section_subtitle);

            if (portfolio.projects && portfolio.projects.length > 0) {
                const project = portfolio.projects[0];
                this.replaceTextContent('#portfolioTitle', project.title);
                this.replaceTextContent('#portfolioDescription', project.description);
                this.replaceAttribute('#portfolioImage', 'src', project.image);
                this.replaceAttribute('#portfolioLink', 'href', project.link);

                // Tags
                if (project.tags) {
                    const tagsContainer = document.querySelector('#portfolioTags');
                    if (tagsContainer) {
                        tagsContainer.innerHTML = project.tags.map(tag => 
                            `<span class="portfolio-badge">${tag}</span>`
                        ).join('');
                    }
                }

                // Témoignage
                if (project.testimonial) {
                    this.replaceTextContent('.testimonial-stars', project.testimonial.stars);
                    this.replaceTextContent('.testimonial-text', project.testimonial.text);
                    this.replaceTextContent('.testimonial-author', project.testimonial.author);
                }
            }

            this.replaceTextContent('.portfolio-cta p', portfolio.cta_text);
            this.replaceAttribute('.portfolio-cta .btn-primary', 'href', portfolio.cta_link);
        }

        // Section Booking
        const booking = this.getContent('booking');
        if (booking) {
            this.replaceTextContent('#booking .section-title', booking.section_title);
            this.replaceTextContent('#booking .section-subtitle', booking.section_subtitle);

            // Avantages
            if (booking.benefits) {
                const benefitElements = document.querySelectorAll('.booking-benefit');
                booking.benefits.forEach((benefit, index) => {
                    if (benefitElements[index]) {
                        const titleElement = benefitElements[index].querySelector('h4');
                        const descElement = benefitElements[index].querySelector('p');
                        if (titleElement) titleElement.textContent = benefit.title;
                        if (descElement) descElement.textContent = benefit.description;
                    }
                });
            }

            // URL du calendrier
            if (booking.calendar_url) {
                const iframe = document.querySelector('#booking iframe');
                if (iframe) {
                    iframe.src = booking.calendar_url;
                }
            }
        }

        // Footer
        const footer = this.getContent('footer');
        if (footer) {
            this.replaceTextContent('.footer-bottom', footer.copyright);
        }

        // Navigation
        const navigation = this.getContent('navigation');
        if (navigation) {
            // Liens du menu
            if (navigation.menu_links) {
                const navLinks = document.querySelectorAll('.nav-links li a');
                navigation.menu_links.forEach((link, index) => {
                    if (navLinks[index]) {
                        navLinks[index].textContent = link.text;
                        navLinks[index].href = link.url;
                    }
                });
            }

            // Bouton devis
            this.replaceTextContent('.btn-devis-nav', navigation.quote_button_text);
            this.replaceAttribute('.btn-devis-nav', 'href', navigation.quote_button_link);
        }
    }

    // Charger et appliquer le contenu de la page devis
    async loadQuotePage() {
        await this.loadContent();
        
        const quotePage = this.getContent('quote-page');
        if (quotePage) {
            this.replaceTextContent('.section-title', `Simulez Votre <span class="gradient-text">Devis</span>`);
            this.replaceTextContent('.section-subtitle', quotePage.subtitle);
            this.replaceTextContent('.summary-note', quotePage.pricing_note);
        }
    }
}

// Initialiser le CMS Loader
const cmsLoader = new CMSLoader();

// Charger le contenu selon la page
document.addEventListener('DOMContentLoaded', async () => {
    const currentPath = window.location.pathname;
    
    if (currentPath === '/devis' || currentPath.endsWith('/devis.html')) {
        await cmsLoader.loadQuotePage();
    } else {
        await cmsLoader.loadHomePage();
    }
});

// Exposer globalement pour debug
window.cmsLoader = cmsLoader;
