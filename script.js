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
            const offsetTop = target.offsetTop - 100;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// NAVBAR DROPDOWN FUNCTIONALITY
// ============================================

// Handle dropdown menus
document.querySelectorAll('.nav-item.dropdown').forEach(item => {
    const link = item.querySelector('.nav-link');
    const dropdown = item.querySelector('.dropdown-menu');
    
    // Show dropdown on hover
    item.addEventListener('mouseenter', () => {
        dropdown.style.opacity = '1';
        dropdown.style.visibility = 'visible';
        dropdown.style.transform = 'translateY(0)';
    });
    
    // Hide dropdown on mouse leave
    item.addEventListener('mouseleave', () => {
        dropdown.style.opacity = '0';
        dropdown.style.visibility = 'hidden';
        dropdown.style.transform = 'translateY(-10px)';
    });
});

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            mobileMenu.classList.remove('active');
            menuToggle.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
}
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
    let isMobile = window.innerWidth <= 767;
    let cardsDuplicated = false;

    function initMobileCarousel() {
        if (perfCardsContainer && perfCardsWrapper && isMobile && !cardsDuplicated) {
            const cards = perfCardsWrapper.children;
            const cardsArray = Array.from(cards);

            // Dupliquer les cartes pour l'effet de boucle infinie
            cardsArray.forEach(card => {
                const clone = card.cloneNode(true);
                perfCardsWrapper.appendChild(clone);
            });

            cardsDuplicated = true;

            // Gestion des événements tactiles
            perfCardsContainer.addEventListener('touchstart', () => {
                perfCardsWrapper.classList.add('paused');
            });

            perfCardsContainer.addEventListener('touchend', () => {
                perfCardsWrapper.classList.remove('paused');
            });
        }
    }

    function cleanupMobileCarousel() {
        if (perfCardsContainer && perfCardsWrapper && !isMobile && cardsDuplicated) {
            const cards = perfCardsWrapper.querySelectorAll('.perf-brand-card, .perf-vision-card');
            const originalCardsCount = 4; // Nombre de cartes originales
            
            if (cards.length > originalCardsCount) {
                // Supprimer les cartes dupliquées
                for (let i = originalCardsCount; i < cards.length; i++) {
                    cards[i].remove();
                }
            }
            
            cardsDuplicated = false;
            perfCardsWrapper.classList.remove('paused');
        }
    }

    // Initialisation
    initMobileCarousel();

    // Gestion du redimensionnement
    window.addEventListener('resize', () => {
        const wasMobile = isMobile;
        isMobile = window.innerWidth <= 767;
        
        if (wasMobile !== isMobile) {
            if (isMobile) {
                initMobileCarousel();
            } else {
                cleanupMobileCarousel();
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
    
    // Fermer le menu au clic sur un lien
    mobileMenuItems.forEach(item => {
        item.addEventListener('click', () => {
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

// ============================================
// GOOGLE TAG MANAGER
// ============================================

(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WQ6D2R7D');

// ============================================
// GOOGLE ANALYTICS 4
// ============================================

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX', {
    page_title: document.title,
    page_location: window.location.href
});

// ============================================
// NETLIFY IDENTITY
// ============================================

if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
        if (!user) {
            window.netlifyIdentity.on("login", () => {
                document.location.href = "/admin/";
            });
        }
    });
}

// ============================================
// PROCESS ANIMATIONS (from process-animations.js)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Animation pour la section Process
    animateProcess();
    
    // Animation pour la section FAQ
    animateFAQ();
    
    // Initialiser les animations des benefit cards
    initBookingAnimations();
});

function animateProcess() {
    const steps = document.querySelectorAll('.step');
    const stepsContainer = document.querySelector('.steps');
    
    if (!steps.length || !stepsContainer) return;
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateProcessSteps();
            }
        });
    }, observerOptions);
    
    observer.observe(stepsContainer);
    
    function animateProcessSteps() {
        steps.forEach((step, index) => {
            if (!step.classList.contains('animate-in')) {
                setTimeout(() => {
                    step.style.opacity = '1';
                    step.style.transform = 'translateY(0)';
                    step.classList.add('animate-in');
                }, index * 200);
            }
        });
    }
}

function animateFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (!faqItems.length) return;
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateFAQItems();
            }
        });
    }, observerOptions);
    
    const faqSection = document.querySelector('.faq');
    if (faqSection) {
        observer.observe(faqSection);
    }
    
    function animateFAQItems() {
        faqItems.forEach((item, index) => {
            if (!item.classList.contains('animate-in')) {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                    item.classList.add('animate-in');
                }, index * 150);
            }
        });
    }
}

// Initialiser les animations des benefit cards
function initBookingAnimations() {
    const benefitCards = document.querySelectorAll('.booking-benefit:not(.mobile-duplicate)');
    
    if (!benefitCards.length) return;
    
    // Masquer les cartes au début seulement si elles ne sont pas déjà animées
    benefitCards.forEach(card => {
        if (!card.classList.contains('animate-in')) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    });
    
    // Observer pour déclencher les animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.booking-benefit:not(.mobile-duplicate)');
                cards.forEach((card, index) => {
                    if (!card.classList.contains('animate-in')) {
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                            card.classList.add('animate-in');
                        }, index * 150);
                    }
                });
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const bookingSection = document.querySelector('.booking');
    if (bookingSection) {
        observer.observe(bookingSection);
    }
    
    // S'assurer que les cartes dupliquées sont masquées
    const duplicateCards = document.querySelectorAll('.mobile-duplicate');
    duplicateCards.forEach(card => {
        card.style.display = 'none';
    });
}

