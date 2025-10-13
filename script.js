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
            
            // Track navigation clicks in GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'navigation_click', {
                    'link_text': this.textContent.trim(),
                    'link_url': this.getAttribute('href')
                });
            }
        }
    });
});
// ============================================
// PERFORMANCE STATS ANIMATED COUNTERS
// ============================================

function animatePerfCounter(element, target, prefix = '', suffix = '') {
    let current = 0;
    const increment = target / 100;
    const duration = 2000;
    const stepTime = duration / 100;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = prefix + target.toLocaleString('fr-FR') + suffix;
            clearInterval(timer);
        } else {
            element.textContent = prefix + Math.floor(current).toLocaleString('fr-FR') + suffix;
        }
    }, stepTime);
}

const perfStatsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('perf-counted')) {
            entry.target.classList.add('perf-counted');
            
            const perfStatValues = entry.target.querySelectorAll('.perf-stat-value');
            perfStatValues.forEach((stat, index) => {
                setTimeout(() => {
                    const text = stat.textContent.trim();
                    let target, prefix = '', suffix = '';
                    
                    // Pages créées: +390
                    if (text.includes('+') && !text.includes('%') && !text.includes('€')) {
                        prefix = '+';
                        target = 390;
                    }
                    // Augmentation conversion: ≈ +25%
                    else if (text.includes('%')) {
                        prefix = '≈ +';
                        suffix = '%';
                        target = 25;
                    }
                    // CA total: +25,000,000€
                    else if (text.includes('€')) {
                        prefix = '+';
                        suffix = '€';
                        target = 25000000;
                    }
                    
                    stat.textContent = prefix + '0' + suffix;
                    animatePerfCounter(stat, target, prefix, suffix);
                }, index * 200);
            });
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
    const perfStats = document.querySelector('.performance-stats');
    if (perfStats) {
        perfStatsObserver.observe(perfStats);
    }
});
// ============================================
// PERFORMANCE CARDS CAROUSEL (MOBILE)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const perfCardsContainer = document.getElementById('perfCardsContainer');
    const perfCardsWrapper = document.getElementById('perfCardsWrapper');

    if (perfCardsContainer && perfCardsWrapper && window.innerWidth <= 767) {
        const cards = perfCardsWrapper.children;
        const cardsArray = Array.from(cards);

        cardsArray.forEach(card => {
            const clone = card.cloneNode(true);
            perfCardsWrapper.appendChild(clone);
        });

        perfCardsContainer.addEventListener('touchstart', () => {
            perfCardsWrapper.classList.add('paused');
        });

        perfCardsContainer.addEventListener('touchend', () => {
            perfCardsWrapper.classList.remove('paused');
        });
    }

    window.addEventListener('resize', () => {
        const wrapper = document.getElementById('perfCardsWrapper');
        if (wrapper && window.innerWidth > 767) {
            const cards = wrapper.querySelectorAll('.perf-brand-card, .perf-vision-card');
            if (cards.length > 4) {
                cards.forEach((card, index) => {
                    if (index >= 4) {
                        card.remove();
                    }
                });
            }
        }
    });
});

