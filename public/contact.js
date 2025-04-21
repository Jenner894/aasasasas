        // Sidebar functionality
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const closeSidebar = document.getElementById('close-sidebar');
        const overlay = document.getElementById('overlay');
        
        function openSidebar() {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function closeSidebarFunc() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Event listeners for mobile
        sidebarToggle.addEventListener('click', openSidebar);
        closeSidebar.addEventListener('click', closeSidebarFunc);
        overlay.addEventListener('click', closeSidebarFunc);
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                closeSidebarFunc();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
