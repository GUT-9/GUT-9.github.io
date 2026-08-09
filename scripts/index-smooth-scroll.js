// index-smooth-scroll.js - 侧边指示点精准同步与骑行相册轮播

document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.scroll-section');
    const dots = document.querySelectorAll('.dot-item');

    // 1. 使用 IntersectionObserver 实现滚动位置 100% 精准同步
    const observerOptions = {
        root: null,
        rootMargin: '-30% 0px -30% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetId = entry.target.getAttribute('id');
                dots.forEach(dot => {
                    if (dot.getAttribute('data-target') === targetId) {
                        dot.classList.add('active');
                    } else {
                        dot.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // 2. 点击侧边圆点平滑跳转
    dots.forEach((dot) => {
        dot.addEventListener('click', (e) => {
            const targetId = e.target.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 3. 骑行相册轮播逻辑
    const carouselImages = document.querySelectorAll('.carousel-img');
    const carouselDots = document.querySelectorAll('.carousel-dot');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');

    let currentIndex = 0;
    let autoPlayInterval;

    function showImage(index) {
        if (carouselImages.length === 0) return;
        
        if (index >= carouselImages.length) index = 0;
        if (index < 0) index = carouselImages.length - 1;

        currentIndex = index;

        carouselImages.forEach((img, i) => {
            img.classList.toggle('active', i === currentIndex);
        });

        carouselDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            showImage(currentIndex - 1);
            resetAutoPlay();
        });

        nextBtn.addEventListener('click', () => {
            showImage(currentIndex + 1);
            resetAutoPlay();
        });

        carouselDots.forEach((dot, i) => {
            dot.addEventListener('click', () => {
                showImage(i);
                resetAutoPlay();
            });
        });

        function startAutoPlay() {
            autoPlayInterval = setInterval(() => {
                showImage(currentIndex + 1);
            }, 4000);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }

        startAutoPlay();
    }
});