// ============================================
// ANIMATED PERFORMANCE CHARTS CAROUSEL
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const chartCanvas = document.getElementById('performanceChart');
    
    if (!chartCanvas) return;
    
    let currentChart = null;
    let currentChartIndex = 0;
    
    const chartsData = [
        {
            badge: '+74%',
            title: 'Augmente ton trafic sans limite',
            description: 'Une collaboration sur mesure pour t\'accompagner dans l\'atteinte de tes objectifs digitaux.',
            data: [50, 65, 70, 85, 95, 120, 140, 165, 195, 230, 270, 300],
            color: '#10b981'
        },
        {
            badge: '+156%',
            title: 'Multiplie tes conversions',
            description: 'Transforme tes visiteurs en clients grâce à des landing pages optimisées pour la conversion.',
            data: [30, 42, 58, 75, 95, 118, 145, 180, 220, 265, 320, 380],
            color: '#8b5cf6'
        },
        {
            badge: '-89%',
            title: 'Réduis ton temps de chargement',
            description: 'Des pages ultra-rapides qui améliorent ton SEO et l\'expérience utilisateur de façon significative.',
            data: [100, 95, 88, 82, 75, 68, 58, 48, 38, 28, 18, 11],
            color: '#f59e0b'
        }
    ];
    
    function createChart(index) {
        const chartInfo = chartsData[index];
        const ctx = chartCanvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 280);
        gradient.addColorStop(0, `${chartInfo.color}4D`);
        gradient.addColorStop(1, `${chartInfo.color}00`);
        
        if (currentChart) {
            currentChart.destroy();
        }
        
        currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
                datasets: [{
                    data: chartInfo.data,
                    borderColor: chartInfo.color,
                    backgroundColor: gradient,
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: chartInfo.color,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 10, 10, 0.95)',
                        titleColor: chartInfo.color,
                        bodyColor: '#fff',
                        borderColor: `${chartInfo.color}4D`,
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return index === 2 ? context.parsed.y + 'ms' : context.parsed.y + 'k€';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.03)',
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.4)',
                            font: { size: 11 },
                            callback: function(value) {
                                return index === 2 ? value + 'ms' : value + 'k€';
                            }
                        },
                        border: { display: false }
                    },
                    x: {
                        display: false,
                        grid: { display: false }
                    }
                }
            }
        });
    }
    
    function animateChartTransition(index) {
        const chartBadge = document.getElementById('chartBadge');
        const badgeText = document.getElementById('badgeText');
        const chartTitle = document.getElementById('chartTitle');
        const chartDesc = document.getElementById('chartDesc');
        
        // Fade out
        chartCanvas.style.opacity = '0';
        if (chartBadge) chartBadge.style.opacity = '0';
        if (chartTitle && chartTitle.parentElement) chartTitle.parentElement.style.opacity = '0';
        if (chartDesc) chartDesc.style.opacity = '0';
        
        setTimeout(() => {
            const chartInfo = chartsData[index];
            
            // Update content
            if (badgeText) badgeText.textContent = chartInfo.badge;
            if (chartTitle) chartTitle.textContent = chartInfo.title;
            if (chartDesc) chartDesc.textContent = chartInfo.description;
            
            // Update badge color
            if (chartBadge) {
                const badgeIcon = chartBadge.querySelector('path');
                if (badgeIcon) badgeIcon.setAttribute('stroke', chartInfo.color);
                chartBadge.style.background = `${chartInfo.color}26`;
                chartBadge.style.borderColor = `${chartInfo.color}4D`;
                if (badgeText) badgeText.style.color = chartInfo.color;
            }
            
            // Update title icon color
            if (chartTitle && chartTitle.parentElement) {
                const titleIcon = chartTitle.parentElement.querySelector('path');
                if (titleIcon) titleIcon.setAttribute('stroke', chartInfo.color);
            }
            
            // Create new chart
            createChart(index);
            
            // Fade in
            setTimeout(() => {
                chartCanvas.style.transition = 'opacity 0.8s ease';
                if (chartBadge) chartBadge.style.transition = 'opacity 0.8s ease';
                if (chartTitle && chartTitle.parentElement) chartTitle.parentElement.style.transition = 'opacity 0.8s ease';
                if (chartDesc) chartDesc.style.transition = 'opacity 0.8s ease';
                
                chartCanvas.style.opacity = '1';
                if (chartBadge) chartBadge.style.opacity = '1';
                if (chartTitle && chartTitle.parentElement) chartTitle.parentElement.style.opacity = '1';
                if (chartDesc) chartDesc.style.opacity = '1';
            }, 100);
        }, 600);
    }
    
    function startChartCarousel() {
        setInterval(() => {
            currentChartIndex = (currentChartIndex + 1) % chartsData.length;
            animateChartTransition(currentChartIndex);
        }, 4000);
    }
    
    // Initialize first chart
    createChart(0);
    
    // Start carousel
    setTimeout(startChartCarousel, 4000);
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuItems = document.querySelectorAll('.mobile-menu-item a, .mobile-menu-cta a');
    
    if (!menuToggle || !mobileMenu) return;
    
    // Toggle menu
    menuToggle.addEventListener('click', () => {
        const isActive = menuToggle.classList.contains('active');
        
        if (isActive) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Gestion des dropdowns mobiles
    const mobileMenuTriggers = document.querySelectorAll('.mobile-menu-trigger');
    mobileMenuTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const menuItem = trigger.closest('.mobile-menu-item');
            const isExpanded = menuItem.classList.contains('expanded');
            
            // Fermer tous les autres menus
            document.querySelectorAll('.mobile-menu-item.expanded').forEach(item => {
                if (item !== menuItem) {
                    item.classList.remove('expanded');
                }
            });
            
            // Toggle le menu actuel
            menuItem.classList.toggle('expanded');
        });
    });
    
    // Fermer le menu au clic sur un lien (sauf les triggers de dropdown)
    mobileMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Ne fermer que si ce n'est pas un trigger de dropdown
            if (!item.closest('.mobile-menu-trigger')) {
                closeMenu();
            }
        });
    });
    
    // Fermer le menu au clic sur un lien de sous-menu
    const submenuLinks = document.querySelectorAll('.mobile-submenu a');
    submenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });
    
    // Fermer au clic en dehors
    mobileMenu.addEventListener('click', (e) => {
        if (e.target === mobileMenu) {
            closeMenu();
        }
    });
    
    // Fermer avec la touche Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuToggle.classList.contains('active')) {
            closeMenu();
        }
    });
    
    function openMenu() {
        menuToggle.classList.add('active');
        mobileMenu.classList.add('active');
        document.body.classList.add('menu-open');
    }
    
    function closeMenu() {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
        // Fermer tous les sous-menus
        document.querySelectorAll('.mobile-menu-item.expanded').forEach(item => {
            item.classList.remove('expanded');
        });
    }
});

