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
