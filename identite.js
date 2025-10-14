// ============================================
// MOBILE MENU TOGGLE
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    }
});

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
    const additionalElements = document.querySelectorAll('.component-item, .service-card, .process-step, .faq-item, .portfolio-testimonial, .footer-logo-section, .footer-bottom');
    additionalElements.forEach(el => {
        if (!el.classList.contains('fade-in-up')) {
            el.classList.add('fade-in-up');
        }
        observer.observe(el);
    });
});

// ============================================
// SMOOTH SCROLL
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