// ============================================
// NAVIGATION ACTIVE STATE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('section[id]');
    
    // Fonction pour mettre à jour l'état actif
    function updateActiveNav() {
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop - 150) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    // Mettre à jour au scroll
    window.addEventListener('scroll', updateActiveNav);
    
    // Mettre à jour au chargement
    updateActiveNav();
});
// ============================================
// REVIEWS CAROUSEL
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const reviewItems = document.querySelectorAll('.review-item');
    let currentReviewIndex = 0;

    function showNextReview() {
        // Retirer la classe active de la review actuelle
        reviewItems[currentReviewIndex].classList.remove('active');
        
        // Passer à la review suivante
        currentReviewIndex = (currentReviewIndex + 1) % reviewItems.length;
        
        // Ajouter la classe active à la nouvelle review
        reviewItems[currentReviewIndex].classList.add('active');
    }

    // Changer de review toutes les 4 secondes
    if (reviewItems.length > 0) {
        setInterval(showNextReview, 4000);
    }
});

// ============================================
// ANIMATED COUNTERS FOR STATS
// ============================================

function animateCounter(element, target, suffix = '') {
    let current = 0;
    const increment = target / 100;
    const duration = 2000;
    const stepTime = duration / 100;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + suffix;
        }
    }, stepTime);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach((stat, index) => {
                const target = parseInt(stat.getAttribute('data-target'));
                let suffix = '';
                
                if (index === 0) suffix = '+';
                if (index === 1) suffix = '%';
                if (index === 2) suffix = 'h';
                
                setTimeout(() => {
                    animateCounter(stat, target, suffix);
                }, index * 200);
            });
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
});
// Tags Carousel Enhancement (optionnel)
document.addEventListener('DOMContentLoaded', () => {
    const tagsCarousel = document.querySelector('.tags-carousel');
    const tagsTrack = document.querySelector('.tags-track');
    
    if (tagsCarousel && tagsTrack) {
        // Clone les tags pour une boucle vraiment infinie
        const tags = tagsTrack.innerHTML;
        tagsTrack.innerHTML = tags + tags;
        
        // Pause au survol individuel des tags
        const tagItems = document.querySelectorAll('.tag-item');
        tagItems.forEach(tag => {
            tag.addEventListener('mouseenter', () => {
                tagsTrack.style.animationPlayState = 'paused';
            });
            tag.addEventListener('mouseleave', () => {
                tagsTrack.style.animationPlayState = 'running';
            });
        });
    }
});
// ============================================
// BOOKING BENEFITS SLIDER
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('benefitsSlider');
    const dotsContainer = document.getElementById('sliderDots');
    
    if (!slider || !dotsContainer) return;
    
    const benefits = slider.querySelectorAll('.booking-benefit');
    
    // Calculate number of items per page based on screen size
    function getItemsPerPage() {
        if (window.innerWidth <= 767) return 1;
        if (window.innerWidth <= 1023) return 2;
        return 4;
    }
    
    let itemsPerPage = getItemsPerPage();
    let totalPages = Math.ceil(benefits.length / itemsPerPage);
    let currentPage = 0;
    
    // Create navigation dots
    function createDots() {
        dotsContainer.innerHTML = '';
        itemsPerPage = getItemsPerPage();
        totalPages = Math.ceil(benefits.length / itemsPerPage);
        
        for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement('button');
            dot.className = 'slider-dot';
            dot.setAttribute('aria-label', `Page ${i + 1}`);
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToPage(i));
            dotsContainer.appendChild(dot);
        }
    }
    
    // Navigate to specific page
    function goToPage(page) {
        currentPage = page;
        const cardWidth = benefits[0].offsetWidth;
        const gap = parseFloat(getComputedStyle(slider).gap);
        const scrollAmount = (cardWidth + gap) * page * itemsPerPage;
        
        slider.scrollTo({
            left: scrollAmount,
            behavior: 'smooth'
        });
        
        updateDots();
    }
    
    // Update active dot
    function updateDots() {
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentPage);
        });
    }
    
    // Handle scroll event
    let scrollTimeout;
    slider.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const cardWidth = benefits[0].offsetWidth;
            const gap = parseFloat(getComputedStyle(slider).gap);
            const scrollLeft = slider.scrollLeft;
            const pageWidth = (cardWidth + gap) * itemsPerPage;
            const newPage = Math.round(scrollLeft / pageWidth);
            
            if (newPage !== currentPage && newPage >= 0 && newPage < totalPages) {
                currentPage = newPage;
                updateDots();
            }
        }, 100);
    });
    
    // Initialize
    createDots();
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const oldItemsPerPage = itemsPerPage;
            itemsPerPage = getItemsPerPage();
            
            if (oldItemsPerPage !== itemsPerPage) {
                createDots();
                goToPage(0);
            }
        }, 250);
    });
    
    // Touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        
        if (touchStartX - touchEndX > swipeThreshold && currentPage < totalPages - 1) {
            goToPage(currentPage + 1);
        }
        
        if (touchEndX - touchStartX > swipeThreshold && currentPage > 0) {
            goToPage(currentPage - 1);
        }
    }
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
let isAnimating = false;

