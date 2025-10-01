// Page Loading Animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.6s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});
// Cal.com Integration - Attendre que tout soit chargé
function initCalendar() {
    const calendarContainer = document.getElementById('calendarContainer');
    
    if (calendarContainer && typeof Cal !== 'undefined') {
        // Remplacez "VOTRE_USERNAME/30min" par votre vrai lien Cal.com
        const calLink = "https://cal.com/landingai/15min"; // Ex: "jean-dupont/consultation"
        
        try {
            Cal("inline", {
                elementOrSelector: "#calendarContainer",
                calLink: calLink,
                layout: "month_view",
                config: {
                    theme: "dark"
                }
            });
            
            console.log('✅ Cal.com chargé avec succès');
        } catch (error) {
            console.error('❌ Erreur Cal.com:', error);
        }
    } else if (!calendarContainer) {
        console.warn('⚠️ Container #calendarContainer non trouvé');
    } else {
        console.warn('⚠️ Cal.com pas encore chargé, nouvelle tentative...');
        setTimeout(initCalendar, 500);
    }
}

// Attendre que la page ET Cal.com soient chargés
window.addEventListener('load', function() {
    setTimeout(initCalendar, 1000);
});

// Portfolio Navigation
const portfolioProjects = [
    {
        title: 'Box Club',
        description: 'Landing page premium pour lancement de business de box par abonnement avec animations et copywriting optimisé pour maximiser les conversions.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80',
        tags: ['E-commerce', 'Box par abonnement', 'Animations', 'Copywriting'],
        link: '#',
        testimonial: {
            stars: 5,
            text: '"LandingIA a créé une page qui a transformé notre business. Les conversions ont explosé dès le premier jour de lancement."',
            author: 'Marie Dubois',
            position: 'Fondatrice, Box Club'
        }
    },
    {
        title: 'TechFlow Solutions',
        description: 'Page de présentation moderne pour startup tech avec intégration CRM et analytics avancés. Design épuré et performance optimale pour une expérience utilisateur exceptionnelle.',
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80',
        tags: ['SaaS', 'Tech', 'CRM', 'Analytics'],
        link: '#',
        testimonial: {
            stars: 5,
            text: '"Une équipe professionnelle qui a su comprendre nos besoins. La page reflète parfaitement notre image de marque tech et moderne."',
            author: 'Thomas Laurent',
            position: 'CEO, TechFlow'
        }
    },
    {
        title: 'Excellence Coaching',
        description: 'Landing page élégante pour coach professionnel avec système de réservation intégré. Interface intuitive et design premium qui inspire confiance.',
        image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80',
        tags: ['Coaching', 'Formation', 'Réservation', 'Premium'],
        link: '#',
        testimonial: {
            stars: 5,
            text: '"Résultat au-delà de mes attentes. Mes clients adorent la facilité de réservation et le design professionnel."',
            author: 'Sophie Bernard',
            position: 'Coach Professionnel'
        }
    },
    {
        title: 'Le Gourmet Parisien',
        description: 'Site responsive avec menu interactif et système de réservation en ligne optimisé mobile. Design appétissant qui met en valeur la gastronomie.',
        image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&q=80',
        tags: ['Restaurant', 'Mobile-First', 'Réservation', 'Menu'],
        link: '#',
        testimonial: {
            stars: 5,
            text: '"Notre restaurant a doublé ses réservations en ligne. L\'interface est magnifique et ultra simple à utiliser."',
            author: 'Pierre Fontaine',
            position: 'Chef & Propriétaire'
        }
    },
    {
        title: 'Prestige Immobilier',
        description: 'Landing page luxe pour agence immobilière haut de gamme avec visite virtuelle 3D. Élégance et sophistication pour cibler une clientèle premium.',
        image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
        tags: ['Immobilier', 'Premium', '3D', 'Luxe'],
        link: '#',
        testimonial: {
            stars: 5,
            text: '"La qualité visuelle correspond parfaitement au standing de nos biens. Les visites virtuelles sont un vrai plus."',
            author: 'Isabelle Moreau',
            position: 'Directrice, Prestige Immo'
        }
    },
    {
        title: 'Élégance Mode',
        description: 'Boutique en ligne moderne avec panier optimisé et paiement sécurisé multi-devises. Design fashion qui convertit et fidélise.',
        image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&q=80',
        tags: ['E-commerce', 'Fashion', 'Paiement', 'Design'],
        link: '#',
        testimonial: {
            stars: 5,
            text: '"Notre taux de conversion a triplé. Le design met parfaitement en valeur nos collections et l\'expérience d\'achat est fluide."',
            author: 'Camille Rousseau',
            position: 'Fondatrice, Élégance Mode'
        }
    }
];

