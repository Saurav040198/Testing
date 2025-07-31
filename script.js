window.addEventListener('load', function() {
    const loading = document.querySelector('.loading');
    if (loading) {
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 1000);
    }
});

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

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

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    element.style.borderRight = '3px solid white';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            setInterval(() => {
                element.style.borderRight = element.style.borderRight === '3px solid transparent' 
                    ? '3px solid white' 
                    : '3px solid transparent';
            }, 500);
        }
    }
    type();
}

document.addEventListener('DOMContentLoaded', () => {
    const typingElement = document.querySelector('.typing-text');
    if (typingElement) {
        setTimeout(() => {
            typeWriter(typingElement, "Hi, I'm Saurabh Chaudhary", 80);
        }, 500);
    }
});

function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }
    updateCounter();
}

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            
            if (entry.target.classList.contains('about')) {
                const counters = entry.target.querySelectorAll('.stat-number');
                counters.forEach(counter => {
                    const target = parseInt(counter.getAttribute('data-target'));
                    animateCounter(counter, target);
                });
            }
            
            if (entry.target.classList.contains('timeline-item')) {
                entry.target.style.animationDelay = '0s';
                entry.target.style.animationFillMode = 'both';
            }
            
            if (entry.target.classList.contains('skill-category')) {
                const delay = Array.from(entry.target.parentNode.children).indexOf(entry.target) * 200;
                entry.target.style.animationDelay = `${delay}ms`;
            }
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const elementsToObserve = document.querySelectorAll('.about, .timeline-item, .skill-category, .contact-item, .contact-form');
    elementsToObserve.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
});

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const name = this.querySelector('input[type="text"]').value;
            const email = this.querySelector('input[type="email"]').value;
            const subject = this.querySelector('input[placeholder="Subject"]').value;
            const message = this.querySelector('textarea').value;
            
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            const submitBtn = this.querySelector('.btn-primary');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                this.reset();
                showNotification('Message sent successfully!', 'success');
            }, 2000);
        });
    }
});

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const skillItems = document.querySelectorAll('.skill-item');
    skillItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05) translateY(-2px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) translateY(0)';
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.1) rotate(5deg)';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1) rotate(0deg)';
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const loadingHTML = `
        <div class="loading">
            <div class="loader"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', loadingHTML);
});

function revealOnScroll() {
    const reveals = document.querySelectorAll('.animate-on-scroll');
    
    reveals.forEach(element => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('animated');
        }
    });
}

window.addEventListener('scroll', revealOnScroll);

function createParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            pointer-events: none;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${3 + Math.random() * 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        hero.appendChild(particle);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    revealOnScroll();
});

const particleStyles = document.createElement('style');
particleStyles.textContent = `
    @keyframes float {
        0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg); 
            opacity: 0.3;
        }
        33% { 
            transform: translateY(-20px) translateX(10px) rotate(120deg); 
            opacity: 0.8;
        }
        66% { 
            transform: translateY(-10px) translateX(-10px) rotate(240deg); 
            opacity: 0.5;
        }
    }
`;
document.head.appendChild(particleStyles);
