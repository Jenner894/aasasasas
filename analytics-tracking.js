/**
 * Script de suivi avancé pour Google Analytics 4
 * Collecte des données détaillées pour Looker Studio
 */

// Configuration des événements personnalisés
class AnalyticsTracker {
    constructor() {
        this.startTime = Date.now();
        this.scrollDepth = 0;
        this.maxScrollDepth = 0;
        this.init();
    }

    init() {
        this.trackPageView();
        this.trackScrollDepth();
        this.trackCTAClicks();
        this.trackFormInteractions();
        this.trackTimeOnPage();
        this.trackErrors();
        this.trackExternalLinks();
        this.trackVideoInteractions();
    }

    // Suivi des vues de pages avec métadonnées
    trackPageView() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                'page_title': document.title,
                'page_location': window.location.href,
                'page_path': window.location.pathname,
                'content_group1': this.getPageCategory(),
                'custom_parameter_1': this.getDeviceType(),
                'custom_parameter_2': this.getConnectionSpeed()
            });
        }
    }

    // Suivi de la profondeur de scroll
    trackScrollDepth() {
        let scrollMilestones = [25, 50, 75, 90, 100];
        let trackedMilestones = [];

        window.addEventListener('scroll', () => {
            let scrollTop = window.pageYOffset;
            let docHeight = document.body.scrollHeight - window.innerHeight;
            let scrollPercent = Math.round((scrollTop / docHeight) * 100);

            scrollMilestones.forEach(milestone => {
                if (scrollPercent >= milestone && !trackedMilestones.includes(milestone)) {
                    trackedMilestones.push(milestone);
                    this.trackEvent('scroll_depth', {
                        'event_category': 'engagement',
                        'value': milestone,
                        'page_location': window.location.href
                    });
                }
            });
        });
    }

    // Suivi des clics sur les CTA
    trackCTAClicks() {
        const ctaSelectors = [
            '.btn-primary',
            '.btn-devis-nav',
            '.mobile-devis-btn',
            '.sortlist-hero-btn',
            '.whatsapp-btn'
        ];

        ctaSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.addEventListener('click', (e) => {
                    this.trackEvent('cta_click', {
                        'event_category': 'engagement',
                        'event_label': this.getElementText(element),
                        'button_position': this.getElementPosition(element),
                        'page_section': this.getElementSection(element)
                    });
                });
            });
        });
    }

    // Suivi des interactions avec les formulaires
    trackFormInteractions() {
        // Suivi de l'ouverture du formulaire de devis
        const devisForm = document.getElementById('quoteForm');
        if (devisForm) {
            devisForm.addEventListener('submit', (e) => {
                this.trackEvent('form_submit', {
                    'event_category': 'conversion',
                    'event_label': 'devis_request',
                    'form_name': 'quote_form',
                    'form_step': this.getCurrentFormStep()
                });
            });

            // Suivi des étapes du formulaire
            const formSteps = document.querySelectorAll('.form-step');
            formSteps.forEach((step, index) => {
                if (step.classList.contains('active')) {
                    this.trackEvent('form_step_view', {
                        'event_category': 'engagement',
                        'event_label': `step_${index + 1}`,
                        'step_number': index + 1
                    });
                }
            });
        }

        // Suivi des champs de formulaire
        document.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('focus', () => {
                this.trackEvent('form_field_focus', {
                    'event_category': 'engagement',
                    'event_label': field.name || field.id,
                    'field_type': field.type
                });
            });
        });
    }

    // Suivi du temps passé sur la page
    trackTimeOnPage() {
        const timeIntervals = [30, 60, 120, 300, 600]; // secondes
        let trackedIntervals = [];

        timeIntervals.forEach(interval => {
            setTimeout(() => {
                if (!trackedIntervals.includes(interval)) {
                    trackedIntervals.push(interval);
                    this.trackEvent('time_on_page', {
                        'event_category': 'engagement',
                        'value': interval,
                        'page_location': window.location.href
                    });
                }
            }, interval * 1000);
        });

        // Suivi du temps total avant de quitter
        window.addEventListener('beforeunload', () => {
            let totalTime = Math.round((Date.now() - this.startTime) / 1000);
            this.trackEvent('page_exit', {
                'event_category': 'engagement',
                'value': totalTime,
                'scroll_depth': this.maxScrollDepth
            });
        });
    }

    // Suivi des erreurs JavaScript
    trackErrors() {
        window.addEventListener('error', (e) => {
            this.trackEvent('javascript_error', {
                'event_category': 'error',
                'event_label': e.message,
                'error_file': e.filename,
                'error_line': e.lineno
            });
        });

        // Suivi des erreurs de ressources
        window.addEventListener('error', (e) => {
            if (e.target !== window) {
                this.trackEvent('resource_error', {
                    'event_category': 'error',
                    'event_label': e.target.src || e.target.href,
                    'resource_type': e.target.tagName
                });
            }
        }, true);
    }

    // Suivi des liens externes
    trackExternalLinks() {
        document.querySelectorAll('a[href^="http"]').forEach(link => {
            if (!link.href.includes(window.location.hostname)) {
                link.addEventListener('click', () => {
                    this.trackEvent('external_link_click', {
                        'event_category': 'outbound',
                        'event_label': link.href,
                        'link_text': link.textContent.trim()
                    });
                });
            }
        });
    }

    // Suivi des interactions vidéo (si présentes)
    trackVideoInteractions() {
        document.querySelectorAll('video').forEach(video => {
            video.addEventListener('play', () => {
                this.trackEvent('video_play', {
                    'event_category': 'engagement',
                    'event_label': video.src
                });
            });

            video.addEventListener('pause', () => {
                this.trackEvent('video_pause', {
                    'event_category': 'engagement',
                    'event_label': video.src
                });
            });
        });
    }

    // Méthodes utilitaires
    trackEvent(eventName, parameters = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, parameters);
        }
    }

    getPageCategory() {
        const path = window.location.pathname;
        if (path === '/') return 'homepage';
        if (path === '/devis') return 'quote_page';
        return 'other';
    }

    getDeviceType() {
        return window.innerWidth < 768 ? 'mobile' : 
               window.innerWidth < 1024 ? 'tablet' : 'desktop';
    }

    getConnectionSpeed() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }

    getElementText(element) {
        return element.textContent.trim().substring(0, 50);
    }

    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight / 2 ? 'above_fold' : 'below_fold';
    }

    getElementSection(element) {
        const sections = ['hero', 'features', 'portfolio', 'booking', 'contact'];
        for (let section of sections) {
            if (element.closest(`#${section}, .${section}`)) {
                return section;
            }
        }
        return 'unknown';
    }

    getCurrentFormStep() {
        const activeStep = document.querySelector('.form-step.active');
        return activeStep ? activeStep.dataset.step : 'unknown';
    }
}

// Initialisation du tracking
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsTracker();
});

// Suivi des performances
if ('performance' in window) {
    window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData && typeof gtag !== 'undefined') {
            gtag('event', 'page_performance', {
                'event_category': 'performance',
                'value': Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                'custom_parameter_1': Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                'custom_parameter_2': Math.round(perfData.responseEnd - perfData.responseStart)
            });
        }
    });
}

// Suivi des erreurs de chargement d'images
document.addEventListener('error', (e) => {
    if (e.target.tagName === 'IMG') {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'image_load_error', {
                'event_category': 'error',
                'event_label': e.target.src
            });
        }
    }
}, true);