let currentPortfolioIndex = 0;

const portfolioImage = document.getElementById('portfolioImage');
const portfolioTitle = document.getElementById('portfolioTitle');
const portfolioDescription = document.getElementById('portfolioDescription');
const portfolioLink = document.getElementById('portfolioLink');
const portfolioTags = document.getElementById('portfolioTags');
const portfolioTestimonial = document.getElementById('portfolioTestimonial');
const portfolioDetails = document.getElementById('portfolioDetails');
const portfolioPrevBtn = document.getElementById('portfolioPrevBtn');
const portfolioNextBtn = document.getElementById('portfolioNextBtn');

function updatePortfolio(index, direction = 'down') {
    const project = portfolioProjects[index];
    
    // Add animation class
    portfolioDetails.style.opacity = '0';
    portfolioDetails.style.transform = direction === 'down' ? 'translateY(20px)' : 'translateY(-20px)';
    
    // Update image with fade
    portfolioImage.style.opacity = '0.5';
    
    setTimeout(() => {
        // Update content
        portfolioImage.src = project.image;
        portfolioImage.alt = project.title;
        portfolioTitle.textContent = project.title;
        portfolioDescription.textContent = project.description;
        portfolioLink.href = project.link;
        
        // Update tags
        portfolioTags.innerHTML = project.tags.map(tag => 
            `<span class="portfolio-badge">${tag}</span>`
        ).join('');
        
        // Update testimonial
        const starsHtml = '★'.repeat(project.testimonial.stars);
        portfolioTestimonial.innerHTML = `
            <div class="testimonial-stars">${starsHtml}</div>
            <p class="testimonial-text">${project.testimonial.text}</p>
            <div class="testimonial-author">
                <strong>${project.testimonial.author}</strong> - ${project.testimonial.position}
            </div>
        `;
        
        // Fade in
        portfolioImage.style.opacity = '1';
        portfolioDetails.style.opacity = '1';
        portfolioDetails.style.transform = 'translateY(0)';
    }, 300);
}

function nextPortfolio() {
    currentPortfolioIndex = (currentPortfolioIndex + 1) % portfolioProjects.length;
    updatePortfolio(currentPortfolioIndex, 'down');
}

function prevPortfolio() {
    currentPortfolioIndex = (currentPortfolioIndex - 1 + portfolioProjects.length) % portfolioProjects.length;
    updatePortfolio(currentPortfolioIndex, 'up');
}

if (portfolioPrevBtn && portfolioNextBtn) {
    portfolioPrevBtn.addEventListener('click', prevPortfolio);
    portfolioNextBtn.addEventListener('click', nextPortfolio);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const portfolioSection = document.getElementById('portfolio');
        if (portfolioSection) {
            const rect = portfolioSection.getBoundingClientRect();
            const isInView = rect.top < window.innerHeight && rect.bottom >= 0;
            
            if (isInView) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    prevPortfolio();
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    nextPortfolio();
                }
            }
        }
    });
    
    // Initialize with first project
    updatePortfolio(0);
}

// Navbar Scroll Effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.padding = '1rem 0';
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
    } else {
        navbar.style.padding = '1.5rem 0';
        navbar.style.background = 'rgba(10, 10, 10, 0.8)';
    }
    
    lastScroll = currentScroll;
});

// Landing Page Generator Form
const landingForm = document.getElementById('landingForm');
const generateBtn = document.getElementById('generateBtn');
const btnText = generateBtn.querySelector('.btn-text');
const loader = generateBtn.querySelector('.loader');
const previewContent = document.getElementById('previewContent');

landingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sector = document.getElementById('sector').value;
    const objective = document.getElementById('objective').value;
    const style = document.getElementById('style').value;
    const companyName = document.getElementById('companyName').value || 'Votre Entreprise';
    const tagline = document.getElementById('tagline').value || 'Votre message clé';
    
    if (!sector || !objective || !style) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    // Show loading state
    btnText.style.display = 'none';
    loader.style.display = 'block';
    generateBtn.disabled = true;
    
    // Simulate AI generation (2 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate preview based on inputs
    const preview = generatePreview(sector, objective, style, companyName, tagline);
    
    // Show preview with animation
    previewContent.style.opacity = '0';
    previewContent.innerHTML = preview;
    
    setTimeout(() => {
        previewContent.style.transition = 'opacity 0.6s ease';
        previewContent.style.opacity = '1';
    }, 100);
    
    // Reset button
    btnText.style.display = 'block';
    loader.style.display = 'none';
    generateBtn.disabled = false;
});

// Generate Preview Function
function generatePreview(sector, objective, style, companyName, tagline) {
    const colors = {
        minimaliste: { primary: '#2d3748', accent: '#4299e1' },
        bold: { primary: '#1a202c', accent: '#f56565' },
        elegant: { primary: '#2c2c2c', accent: '#d4af37' },
        moderne: { primary: '#0f172a', accent: '#8b5cf6' },
        fun: { primary: '#1e293b', accent: '#f59e0b' }
    };
    
    const selectedColors = colors[style] || colors.moderne;
    
    const sectorIcons = {
        restaurant: '🍽️',
        tech: '💻',
        ecommerce: '🛍️',
        immobilier: '🏠',
        sante: '💚',
        coaching: '🎯',
        event: '🎉',
        autre: '✨'
    };
    
    const icon = sectorIcons[sector] || '✨';
    
    return `
        <div style="background: ${selectedColors.primary}; padding: 60px 40px; min-height: 600px; color: white; font-family: system-ui, -apple-system, sans-serif;">
            <div style="max-width: 900px; margin: 0 auto;">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 80px;">
                    <div style="font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 32px;">${icon}</span>
                        ${companyName}
                    </div>
                    <div style="display: flex; gap: 30px; font-size: 14px;">
                        <a href="#" style="color: rgba(255,255,255,0.8); text-decoration: none;">Accueil</a>
                        <a href="#" style="color: rgba(255,255,255,0.8); text-decoration: none;">Services</a>
                        <a href="#" style="color: rgba(255,255,255,0.8); text-decoration: none;">Contact</a>
                    </div>
                </div>
                
                <!-- Hero Section -->
                <div style="text-align: center; margin-bottom: 60px;">
                    <h1 style="font-size: 48px; font-weight: 700; margin-bottom: 24px; line-height: 1.2;">
                        ${tagline}
                    </h1>
                    <p style="font-size: 18px; color: rgba(255,255,255,0.8); margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.6;">
                        ${getObjectiveText(objective)}
                    </p>
                    <button style="background: ${selectedColors.accent}; color: white; padding: 16px 40px; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
                        ${getCtaText(objective)}
                    </button>
                </div>
                
                <!-- Features Grid -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 60px;">
                    ${generateFeatures(sector, selectedColors.accent)}
                </div>
                
                <!-- Footer Note -->
                <div style="text-align: center; margin-top: 60px; padding-top: 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <p style="font-size: 12px; color: rgba(255,255,255,0.5);">
                        ⚡ Ceci est une démo IA • Votre projet final sera 100% personnalisé par nos développeurs
                    </p>
                </div>
            </div>
        </div>
    `;
}

function getObjectiveText(objective) {
    const texts = {
        leads: 'Développez votre clientèle avec une page optimisée pour la capture de leads qualifiés.',
        vente: 'Augmentez vos ventes avec une expérience utilisateur conçue pour convertir.',
        inscription: 'Maximisez les inscriptions à votre événement avec une page attractive.',
        info: 'Présentez votre entreprise de manière professionnelle et engageante.',
        portfolio: 'Mettez en valeur vos réalisations avec un portfolio moderne et impactant.'
    };
    return texts[objective] || 'Transformez vos visiteurs en clients avec une page qui convertit.';
}

