document.addEventListener('DOMContentLoaded', () => {
    /* --- Mobile Navigation --- */
    const navToggle = document.getElementById('nav-toggle');
    const navList = document.getElementById('nav-list');
    const navLinks = document.querySelectorAll('.nav-link');
    const navToggleIcon = navToggle ? (navToggle.querySelector('i') || document.getElementById('nav-toggle-icon')) : null;

    function openMenu() {
        if (!navToggle || !navList) return;
        navList.classList.add('show');
        navToggle.setAttribute('aria-expanded', 'true');
        navToggle.setAttribute('aria-label', 'Menüyü kapat');
        if (navToggleIcon) {
            navToggleIcon.className = 'bx bx-x';
        }
        document.body.classList.add('nav-open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        if (!navToggle || !navList) return;
        navList.classList.remove('show');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Menüyü aç');
        if (navToggleIcon) {
            navToggleIcon.className = 'bx bx-menu';
        }
        document.body.classList.remove('nav-open');
        document.body.style.overflow = '';
    }

    function toggleMenu() {
        if (!navList || !navToggle) return;
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    if (navToggle) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Keyboard accessibility: Enter & Space
        navToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
            }
        });
    }

    // Close menu when any link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMenu();
        });
    });

    // Close menu on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navList && navList.classList.contains('show')) {
            closeMenu();
            if (navToggle) navToggle.focus();
        }
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (navList && navList.classList.contains('show')) {
            if (!navList.contains(e.target) && !navToggle.contains(e.target)) {
                closeMenu();
            }
        }
    });

    // Close mobile menu on resize to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navList && navList.classList.contains('show')) {
            closeMenu();
        }
    });

    /* --- Header Background on Scroll --- */
    const header = document.getElementById('header');

    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(5, 5, 5, 0.95)';
                header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
            } else {
                header.style.background = 'rgba(5, 5, 5, 0.8)';
                header.style.boxShadow = 'none';
            }
        }, { passive: true });
    }

    /* --- Marquee Duplication --- */
    function initMarquee() {
        const marquee = document.getElementById('marquee');
        if (marquee && !marquee.querySelector('.marquee-group')) {
            const scrollers = Array.from(marquee.querySelectorAll('.client-logo-img'));
            if (scrollers.length > 0) {
                // Create a wrapper for the scrolling content
                const scrollGroup = document.createElement('div');
                scrollGroup.className = 'marquee-group';

                // Move existing items into the group
                scrollers.forEach(item => scrollGroup.appendChild(item));

                // Clone the group to create the seamless loop for desktop
                const scrollGroupClone = scrollGroup.cloneNode(true);
                scrollGroupClone.className = 'marquee-group marquee-clone';
                scrollGroupClone.setAttribute('aria-hidden', 'true');

                // Clear original container and append the two groups
                marquee.innerHTML = '';
                marquee.appendChild(scrollGroup);
                marquee.appendChild(scrollGroupClone);
            }
        }
    }

    if (document.readyState === 'complete') {
        initMarquee();
    } else {
        window.addEventListener('load', initMarquee);
    }
});
