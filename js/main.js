document.addEventListener('DOMContentLoaded', () => {
    /* --- Mobile Navigation --- */
    const navToggle = document.getElementById('nav-toggle');
    const navList = document.getElementById('nav-list');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navList.classList.toggle('show');
            navToggle.setAttribute('aria-expanded', String(!isExpanded));
            navToggle.setAttribute('aria-label', isExpanded ? 'Gezinti menüsünü aç' : 'Gezinti menüsünü kapat');
        });

        // Keyboard support: Enter and Space activate the toggle
        navToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navToggle.click();
            }
        });
    }

    // Close menu when link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navList.classList.remove('show');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'Gezinti menüsünü aç');
        });
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
    window.addEventListener('load', () => {
        const marquee = document.getElementById('marquee');
        if (marquee) {
            const scrollers = marquee.querySelectorAll(".client-logo-img");
            if (scrollers.length > 0) {
                // Create a wrapper for the scrolling content
                const scrollGroup = document.createElement('div');
                scrollGroup.className = 'marquee-group';

                // Move existing items into the group
                scrollers.forEach(item => scrollGroup.appendChild(item));

                // Clone the group to create the seamless loop
                const scrollGroupClone = scrollGroup.cloneNode(true);
                scrollGroupClone.setAttribute('aria-hidden', 'true');

                // Clear original container and append the two groups
                marquee.innerHTML = '';
                marquee.appendChild(scrollGroup);
                marquee.appendChild(scrollGroupClone);
            }
        }
    });
});
