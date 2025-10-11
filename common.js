// common.js - Shared JavaScript functionality for all pages

// Scroll effect for navigation
let lastScroll = 0;
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add scrolled class for enhanced shadow
    if (currentScroll > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
    
    // Hide/show navigation on scroll
    if (currentScroll > lastScroll && currentScroll > 100) {
        nav.style.transform = 'translateY(-100%)';
    } else {
        nav.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll <= 0 ? 0 : currentScroll;
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target); // Stop observing once animated
        }
    });
}, observerOptions);

// Observe all sections and animated elements
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('section, .card, .publication, .question-card, .goal-item, .cta-section, .info-card');
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
            const navHeight = nav.offsetHeight;
            const targetPosition = target.offsetTop - navHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Add loading state handler
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Keyboard navigation improvements
document.addEventListener('keydown', (e) => {
    // Press '/' to focus on navigation
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const firstNavLink = document.querySelector('nav a');
        if (firstNavLink) firstNavLink.focus();
    }
    
    // Press 'Escape' to blur focused element
    if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement !== document.body) {
            activeElement.blur();
        }
    }
});

// Enhanced focus management for accessibility
const focusableElements = document.querySelectorAll(
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
);

focusableElements.forEach(element => {
    element.addEventListener('focus', () => {
        element.classList.add('focused');
    });
    
    element.addEventListener('blur', () => {
        element.classList.remove('focused');
    });
});

// Performance optimization: Debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll handler
const debouncedScroll = debounce(() => {
    // Additional scroll-based actions can be added here
}, 100);

window.addEventListener('scroll', debouncedScroll);

// Print optimization
window.addEventListener('beforeprint', () => {
    document.body.classList.add('printing');
});

window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing');
});

// Error handling for external links
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', (e) => {
        try {
            // Track external link clicks (if analytics is set up)
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    'event_category': 'outbound',
                    'event_label': link.href
                });
            }
        } catch (error) {
            console.error('Analytics error:', error);
        }
    });
});

// Theme detection and application (for future dark mode support)
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(e) {
    const theme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

prefersDarkScheme.addListener(applyTheme);
applyTheme(prefersDarkScheme);

// Service worker registration (for future PWA support)
if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('ServiceWorker registration failed:', err);
        });
    });
}

console.log('🚀 Website loaded successfully! Built with passion by Kyunghun Nam.');