const portfolioImage = document.getElementById('portfolioImage');
const portfolioTitle = document.getElementById('portfolioTitle');
const portfolioDescription = document.getElementById('portfolioDescription');
const portfolioLink = document.getElementById('portfolioLink');
const portfolioTags = document.getElementById('portfolioTags');
const portfolioTestimonial = document.getElementById('portfolioTestimonial');
const portfolioDetails = document.getElementById('portfolioDetails');
const portfolioMockup = document.querySelector('.portfolio-screen-mockup');
const portfolioContainer = document.querySelector('.portfolio-preview-container');
const portfolioPrevBtn = document.getElementById('portfolioPrevBtn');
const portfolioNextBtn = document.getElementById('portfolioNextBtn');

// Créer les images fantômes
function createGhostPreviews() {
    const prevGhost = document.createElement('div');
    prevGhost.className = 'portfolio-preview-ghost prev';
    prevGhost.id = 'prevGhost';
    
    const nextGhost = document.createElement('div');
    nextGhost.className = 'portfolio-preview-ghost next';
    nextGhost.id = 'nextGhost';
    
    portfolioContainer.insertBefore(prevGhost, portfolioMockup);
    portfolioContainer.appendChild(nextGhost);
    
    updateGhostPreviews();
}

function updateGhostPreviews() {
    const prevIndex = (currentPortfolioIndex - 1 + portfolioProjects.length) % portfolioProjects.length;
    const nextIndex = (currentPortfolioIndex + 1) % portfolioProjects.length;
    
    const prevGhost = document.getElementById('prevGhost');
    const nextGhost = document.getElementById('nextGhost');
    
    if (prevGhost && nextGhost) {
        prevGhost.innerHTML = `<img src="${portfolioProjects[prevIndex].image}" alt="${portfolioProjects[prevIndex].title}">`;
        nextGhost.innerHTML = `<img src="${portfolioProjects[nextIndex].image}" alt="${portfolioProjects[nextIndex].title}">`;
    }
}
function updatePortfolio(index, direction = 'down') {
    if (isAnimating) return;
    isAnimating = true;
    
    const project = portfolioProjects[index];
    
    // Déterminer si on est sur mobile
    const isMobile = window.innerWidth <= 1023;
    
    // Adapter la direction pour mobile (horizontal au lieu de vertical)
    let slideClass = 'sliding-down';
    let detailsTransform = 'translateY(20px)';
    
    if (isMobile) {
        // Sur mobile : slide horizontal
        slideClass = direction === 'down' ? 'sliding-down' : 'sliding-up'; // garde les mêmes classes mais CSS les gère différemment
        detailsTransform = direction === 'down' ? 'translateX(20px)' : 'translateX(-20px)';
    } else {
        // Sur desktop : slide vertical
        slideClass = direction === 'down' ? 'sliding-down' : 'sliding-up';
        detailsTransform = direction === 'down' ? 'translateY(20px)' : 'translateY(-20px)';
    }
    
    // Animation de sortie
    portfolioMockup.classList.add(slideClass);
    portfolioDetails.style.opacity = '0';
    portfolioDetails.style.transform = detailsTransform;
    
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
        
        // Update ghost previews
        updateGhostPreviews();
        
        // Animation d'entrée
        portfolioMockup.classList.remove('sliding-down', 'sliding-up');
        portfolioDetails.style.opacity = '1';
        portfolioDetails.style.transform = isMobile ? 'translateX(0)' : 'translateY(0)';
        
        setTimeout(() => {
            isAnimating = false;
        }, 100);
    }, 400);
}

// Ajouter un listener pour recréer les ghosts au resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        updateGhostPreviews();
    }, 250);
});
function nextPortfolio() {
    if (isAnimating) return;
    currentPortfolioIndex = (currentPortfolioIndex + 1) % portfolioProjects.length;
    updatePortfolio(currentPortfolioIndex, 'down');
}

function prevPortfolio() {
    if (isAnimating) return;
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
    
    // Initialize
    createGhostPreviews();
    updatePortfolio(0);
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
