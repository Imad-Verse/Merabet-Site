document.addEventListener('DOMContentLoaded', () => {

    // 1. Dynamic Footer Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 2. 3D Tilt Effect on Link Cards for Desktop
    // Only apply on non-touch devices for better performance/UX
    if (window.matchMedia("(pointer: fine)").matches) {
        const cards = document.querySelectorAll('.link-card');

        cards.forEach(card => {
            // Mouse Move Event for actual Tilt
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                
                // Calculate position of mouse inside the card
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Get center of card
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Calculate rotation based on pointer offset from center
                // Multiply by a factor for sensitivity. 
                // Negative/Positive swapped slightly to match natural push feel
                const maxRotation = 8; // degrees
                const rotateX = ((y - centerY) / centerY) * -maxRotation;
                const rotateY = ((x - centerX) / centerX) * maxRotation;
                
                // Apply the transform via CSS variables or directly
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
                card.style.transition = 'none'; // Disable transition for instant tracking
            });

            // Smoothly reset when mouse leaves
            card.addEventListener('mouseleave', () => {
                card.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                
                // Remove hardcoded transform style completely after reset animation ends 
                // so the natural CSS hover (with its translateY and scale) can take over freely
                setTimeout(() => {
                    if (!card.matches(':hover')) {
                        card.style.transform = '';
                    }
                }, 400);
            });

            // Reset transitions when mouse enters
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.1s ease-out';
            });
        });
    }

    // 3. Audio Player Logic (Multiple Players)
    const audioCards = document.querySelectorAll('.audio-card');
    const allAudios = [];

    audioCards.forEach((card) => {
        const audio = card.querySelector('.bg-audio');
        const playPauseBtn = card.querySelector('.play-pause-btn');
        const playPauseIcon = card.querySelector('.play-pause-icon');
        const audioStatusText = card.querySelector('.audio-status');
        const audioIconWrapper = card.querySelector('.audio-icon-wrapper');

        if (audio && playPauseBtn) {
            allAudios.push(audio);

            const updateAudioUI = () => {
                if (audio.paused) {
                    playPauseIcon.classList.remove('fa-pause');
                    playPauseIcon.classList.add('fa-play');
                    audioStatusText.textContent = 'متوقف';
                    audioStatusText.style.color = '#94a3b8';
                    if (audioIconWrapper) audioIconWrapper.style.animationPlayState = 'paused';
                } else {
                    playPauseIcon.classList.remove('fa-play');
                    playPauseIcon.classList.add('fa-pause');
                    audioStatusText.textContent = 'جاري التشغيل..';
                    audioStatusText.style.color = 'var(--accent-color)';
                    if (audioIconWrapper) audioIconWrapper.style.animationPlayState = 'running';
                }
            };

            updateAudioUI();

            // Attempt autoplay only if element has autoplay attribute
            if (audio.hasAttribute('autoplay')) {
                let playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        updateAudioUI();
                    }).catch(error => {
                        updateAudioUI();
                    });
                }
                
                const startAudioOnInteraction = () => {
                     if (audio.paused) {
                         let promise = audio.play();
                         if (promise !== undefined) {
                             promise.catch(e => console.log("Audio play prevented temporarily"));
                         }
                     }
                };
                document.addEventListener('click', startAudioOnInteraction, { once: true });
            }
            
            audio.addEventListener('play', () => {
                // Pause all other audios
                allAudios.forEach(otherAudio => {
                    if (otherAudio !== audio && !otherAudio.paused) {
                        otherAudio.pause();
                    }
                });
                updateAudioUI();
            });
            audio.addEventListener('pause', updateAudioUI);

            playPauseBtn.addEventListener('click', () => {
                if (audio.paused) {
                    audio.play();
                } else {
                    audio.pause();
                }
            });
        }
    });

    // 4. Scroll to Top Functionality
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    if (scrollToTopBtn) {
        let isScrolling = false;
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 400) {
                        scrollToTopBtn.classList.add('show');
                    } else {
                        scrollToTopBtn.classList.remove('show');
                    }
                    isScrolling = false;
                });
                isScrolling = true;
            }
        }, { passive: true });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
