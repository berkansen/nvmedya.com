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

    /* --- Marquee Duplication & Mobile Interactive Auto-Scroll --- */
    function initMobileAutoScroll() {
        const marquee = document.getElementById('marquee');
        if (!marquee) return;
        if (marquee.dataset.autoscrollInit === 'true') return;
        marquee.dataset.autoscrollInit = 'true';

        let autoScrollRaf = null;
        let isInteracting = false;
        let isPaused = false;
        let resumeTimeout = null;
        let currentScrollPos = marquee.scrollLeft || 0;
        const scrollSpeed = 0.6; // ~36px per second for smooth, readable auto-scroll

        function pauseAutoScroll() {
            isPaused = true;
            if (resumeTimeout) {
                clearTimeout(resumeTimeout);
                resumeTimeout = null;
            }
        }

        function scheduleResume(delay = 3000) {
            if (resumeTimeout) {
                clearTimeout(resumeTimeout);
            }
            resumeTimeout = setTimeout(() => {
                if (!isInteracting && !document.hidden && window.innerWidth <= 768) {
                    currentScrollPos = marquee.scrollLeft;
                    isPaused = false;
                }
            }, delay);
        }

        function startInteraction() {
            isInteracting = true;
            pauseAutoScroll();
        }

        function endInteraction() {
            isInteracting = false;
            currentScrollPos = marquee.scrollLeft;
            scheduleResume(3000);
        }

        // Touch interactions
        marquee.addEventListener('touchstart', startInteraction, { passive: true });
        marquee.addEventListener('touchend', endInteraction, { passive: true });
        marquee.addEventListener('touchcancel', endInteraction, { passive: true });

        // Pointer interactions (covers mouse drag/touch on modern devices)
        marquee.addEventListener('pointerdown', startInteraction, { passive: true });
        marquee.addEventListener('pointerup', endInteraction, { passive: true });
        marquee.addEventListener('pointercancel', endInteraction, { passive: true });

        // Manual scroll event (syncs position during user swipe/scroll & inertia)
        marquee.addEventListener('scroll', () => {
            if (isInteracting || isPaused) {
                currentScrollPos = marquee.scrollLeft;
            }
        }, { passive: true });

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseAutoScroll();
            } else if (window.innerWidth <= 768) {
                currentScrollPos = marquee.scrollLeft;
                scheduleResume(1000);
            }
        });

        // Frame loop
        function tick() {
            if (window.innerWidth <= 768 && !isPaused && !isInteracting) {
                const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (!prefersReducedMotion && !document.hidden) {
                    const maxScroll = marquee.scrollWidth - marquee.clientWidth;
                    if (maxScroll > 2) {
                        currentScrollPos += scrollSpeed;
                        if (currentScrollPos >= maxScroll - 1) {
                            currentScrollPos = 0;
                            marquee.scrollLeft = 0;
                        } else {
                            marquee.scrollLeft = currentScrollPos;
                        }
                    }
                }
            }
            autoScrollRaf = requestAnimationFrame(tick);
        }

        autoScrollRaf = requestAnimationFrame(tick);

        // Window resize handler
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                pauseAutoScroll();
                marquee.scrollLeft = 0;
                currentScrollPos = 0;
            } else if (window.innerWidth <= 768 && !isInteracting) {
                currentScrollPos = marquee.scrollLeft;
                scheduleResume(1000);
            }
        });
    }

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
        initMobileAutoScroll();
    }

    initMarquee();
});

