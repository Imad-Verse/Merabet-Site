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

    // YouTube Slider Start
    const YOUTUBE_API_KEY = 'AIzaSyBq_pDf5Pbmh6CGDbogg2pH7ycFz0WKo2o';
    const YOUTUBE_CHANNEL_ID = 'UCfVZIZbXhhMdEDQD__NwD4w';
    const CACHE_KEY = 'youtube_videos_cache';
    const CACHE_TIME = 60 * 60 * 1000; // 1 hour

    async function fetchYouTubeVideos() {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            try {
                const { timestamp, videos } = JSON.parse(cachedData);
                if (Date.now() - timestamp < CACHE_TIME) {
                    console.log('Using cached YouTube data');
                    return videos;
                }
            } catch (e) {
                console.error('Error parsing cache:', e);
            }
        }

        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&order=date&maxResults=10&channelId=${YOUTUBE_CHANNEL_ID}&key=${YOUTUBE_API_KEY}&type=video`);
            const data = await response.json();
            
            if (data.items) {
                const videos = data.items.map(item => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.high.url
                })).filter(v => v.id); // Ensure it's a video
                
                const finalVideos = videos.slice(0, 6);
                
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    videos: finalVideos
                }));
                
                return finalVideos;
            }
        } catch (error) {
            console.error('Error fetching YouTube videos:', error);
        }
        return null;
    }

    function renderYouTubeVideos(videos) {
        const container = document.getElementById('youtube-slides');
        if (!container) return;

        if (!videos || videos.length === 0) {
            container.innerHTML = '<div class="swiper-slide loading-slide">تعذر تحميل الفيديوهات حالياً</div>';
            return;
        }

        container.innerHTML = videos.map(video => `
            <div class="swiper-slide">
                <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer" class="video-card">
                    <div class="video-thumbnail">
                        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                        <div class="play-icon-overlay">
                            <i class="fa-solid fa-play"></i>
                        </div>
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">${video.title}</h3>
                    </div>
                </a>
            </div>
        `).join('');
    }

    function initYouTubeSwiper() {
        new Swiper('.youtube-swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: videosData && videosData.length > 1,
            autoplay: {
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                }
            }
        });
    }

    let videosData = null;
    (async () => {
        videosData = await fetchYouTubeVideos();
        renderYouTubeVideos(videosData);
        initYouTubeSwiper();
    })();
    // YouTube Slider End

    // Image Galleries Logic Start
    const GALLERY_JSON = 'gallery.json';
    let galleryDataCache = null;

    async function fetchGalleryData() {
        if (galleryDataCache) return galleryDataCache;

        try {
            const response = await fetch(GALLERY_JSON);
            const data = await response.json();
            galleryDataCache = data;
            return data;
        } catch (error) {
            console.error('Error fetching gallery.json:', error);
            return null;
        }
    }

    function renderGallery(galleryType, imagePaths) {
        const container = document.getElementById(`${galleryType}-slides`);
        if (!container) return;

        if (!imagePaths || imagePaths.length === 0) {
            container.innerHTML = `<div class="swiper-slide loading-slide">تحت العمل...</div>`;
            return;
        }

        container.innerHTML = imagePaths.map(path => `
            <div class="swiper-slide">
                <a href="${path}" class="glightbox" data-gallery="${galleryType}">
                    <div class="image-card">
                        <img src="${path}" alt="صورة ${galleryType}" loading="lazy">
                        <div class="image-overlay">
                            <span class="view-btn">عرض الصورة</span>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');
    }

    function initGallerySwiper(galleryType) {
        new Swiper(`.${galleryType}-swiper`, {
            slidesPerView: 2,
            spaceBetween: 15,
            loop: true,
            autoplay: {
                delay: 4500 + Math.random() * 1000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                480: { slidesPerView: 2.2, spaceBetween: 15 },
                640: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 20 }
            }
        });
    }

    async function initGalleries() {
        const galleryData = await fetchGalleryData();
        if (!galleryData) return;

        // Matwiya
        renderGallery('matwiya', galleryData.matwiya);
        initGallerySwiper('matwiya');

        // Bitaqa
        renderGallery('bitaqa', galleryData.bitaqa);
        initGallerySwiper('bitaqa');

        // Initialize GLightbox
        GLightbox({
            selector: '.glightbox',
            touchNavigation: true,
            loop: true,
            zoomable: true
        });
    }

    initGalleries();
    // Image Galleries Logic End
});
