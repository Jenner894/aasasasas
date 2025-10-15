// ============================================
// NAVBAR FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Dropdown functionality
    const dropdownItems = document.querySelectorAll('.nav-item.has-dropdown');
    
    dropdownItems.forEach(item => {
        const link = item.querySelector('.nav-link');
        const dropdown = item.querySelector('.dropdown-menu');
        
        // Show dropdown on hover
        item.addEventListener('mouseenter', () => {
            item.classList.add('active');
        });
        
        // Hide dropdown on mouse leave
        item.addEventListener('mouseleave', () => {
            item.classList.remove('active');
        });
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = menuToggle.classList.contains('active');
            
            if (isActive) {
                closeMenu();
            } else {
                openMenu();
            }
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileMenu && mobileMenu.classList.contains('active')) {
            if (!mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                closeMenu();
            }
        }
    });
    
    // Close menu with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuToggle && menuToggle.classList.contains('active')) {
            closeMenu();
        }
    });
    
    function openMenu() {
        if (menuToggle) menuToggle.classList.add('active');
        if (mobileMenu) mobileMenu.classList.add('active');
        document.body.classList.add('menu-open');
    }
    
    function closeMenu() {
        if (menuToggle) menuToggle.classList.remove('active');
        if (mobileMenu) mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
});