// Animation de pulsation pour les numéros
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    .step.animate-in {
        animation: slideInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .steps {
        --progress-height: 0%;
    }
    
    .steps::before {
        height: var(--progress-height);
        transition: height 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
`;
document.head.appendChild(style);

// ============================================
// PERFORMANCE OPTIMIZER (from performance-optimizer.js)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src || img.src;
        });
    } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }

    if ('IntersectionObserver' in window) {
        const sections = document.querySelectorAll('section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.willChange = 'auto';
                }
            });
        }, { rootMargin: '50px' });

        sections.forEach(section => observer.observe(section));
    }

    const deferredStyles = ['https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'];
    deferredStyles.forEach(href => {
        const link = document.createElement('script');
        link.src = href;
        link.defer = true;
        document.body.appendChild(link);
    });

    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });
});

// ============================================
// ANIMATIONS (from animations.js)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    };

    const fadeInElements = document.querySelectorAll('.hero-content, .section-title, .section-subtitle, .perf-vision-card, .performance-chart, .portfolio-screen-mockup, .generator-form, .booking-calendar');

    fadeInElements.forEach((el, index) => {
        // Ne pas réinitialiser si déjà animé
        if (!el.classList.contains('animate-in')) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(40px)';
            el.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        }
    });

    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.classList.add('animate-in');
                }, index * 100);
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeInElements.forEach(el => fadeInObserver.observe(el));

    const cards = document.querySelectorAll('.option-card, .perf-vision-card, .portfolio-badge');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        } else {
            navbar.style.background = 'transparent';
            navbar.style.borderBottom = 'none';
        }

        lastScroll = currentScroll;
    });

    const heroStats = document.querySelectorAll('.stat');
    heroStats.forEach((stat, index) => {
        stat.style.opacity = '0';
        stat.style.transform = 'scale(0.8)';
        stat.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';

        setTimeout(() => {
            stat.style.opacity = '1';
            stat.style.transform = 'scale(1)';
        }, 500 + (index * 150));
    });

    const parallaxElements = document.querySelectorAll('.hero-background');

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;

        parallaxElements.forEach(el => {
            const speed = el.dataset.speed || 0.5;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';

            if (this.classList.contains('btn-primary')) {
                this.style.boxShadow = '0 12px 24px rgba(91, 91, 214, 0.4)';
            }
        });

        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });

        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                animation: ripple 0.6s ease-out;
            `;

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }

        .btn-primary, .btn-secondary {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);

    const sections = document.querySelectorAll('section');
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--color-accent) 0%, #8b7cdf 100%);
        z-index: 10000;
        transition: width 0.3s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });

    const perfCards = document.querySelectorAll('.perf-vision-card');
    perfCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-30px)';
        card.style.transition = 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
    });

    const perfObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.perf-vision-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateX(0)';
                    }, index * 150);
                });
                perfObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const performanceCards = document.querySelector('.performance-cards');
    if (performanceCards) {
        perfObserver.observe(performanceCards);
    }

    const formInputs = document.querySelectorAll('input, select, textarea');

    formInputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.transform = 'scale(1.01)';
            this.style.transition = 'all 0.3s ease';
        });

        input.addEventListener('blur', function() {
            this.style.transform = 'scale(1)';
        });
    });

    const hoverCards = document.querySelectorAll('.portfolio-screen-mockup, .generator-preview, .booking-calendar');

    hoverCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });

        card.style.transition = 'transform 0.3s ease';
    });

    const perfChart = document.querySelector('.performance-chart');
    if (perfChart) {
        perfChart.style.transition = 'none';
        perfChart.addEventListener('mouseenter', function(e) {
            e.stopPropagation();
        });
    }
});

// ============================================
// CMS LOADER (from cms-loader.js)
// ============================================

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
            this.replaceHTMLContent('.hero-title', `${hero.main_title} <span class="gradient-text">${hero.highlight_text}</span> The Future of Digital`);
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
            this.replaceHTMLContent('.section-title', `Simulez Votre <span class="gradient-text">Devis</span>`);
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

// ============================================
// ANALYTICS TRACKING (from analytics-tracking.js)
// ============================================

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

// ============================================
// INITIALISATION GLOBALE
// ============================================

// Fonction d'initialisation globale simplifiée
function initializeAllAnimations() {
    // S'assurer que les cartes dupliquées sont masquées
    const duplicateCards = document.querySelectorAll('.mobile-duplicate');
    duplicateCards.forEach(card => {
        card.style.display = 'none';
    });
}

// Initialiser une seule fois au chargement
window.addEventListener('load', () => {
    initializeAllAnimations();
});

console.log('🚀 LandingIA chargé avec succès!');
