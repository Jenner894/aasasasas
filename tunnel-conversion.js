// ============================================
// HERO TITLE LETTER ANIMATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const heroTitle = document.querySelector('.hero-title-animated');
    const heroDescription = document.querySelector('.hero-description-animated');
    
    if (heroTitle && heroDescription) {
        // Traiter le titre
        const titleText = heroTitle.textContent;
        const titleWords = titleText.split(' ');
        const titleLastWords = titleWords.slice(-3); // "Tunnel de Conversion"
        const titleFirstPart = titleWords.slice(0, -3).join(' ');
        
        // Créer les lettres pour la première partie du titre
        const titleFirstPartLetters = titleFirstPart.split('').map(letter => {
            if (letter === ' ') {
                return '<span class="letter" style="width: 0.2em;">&nbsp;</span>';
            }
            return `<span class="letter">${letter}</span>`;
        }).join('');
        
        // Créer les lettres pour "Tunnel de Conversion" avec style gradient
        const titleGradientText = titleLastWords.join(' ');
        const titleGradientLetters = titleGradientText.split('').map(letter => {
            if (letter === ' ') {
                return '<span class="letter gradient-text" style="width: 0.2em;">&nbsp;</span>';
            }
            return `<span class="letter gradient-text">${letter}</span>`;
        }).join('');
        
        heroTitle.innerHTML = titleFirstPartLetters + ' ' + titleGradientLetters;
        
        // Traiter la description
        const descriptionText = heroDescription.textContent;
        const descriptionLetters = descriptionText.split('').map(letter => {
            if (letter === ' ') {
                return '<span class="letter" style="width: 0.2em;">&nbsp;</span>';
            }
            return `<span class="letter">${letter}</span>`;
        }).join('');
        
        heroDescription.innerHTML = descriptionLetters;
        
        // Calculer le nombre total de lettres pour synchroniser
        const titleLetters = heroTitle.querySelectorAll('.letter');
        const descriptionLettersElements = heroDescription.querySelectorAll('.letter');
        const totalLetters = titleLetters.length + descriptionLettersElements.length;
        
        // Calculer le délai pour que les animations se terminent en même temps
        const maxDuration = 2; // Durée totale en secondes
        const delayPerLetter = maxDuration / totalLetters;
        
        // Appliquer les délais au titre
        titleLetters.forEach((letter, index) => {
            letter.style.animationDelay = `${index * delayPerLetter}s`;
        });
        
        // Appliquer les délais à la description (commence après le titre)
        const titleStartDelay = titleLetters.length * delayPerLetter;
        descriptionLettersElements.forEach((letter, index) => {
            letter.style.animationDelay = `${titleStartDelay + (index * delayPerLetter)}s`;
        });
    }
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================

const menuToggle = document.getElementById('menuToggle');

if (menuToggle) {
    menuToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
}

// ============================================
// FAQ ACCORDION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const isActive = question.classList.contains('active');
            
            // Fermer toutes les autres questions
            faqQuestions.forEach(q => {
                q.classList.remove('active');
            });
            
            // Ouvrir/fermer la question cliquée
            if (!isActive) {
                question.classList.add('active');
            }
        });
    });
});

// ============================================
// SMOOTH SCROLL
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Ignore if href is just "#"
        if (href === '#') {
            e.preventDefault();
            return;
        }
        
        const target = document.querySelector(href);
        
        if (target) {
            e.preventDefault();
            
            // Close mobile menu if open
            if (menuToggle && menuToggle.classList.contains('active')) {
                menuToggle.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
            
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

const navbar = document.querySelector('.navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    // Add shadow on scroll
    if (currentScrollY > 50) {
        navbar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
    } else {
        navbar.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.1)';
    }
    
    lastScrollY = currentScrollY;
});

// ============================================
// SCROLL ANIMATIONS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all elements with fade-in-up class
    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // Also observe elements that might not have the class but should animate
    const additionalElements = document.querySelectorAll('.problem-card, .benefit-item, .funnel-step, .faq-item, .cta-final');
    additionalElements.forEach(el => {
        if (!el.classList.contains('fade-in-up')) {
            el.classList.add('fade-in-up');
        }
        observer.observe(el);
    });
});

// ============================================
// PRICING CARD HOVER EFFECT
// ============================================

const pricingCards = document.querySelectorAll('.pricing-card');

pricingCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-12px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(-8px)';
    });
});


// ============================================
// CTA BUTTON RIPPLE EFFECT
// ============================================

const ctaButtons = document.querySelectorAll('.cta-button, .pricing-cta');

ctaButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add ripple styles
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .cta-button, .pricing-cta {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// ============================================
// PREVENT BODY SCROLL WHEN MOBILE MENU OPEN
// ============================================

if (menuToggle) {
    menuToggle.addEventListener('click', function() {
        if (this.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });
}

// ============================================
// CLOSE MOBILE MENU ON RESIZE
// ============================================

window.addEventListener('resize', () => {
    if (window.innerWidth > 1100) {
        if (menuToggle && menuToggle.classList.contains('active')) {
            menuToggle.classList.remove('active');
            document.body.style.overflow = '';
            document.body.classList.remove('menu-open');
        }
    }
});

// ============================================
// GUARANTEE BOX PULSE ANIMATION
// ============================================

const guaranteeBox = document.querySelector('.guarantee-box');

if (guaranteeBox) {
    const guaranteeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animation = 'pulse 2s ease-in-out infinite';
            }
        });
    }, { threshold: 0.5 });
    
    guaranteeObserver.observe(guaranteeBox);
}

// Add pulse animation
const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
    @keyframes pulse {
        0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.3);
        }
        50% {
            box-shadow: 0 0 0 15px rgba(16, 185, 129, 0);
        }
    }
`;
document.head.appendChild(pulseStyle);

