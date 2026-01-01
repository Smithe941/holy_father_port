// Main JavaScript file for photographer portfolio

document.addEventListener('DOMContentLoaded', function() {
  // Navbar scroll functionality (desktop only)
  const navbarLinks = document.getElementById('navbar-links');
  const burgerButton = document.getElementById('burger-menu-button');
  const isMobile = window.innerWidth <= 576;
  let lastScrollTop = 0;
  let scrollTimeout;

  if (!isMobile) {
    // Show/hide navbar links and burger on scroll
    function handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      clearTimeout(scrollTimeout);
      
      if (scrollTop > 100) {
        // Scrolled down - hide links, show burger
        if (navbarLinks) navbarLinks.classList.add('hidden');
        if (burgerButton) burgerButton.classList.add('visible');
      } else {
        // At top - show links, hide burger
        if (navbarLinks) navbarLinks.classList.remove('hidden');
        if (burgerButton) burgerButton.classList.remove('visible');
      }
      
      lastScrollTop = scrollTop;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
  } else {
    // On mobile, always show burger
    if (burgerButton) burgerButton.classList.add('visible');
  }

  // Prevent scroll snap from bouncing back to top when at bottom on mobile
  if (isMobile) {
    let isAtBottom = false;
    let scrollTimeout;
    
    function checkIfAtBottom() {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollBottom = scrollTop + windowHeight;
      
      // Check if we're at the bottom (with 50px threshold)
      isAtBottom = scrollBottom >= documentHeight - 50;
      
      // Temporarily disable scroll snap when at bottom
      if (isAtBottom) {
        document.documentElement.style.scrollSnapType = 'none';
        document.querySelector('.main-content')?.style.setProperty('scroll-snap-type', 'none');
      } else {
        document.documentElement.style.scrollSnapType = '';
        document.querySelector('.main-content')?.style.removeProperty('scroll-snap-type');
      }
    }
    
    // Check on scroll
    window.addEventListener('scroll', function() {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkIfAtBottom, 100);
      checkIfAtBottom();
    }, { passive: true });
    
    // Initial check
    checkIfAtBottom();
    
    // Check on resize
    window.addEventListener('resize', function() {
      checkIfAtBottom();
    }, { passive: true });
  }

  // Burger menu functionality
  const fullscreenMenu = document.getElementById('fullscreen-menu');
  const menuLinks = document.querySelectorAll('.menu-link');
  let isMenuTransitioning = false; // Flag to prevent multiple toggles during animation

  function resetTransitionState() {
    isMenuTransitioning = false;
    if (burgerButton) {
      burgerButton.style.pointerEvents = '';
    }
  }

  function toggleMenu() {
    // Prevent multiple toggles during animation
    if (isMenuTransitioning) {
      return;
    }
    
    const isActive = fullscreenMenu.classList.contains('active');
    
    // Set flag to prevent multiple toggles
    isMenuTransitioning = true;
    
    // Disable pointer events during animation to prevent clicks
    if (burgerButton) {
      burgerButton.style.pointerEvents = 'none';
    }
    
    if (isActive) {
      // Close menu
      fullscreenMenu.classList.remove('active');
      burgerButton.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
    } else {
      // Open menu
      fullscreenMenu.classList.add('active');
      burgerButton.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    // Listen for transition end on burger button lines
    const burgerLines = burgerButton ? burgerButton.querySelectorAll('.burger-line') : [];
    let transitionEndCount = 0;
    const totalLines = burgerLines.length;
    
    function handleTransitionEnd(e) {
      // Only count transitions on transform property
      if (e.propertyName === 'transform' || e.propertyName === 'opacity') {
        transitionEndCount++;
        if (transitionEndCount >= totalLines || totalLines === 0) {
          resetTransitionState();
          // Remove listeners after completion
          burgerLines.forEach(line => {
            line.removeEventListener('transitionend', handleTransitionEnd);
          });
        }
      }
    }
    
    // Add transition end listeners
    burgerLines.forEach(line => {
      line.addEventListener('transitionend', handleTransitionEnd);
    });
    
    // Fallback timeout in case transitionend doesn't fire
    setTimeout(() => {
      resetTransitionState();
      burgerLines.forEach(line => {
        line.removeEventListener('transitionend', handleTransitionEnd);
      });
    }, 400); // Slightly longer than CSS transition (300ms) to ensure completion
  }

  // Toggle menu on burger button click
  if (burgerButton) {
    // Use both click and touchstart for better mobile support
    ['click', 'touchstart'].forEach(eventType => {
      burgerButton.addEventListener(eventType, function(e) {
        e.stopPropagation();
        e.preventDefault(); // Prevent default behavior
        toggleMenu();
      }, { passive: false });
    });
  }

  // Close menu when clicking on backdrop
  if (fullscreenMenu) {
    fullscreenMenu.addEventListener('click', function(e) {
      if (e.target.classList.contains('menu-backdrop')) {
        toggleMenu();
      }
    });
  }

  // Close menu when clicking on menu links
  menuLinks.forEach(link => {
    link.addEventListener('click', function() {
      toggleMenu();
    });
  });

  // Close menu on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && fullscreenMenu.classList.contains('active')) {
      toggleMenu();
    }
  });

  // Images are handled natively by browser with loading="lazy" attribute
  // No need for manual opacity handling

  // Smooth scroll for navigation links
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

  // Mosaic grid - automatically assign sizes based on image aspect ratio
  window.setupMosaicGrid = function() {
    const mosaicItems = document.querySelectorAll('.mosaic-item');
    
    mosaicItems.forEach(item => {
      // Check for image or video thumbnail (or video itself if no thumbnail)
      const img = item.querySelector('.gallery-image');
      const videoThumbnail = item.querySelector('.video-thumbnail');
      const video = item.querySelector('.gallery-video');
      const mediaElement = img || videoThumbnail || video;
      
      if (mediaElement) {
        // Remove existing size classes and inline styles
        item.classList.remove('wide', 'tall', 'large', 'tall-3', 'tall-4', 'wide-3', 'wide-4');
        item.style.gridColumn = '';
        item.style.gridRow = '';
        
        // Wait for image/thumbnail to load to get actual dimensions
        if (mediaElement.complete && mediaElement.naturalWidth > 0) {
          assignMosaicSize(item, mediaElement);
        } else {
          // For video thumbnails, ensure they load properly
          if (videoThumbnail) {
            videoThumbnail.loading = 'eager'; // Force eager loading for thumbnails
          }
          
          // For videos without thumbnails, wait for video to load metadata
          if (video && !videoThumbnail) {
            if (video.readyState >= 1) { // HAVE_METADATA
              assignMosaicSize(item, video);
            } else {
              video.addEventListener('loadedmetadata', function() {
                if (!item.classList.contains('expanded')) {
                  assignMosaicSize(item, video);
                }
              }, { once: true });
            }
            return; // Skip image load handler for videos without thumbnails
          }
          
          const loadHandler = function() {
            if (!item.classList.contains('expanded') && mediaElement.naturalWidth > 0) {
              assignMosaicSize(item, mediaElement);
            }
          };
          
          mediaElement.addEventListener('load', loadHandler, { once: true });
          
          // Fallback: if image already loaded but event didn't fire
          if (mediaElement.complete) {
            setTimeout(() => {
              if (mediaElement.naturalWidth > 0) {
                assignMosaicSize(item, mediaElement);
              }
            }, 100);
          }
        }
      }
    });
  }

  window.assignMosaicSize = function(item, img) {
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    
    // Remove existing classes and inline styles
    item.classList.remove('wide', 'tall', 'large', 'tall-3', 'tall-4', 'wide-3', 'wide-4');
    item.style.gridColumn = '';
    item.style.gridRow = '';
    
    // Calculate grid spans based on aspect ratio
    // Base cell dimensions (responsive)
    const isMobile = window.innerWidth <= 576;
    const isTablet = window.innerWidth <= 768;
    const baseCellSize = isMobile ? 300 : (isTablet ? 200 : 250);
    
    let colSpan = 1;
    let rowSpan = 1;
    
    // Calculate spans to maintain aspect ratio
    // For wide images: increase columns
    // For tall images: increase rows
    if (aspectRatio > 2.0) {
      // Very wide landscape (panoramic)
      colSpan = 3;
      rowSpan = Math.max(1, Math.round(3 / aspectRatio));
      item.classList.add('wide-3');
    } else if (aspectRatio > 1.5) {
      // Wide landscape
      colSpan = 2;
      rowSpan = Math.max(1, Math.round(2 / aspectRatio));
      item.classList.add('wide');
    } else if (aspectRatio < 0.5) {
      // Very tall portrait
      colSpan = 1;
      rowSpan = Math.min(4, Math.max(3, Math.round(1 / aspectRatio)));
      if (rowSpan >= 4) item.classList.add('tall-4');
      else item.classList.add('tall-3');
    } else if (aspectRatio < 0.7) {
      // Tall portrait
      colSpan = 1;
      rowSpan = Math.max(2, Math.round(1 / aspectRatio));
      item.classList.add('tall');
    } else if (aspectRatio >= 1.2 && aspectRatio <= 1.4) {
      // Square-ish, can be large (2x2)
      if (Math.random() > 0.6) { // 40% chance
        colSpan = 2;
        rowSpan = 2;
        item.classList.add('large');
      }
    }
    // Default: 1x1 (square-ish images, aspectRatio ~0.8-1.2)
    
    // Apply grid spans via inline styles for precise control
    item.style.gridColumn = `span ${colSpan}`;
    item.style.gridRow = `span ${rowSpan}`;
  }

  // Setup mosaic grid
  setupMosaicGrid();

  // Parallax effect on hover for desktop
  function setupParallaxEffect() {
    if (isMobile) return; // Only on desktop
    
    const mosaicItems = document.querySelectorAll('.mosaic-item:not(.expanded)');
    
    mosaicItems.forEach(item => {
      const img = item.querySelector('.gallery-image, .video-thumbnail, .gallery-video');
      if (!img) return;
      
      // Remove existing listeners by using a flag
      if (item.dataset.parallaxSetup === 'true') return;
      item.dataset.parallaxSetup = 'true';
      
      item.addEventListener('mouseenter', function() {
        if (img) {
          img.style.transform = 'scale(1.02) translate(0, 0)';
        }
      });
      
      item.addEventListener('mousemove', function(e) {
        if (!img) return;
        
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate center of element
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate offset from center (-1 to 1)
        const offsetX = (x - centerX) / centerX;
        const offsetY = (y - centerY) / centerY;
        
        // Apply parallax transform (max 10px movement) while keeping scale
        const moveX = offsetX * 10;
        const moveY = offsetY * 10;
        
        img.style.transform = `scale(1.02) translate(${moveX}px, ${moveY}px)`;
        img.style.transition = 'transform 0.1s ease-out';
      });
      
      item.addEventListener('mouseleave', function() {
        if (img) {
          // Reset to just scale, no translate
          img.style.transform = 'scale(1)';
          img.style.transition = 'transform 0.3s ease-out';
        }
      });
    });
  }
  
  // Setup parallax after grid is ready
  setupParallaxEffect();
  
  // Re-setup parallax when grid is recalculated
  const originalSetupMosaicGrid = setupMosaicGrid;
  window.setupMosaicGrid = function() {
    originalSetupMosaicGrid();
    // Clear parallax flags and re-setup
    document.querySelectorAll('.mosaic-item').forEach(item => {
      delete item.dataset.parallaxSetup;
    });
    setTimeout(setupParallaxEffect, 50);
  };

  // Recalculate on window resize (with debounce)
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      // Close lightbox on resize
      if (lightbox && lightbox.classList.contains('active')) {
        closeLightbox();
      }
      setupMosaicGrid();
    }, 250);
  });

  // Lightbox functionality
  const lightbox = document.getElementById('lightbox');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxMedia = document.getElementById('lightbox-media');
  const lightboxThumbnails = document.getElementById('lightbox-thumbnails');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  let currentLightboxIndex = -1;
  let allGalleryItems = [];

  function getAllGalleryItemsForLightbox() {
    return Array.from(document.querySelectorAll('.mosaic-item'));
  }

  function openLightbox(index) {
    allGalleryItems = getAllGalleryItemsForLightbox();
    if (index < 0 || index >= allGalleryItems.length) return;
    
    currentLightboxIndex = index;
    updateLightbox();
    if (lightbox) {
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      // On mobile, also prevent horizontal scroll
      if (window.innerWidth <= 768) {
        document.body.style.overflowX = 'hidden';
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.overflowY = 'hidden';
        document.documentElement.style.overflowY = 'hidden';
      }
    }
  }

  function closeLightbox() {
    if (lightbox) {
      // Reset any transform from swiping
      const mediaElement = lightboxMedia ? lightboxMedia.querySelector('img, video') : null;
      if (mediaElement) {
        mediaElement.style.transform = '';
        mediaElement.style.opacity = '';
        mediaElement.style.transition = '';
      }
      
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
      document.body.style.overflowY = '';
      document.documentElement.style.overflowY = '';
      currentLightboxIndex = -1;
      
      // Pause any playing videos
      const video = lightboxMedia ? lightboxMedia.querySelector('video') : null;
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    }
  }

  function updateLightbox() {
    if (currentLightboxIndex < 0 || currentLightboxIndex >= allGalleryItems.length || !lightboxMedia || !lightboxThumbnails) return;
    
    const item = allGalleryItems[currentLightboxIndex];
    const type = item.dataset.type;
    const url = item.dataset.url;
    const alt = item.dataset.alt || '';
    
    // Update main media
    lightboxMedia.innerHTML = '';
    if (type === 'photo') {
      const img = document.createElement('img');
      img.alt = alt;
      // Reset transform for new image
      img.style.transform = 'translateX(0)';
      img.style.opacity = '0'; // Start hidden, fade in when loaded
      img.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
      // Load full-size image only when lightbox is opened
      img.loading = 'eager'; // Eager load since lightbox is already open
      img.src = url; // Full-size URL from data-url attribute
      // Fade in when image loads
      img.onload = function() {
        img.style.opacity = '1';
      };
      lightboxMedia.appendChild(img);
    } else if (type === 'video') {
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.autoplay = true;
      video.muted = false;
      video.loop = false;
      // Reset transform for new video
      video.style.transform = 'translateX(0)';
      video.style.opacity = '1';
      video.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
      lightboxMedia.appendChild(video);
      
      // Try to play video
      video.play().catch(err => {
        console.log('Video autoplay failed:', err);
      });
    }
    
    // Update thumbnails
    lightboxThumbnails.innerHTML = '';
    const isMobile = window.innerWidth <= 768; // Match $breakpoint-md
    allGalleryItems.forEach((thumbItem, idx) => {
      const thumbWrapper = document.createElement('div');
      thumbWrapper.style.position = 'relative';
      if (isMobile) {
        thumbWrapper.style.width = 'auto';
        thumbWrapper.style.height = '100%';
        thumbWrapper.style.minWidth = '120px';
      } else {
        thumbWrapper.style.width = '100%';
        thumbWrapper.style.minHeight = '120px';
        thumbWrapper.style.aspectRatio = '16 / 9';
      }
      thumbWrapper.style.cursor = 'pointer';
      thumbWrapper.style.borderRadius = '4px';
      thumbWrapper.style.overflow = 'hidden';
      thumbWrapper.style.opacity = idx === currentLightboxIndex ? '1' : '0.6';
      thumbWrapper.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      thumbWrapper.style.border = idx === currentLightboxIndex ? `2px solid ${getComputedStyle(document.documentElement).getPropertyValue('--accent-color') || '#d4af37'}` : '2px solid transparent';
      thumbWrapper.style.flexShrink = '0'; // Prevent compression
      
      if (idx === currentLightboxIndex) {
        thumbWrapper.classList.add('active');
      }
      
      // Use contain on mobile, cover on desktop
      const objectFitValue = isMobile ? 'contain' : 'cover';
      
      if (thumbItem.dataset.type === 'photo') {
        const thumb = document.createElement('img');
        thumb.className = 'lightbox-thumbnail';
        thumb.src = thumbItem.dataset.url;
        thumb.alt = thumbItem.dataset.alt || '';
        thumb.style.width = '100%';
        thumb.style.height = '100%';
        thumb.style.objectFit = objectFitValue;
        thumbWrapper.appendChild(thumb);
      } else if (thumbItem.dataset.type === 'video') {
        const thumbnail = thumbItem.dataset.thumbnail;
        if (thumbnail) {
          const thumb = document.createElement('img');
          thumb.className = 'lightbox-thumbnail';
          thumb.src = thumbnail;
          thumb.alt = thumbItem.dataset.alt || '';
          thumb.style.width = '100%';
          thumb.style.height = '100%';
          thumb.style.objectFit = objectFitValue;
          thumbWrapper.appendChild(thumb);
        } else {
          // For videos without thumbnail, show video element
          const video = document.createElement('video');
          video.className = 'lightbox-thumbnail';
          video.src = thumbItem.dataset.url;
          video.muted = true;
          video.playsInline = true;
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = objectFitValue;
          video.addEventListener('loadeddata', function() {
            video.currentTime = 0.1; // Show first frame
          });
          thumbWrapper.appendChild(video);
        }
        
        // Add video icon overlay
        const videoIcon = document.createElement('div');
        videoIcon.style.position = 'absolute';
        videoIcon.style.bottom = '4px';
        videoIcon.style.left = '4px';
        videoIcon.style.width = '20px';
        videoIcon.style.height = '20px';
        videoIcon.style.background = 'rgba(0, 0, 0, 0.6)';
        videoIcon.style.borderRadius = '4px';
        videoIcon.style.display = 'flex';
        videoIcon.style.alignItems = 'center';
        videoIcon.style.justifyContent = 'center';
        const iconImg = document.createElement('img');
        // Try to get video icon path from existing video icon on page
        const existingVideoIcon = document.querySelector('.video-icon img');
        if (existingVideoIcon) {
          iconImg.src = existingVideoIcon.src;
        } else {
          // Fallback: use relative path
          const baseurl = window.location.pathname.includes('/holy_father_port') ? '/holy_father_port' : '';
          iconImg.src = baseurl + '/assets/svg/video.svg';
        }
        iconImg.style.width = '14px';
        iconImg.style.height = '14px';
        iconImg.style.filter = 'brightness(0) invert(1)';
        videoIcon.appendChild(iconImg);
        thumbWrapper.appendChild(videoIcon);
      }
      
      thumbWrapper.addEventListener('click', () => openLightbox(idx));
      thumbWrapper.addEventListener('mouseenter', function() {
        if (idx !== currentLightboxIndex) {
          this.style.opacity = '0.8';
          this.style.transform = 'scale(1.05)';
        }
      });
      thumbWrapper.addEventListener('mouseleave', function() {
        if (idx !== currentLightboxIndex) {
          this.style.opacity = '0.6';
          this.style.transform = 'scale(1)';
        }
      });
      
      lightboxThumbnails.appendChild(thumbWrapper);
    });
    
    // Update navigation buttons
    if (lightboxPrev) lightboxPrev.disabled = currentLightboxIndex === 0;
    if (lightboxNext) lightboxNext.disabled = currentLightboxIndex === allGalleryItems.length - 1;
    
    // Scroll active thumbnail into view
    const activeThumb = lightboxThumbnails.querySelector('.lightbox-thumbnail.active');
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  
  // Video hover functionality
  window.setupVideoHover = function() {
    const videoItems = document.querySelectorAll('.video-item');
    
    videoItems.forEach(item => {
      const video = item.querySelector('.gallery-video');
      const thumbnail = item.querySelector('.video-thumbnail');
      const hasThumbnail = !!thumbnail;
      
      if (video) {
        // Play video on hover (only if there's a thumbnail, otherwise video is already visible)
        if (hasThumbnail) {
          item.addEventListener('mouseenter', function() {
            video.play().catch(err => {
              console.log('Video play failed:', err);
            });
          });
          
          // Pause video when mouse leaves
          item.addEventListener('mouseleave', function() {
            video.pause();
            video.currentTime = 0; // Reset to beginning
          });
        } else {
          // For videos without thumbnails, play on hover but keep first frame visible when not hovering
          item.addEventListener('mouseenter', function() {
            if (!item.classList.contains('expanded')) {
              video.play().catch(err => {
                console.log('Video play failed:', err);
              });
            }
          });
          
          item.addEventListener('mouseleave', function() {
            if (!item.classList.contains('expanded')) {
              video.pause();
              video.currentTime = 0; // Reset to beginning to show first frame
            }
          });
        }
        
        // Handle video loading
        video.addEventListener('loadeddata', function() {
          // Video is ready
        });
      }
    });
  }
  
  // Setup video hover
  setupVideoHover();

  // Add click handlers to gallery items
  document.addEventListener('click', function(e) {
    const galleryItem = e.target.closest('.mosaic-item');
    if (galleryItem) {
      allGalleryItems = getAllGalleryItemsForLightbox();
      const index = allGalleryItems.indexOf(galleryItem);
      if (index !== -1) {
        openLightbox(index);
      }
    }
  });

  // Close lightbox
  if (lightboxClose) {
    lightboxClose.addEventListener('click', function(e) {
      e.stopPropagation();
      closeLightbox();
    });
  }

  if (lightbox) {
    // Close when clicking on backdrop
    const backdrop = lightbox.querySelector('.lightbox-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function(e) {
        e.stopPropagation();
        closeLightbox();
      });
    }
    
    // Close when clicking on lightbox itself (but not on content)
    lightbox.addEventListener('click', function(e) {
      // Only close if clicking directly on backdrop or lightbox itself (not on content)
      if (e.target === lightbox || e.target === backdrop || e.target.classList.contains('lightbox-backdrop')) {
        closeLightbox();
      }
    });
    
    // Prevent closing when clicking on content
    const lightboxContent = lightbox.querySelector('.lightbox-content');
    if (lightboxContent) {
      lightboxContent.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }
  }

  // Navigation
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', function(e) {
      e.stopPropagation();
      if (currentLightboxIndex > 0) {
        openLightbox(currentLightboxIndex - 1);
      }
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', function(e) {
      e.stopPropagation();
      if (currentLightboxIndex < allGalleryItems.length - 1) {
        openLightbox(currentLightboxIndex + 1);
      }
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (currentLightboxIndex > 0) {
        openLightbox(currentLightboxIndex - 1);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (currentLightboxIndex < allGalleryItems.length - 1) {
        openLightbox(currentLightboxIndex + 1);
      }
    }
  });

  // Swipe navigation for mobile with drag animation
  // Works in mobile emulation in DevTools too
  function setupSwipeNavigation() {
    let touchStartX = 0;
    let touchCurrentX = 0;
    let isDragging = false;
    const minSwipeDistance = 100;
    const maxDragDistance = window.innerWidth * 0.5; // Max 50% of screen width
    
    if (!lightbox || !lightboxMedia) return;
    
    // Get or wait for media element
    function getMediaElement() {
      return lightboxMedia.querySelector('img, video');
    }
    
    // Reset transform
    function resetTransform() {
      const mediaElement = getMediaElement();
      if (mediaElement) {
        mediaElement.style.transform = 'translateX(0)';
        mediaElement.style.opacity = '1';
      }
    }
    
    // Handle drag (works for both touch and mouse)
    function handleDragStart(e) {
      if (!lightbox.classList.contains('active')) return;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      touchStartX = clientX;
      touchCurrentX = touchStartX;
      isDragging = true;
      
      const mediaElement = getMediaElement();
      if (mediaElement) {
        mediaElement.style.transition = 'none';
      }
      
      // Prevent default for mouse events
      if (!e.touches) {
        e.preventDefault();
      }
    }
    
    function handleDragMove(e) {
      if (!lightbox.classList.contains('active') || !isDragging) return;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      touchCurrentX = clientX;
      const deltaX = touchCurrentX - touchStartX;
      
      // Limit drag distance
      const limitedDeltaX = Math.max(-maxDragDistance, Math.min(maxDragDistance, deltaX));
      
      // Calculate opacity based on drag distance
      const opacity = 1 - Math.abs(limitedDeltaX) / maxDragDistance * 0.5;
      
      // Apply transform in real-time
      const mediaElement = getMediaElement();
      if (mediaElement) {
        mediaElement.style.transform = `translateX(${limitedDeltaX}px)`;
        mediaElement.style.opacity = opacity;
      }
      
      // Prevent default for mouse events
      if (!e.touches) {
        e.preventDefault();
      }
    }
    
    function handleDragEnd(e) {
      if (!lightbox.classList.contains('active') || !isDragging) return;
      
      isDragging = false;
      const deltaX = touchCurrentX - touchStartX;
      
      // Re-enable transition
      const mediaElement = getMediaElement();
      if (mediaElement) {
        mediaElement.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease';
      }
      
      if (Math.abs(deltaX) > minSwipeDistance) {
        // Swipe detected - navigate to next/previous
        if (deltaX > 0 && currentLightboxIndex > 0) {
          // Swipe right - go to previous
          if (mediaElement) {
            mediaElement.style.transform = `translateX(${window.innerWidth}px)`;
            mediaElement.style.opacity = '0';
          }
          setTimeout(() => {
            openLightbox(currentLightboxIndex - 1);
            resetTransform();
          }, 50);
        } else if (deltaX < 0 && currentLightboxIndex < allGalleryItems.length - 1) {
          // Swipe left - go to next
          if (mediaElement) {
            mediaElement.style.transform = `translateX(-${window.innerWidth}px)`;
            mediaElement.style.opacity = '0';
          }
          setTimeout(() => {
            openLightbox(currentLightboxIndex + 1);
            resetTransform();
          }, 50);
        } else {
          // Not enough distance or at boundary - snap back
          resetTransform();
        }
      } else {
        // Not enough distance - snap back
        resetTransform();
      }
    }
    
    // Touch events (for real mobile devices)
    lightbox.addEventListener('touchstart', handleDragStart, { passive: true });
    lightbox.addEventListener('touchmove', handleDragMove, { passive: true });
    lightbox.addEventListener('touchend', handleDragEnd, { passive: true });
    
    // Mouse events (for DevTools mobile emulation and desktop testing)
    // Only enable on mobile breakpoint or when in mobile emulation
    const isMobileView = window.innerWidth <= 768;
    if (isMobileView) {
      lightbox.addEventListener('mousedown', handleDragStart);
      lightbox.addEventListener('mousemove', handleDragMove);
      lightbox.addEventListener('mouseup', handleDragEnd);
      lightbox.addEventListener('mouseleave', handleDragEnd); // Handle mouse leaving element
    }
  }
  
  setupSwipeNavigation();
});

