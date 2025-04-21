        // Sidebar functionality
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const closeSidebar = document.getElementById('close-sidebar');
        const overlay = document.getElementById('overlay');
        const mainContent = document.getElementById('main-content');
        
        function checkScreenSize() {
            if (window.innerWidth > 768) {
                sidebar.classList.add('open');
                document.body.style.overflow = '';
                overlay.classList.remove('active');
            } else {
                sidebar.classList.remove('open');
            }
        }
        
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
        
        sidebarToggle.addEventListener('click', openSidebar);
        closeSidebar.addEventListener('click', closeSidebarFunc);
        overlay.addEventListener('click', closeSidebarFunc);
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('open') && window.innerWidth <= 768) {
                closeSidebarFunc();
            }
        });
        
        window.addEventListener('load', checkScreenSize);
        window.addEventListener('resize', checkScreenSize);