function getCtaText(objective) {
    const ctas = {
        leads: 'Obtenir une Démo Gratuite',
        vente: 'Commander Maintenant',
        inscription: 'S\'inscrire à l\'Événement',
        info: 'En Savoir Plus',
        portfolio: 'Voir Mes Réalisations'
    };
    return ctas[objective] || 'Commencer Maintenant';
}

function generateFeatures(sector, accentColor) {
    const features = {
        restaurant: [
            { icon: '📍', title: 'Livraison Rapide', desc: 'Sous 30 minutes' },
            { icon: '👨‍🍳', title: 'Chefs Experts', desc: 'Cuisine gastronomique' },
            { icon: '🌟', title: 'Menu Varié', desc: 'Plus de 50 plats' }
        ],
        tech: [
            { icon: '⚡', title: 'Performance', desc: 'Ultra rapide' },
            { icon: '🔒', title: 'Sécurisé', desc: 'Données protégées' },
            { icon: '📊', title: 'Analytics', desc: 'Tableaux de bord' }
        ],
        ecommerce: [
            { icon: '🚚', title: 'Livraison Offerte', desc: 'Dès 50€ d\'achat' },
            { icon: '💳', title: 'Paiement Sécurisé', desc: 'SSL Certifié' },
            { icon: '↩️', title: 'Retours Gratuits', desc: 'Sous 30 jours' }
        ],
        immobilier: [
            { icon: '🏘️', title: 'Localisation', desc: 'Quartiers premium' },
            { icon: '💎', title: 'Qualité', desc: 'Finitions luxe' },
            { icon: '🔑', title: 'Accompagnement', desc: 'De A à Z' }
        ],
        sante: [
            { icon: '👨‍⚕️', title: 'Experts', desc: 'Professionnels certifiés' },
            { icon: '📅', title: 'Disponibilité', desc: 'RDV sous 48h' },
            { icon: '💚', title: 'Bien-être', desc: 'Approche holistique' }
        ],
        coaching: [
            { icon: '🎯', title: 'Résultats', desc: 'Garantis ou remboursé' },
            { icon: '📈', title: 'Progression', desc: 'Suivi personnalisé' },
            { icon: '🏆', title: 'Succès', desc: '+500 clients satisfaits' }
        ],
        event: [
            { icon: '🎪', title: 'Organisation', desc: 'Clé en main' },
            { icon: '🎭', title: 'Animation', desc: 'Professionnelle' },
            { icon: '📸', title: 'Souvenirs', desc: 'Photos incluses' }
        ],
        autre: [
            { icon: '✨', title: 'Qualité', desc: 'Service premium' },
            { icon: '⚡', title: 'Rapidité', desc: 'Livraison express' },
            { icon: '🤝', title: 'Support', desc: 'Disponible 24/7' }
        ]
    };
    
    const sectorFeatures = features[sector] || features.autre;
    
    return sectorFeatures.map(feature => `
        <div style="background: rgba(255,255,255,0.05); padding: 30px 24px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
            <div style="font-size: 40px; margin-bottom: 16px;">${feature.icon}</div>
            <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: ${accentColor};">${feature.title}</h3>
            <p style="font-size: 14px; color: rgba(255,255,255,0.7); margin: 0;">${feature.desc}</p>
        </div>
    `).join('');
}

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Envoi en cours...';
        submitBtn.disabled = true;
        
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        submitBtn.textContent = '✓ Message envoyé !';
        submitBtn.style.background = '#10b981';
        
        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.style.background = '';
            submitBtn.disabled = false;
            contactForm.reset();
        }, 3000);
    });
}

// Intersection Observer for Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.feature-card, .pricing-card, .portfolio-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
});

// Scroll to Top Button
let scrollTopBtn = document.createElement('button');
scrollTopBtn.innerHTML = '↑';
scrollTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--color-accent);
    color: white;
    border: none;
    font-size: 20px;
    cursor: pointer;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
`;

document.body.appendChild(scrollTopBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
        scrollTopBtn.style.opacity = '1';
        scrollTopBtn.style.pointerEvents = 'all';
    } else {
        scrollTopBtn.style.opacity = '0';
        scrollTopBtn.style.pointerEvents = 'none';
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

console.log('🚀 LandingIA chargé avec succès!');
