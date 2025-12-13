// Main JavaScript file for photographer portfolio

document.addEventListener('DOMContentLoaded', function() {
  // Burger menu functionality
  const burgerButton = document.getElementById('burger-menu-button');
  const fullscreenMenu = document.getElementById('fullscreen-menu');
  const menuLinks = document.querySelectorAll('.menu-link');

  function toggleMenu() {
    const isActive = fullscreenMenu.classList.contains('active');
    
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
  }

  // Toggle menu on burger button click
  if (burgerButton) {
    burgerButton.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleMenu();
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
      // Skip if item is currently expanded
      if (item.classList.contains('expanded')) {
        return;
      }
      
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

  // Recalculate on window resize (with debounce)
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      // If there's an expanded item, contract it on resize
      if (currentExpandedItem) {
        contractImage(currentExpandedItem);
        currentExpandedItem = null;
      }
      setupMosaicGrid();
    }, 250);
  });

  // Interactive gallery - expand/contract images on click
  let currentExpandedItem = null;
  
  function updateNavigationButtons(item) {
    if (!item) return;
    
    const allItems = getAllGalleryItems();
    const currentIndex = allItems.indexOf(item);
    const prevButton = item.querySelector('.nav-button-prev');
    const nextButton = item.querySelector('.nav-button-next');
    
    // Update prev button
    if (prevButton) {
      if (currentIndex === 0) {
        prevButton.style.opacity = '0.3';
        prevButton.style.cursor = 'not-allowed';
        prevButton.style.pointerEvents = 'none';
      } else {
        prevButton.style.opacity = '1';
        prevButton.style.cursor = 'pointer';
        prevButton.style.pointerEvents = 'auto';
      }
    }
    
    // Update next button
    if (nextButton) {
      if (currentIndex === allItems.length - 1) {
        nextButton.style.opacity = '0.3';
        nextButton.style.cursor = 'not-allowed';
        nextButton.style.pointerEvents = 'none';
      } else {
        nextButton.style.opacity = '1';
        nextButton.style.cursor = 'pointer';
        nextButton.style.pointerEvents = 'auto';
      }
    }
  }
  
  window.expandImage = function(item) {
    // If there's already an expanded item, contract it first
    if (currentExpandedItem && currentExpandedItem !== item) {
      contractImage(currentExpandedItem);
    }
    
    // Don't close if clicking the same item - only expand if not already expanded
    if (currentExpandedItem === item) {
      return; // Already expanded, do nothing
    }
    
    // Store original grid spans and position
    const computedStyle = window.getComputedStyle(item);
    const originalColSpan = item.style.gridColumn || computedStyle.gridColumn || 'span 1';
    const originalRowSpan = item.style.gridRow || computedStyle.gridRow || 'span 1';
    
    item.dataset.originalColSpan = originalColSpan;
    item.dataset.originalRowSpan = originalRowSpan;
    
    // Calculate grid width to center the expanded image
    const gridContainer = document.querySelector('.mosaic-grid');
    const containerWidth = gridContainer.offsetWidth;
    const gap = parseInt(window.getComputedStyle(gridContainer).gap) || 8;
    
    // Estimate column count based on min column width (250px on desktop, 200px on tablet, 300px on mobile)
    const isMobile = window.innerWidth <= 576;
    const isTablet = window.innerWidth <= 768;
    const minColWidth = isMobile ? 300 : (isTablet ? 200 : 250);
    const estimatedColumnCount = Math.floor((containerWidth + gap) / (minColWidth + gap));
    
    // Expand to 3 rows height and center horizontally
    // Use 60-70% of grid width, but at least 2 columns and max available
    const colSpan = Math.max(2, Math.min(Math.floor(estimatedColumnCount * 0.65), estimatedColumnCount));
    
    item.classList.add('expanded');
    item.style.gridColumn = `span ${colSpan}`;
    item.style.gridRow = 'span 3';
    item.style.justifySelf = 'center';
    
    // Update navigation buttons with slight delay for smoother animation
    setTimeout(() => {
      updateNavigationButtons(item);
    }, 50);
    
    // If it's a video item, enable controls and play
    if (item.classList.contains('video-item')) {
      const video = item.querySelector('.gallery-video');
      if (video) {
        video.controls = true;
        video.muted = false; // Unmute when expanded
        video.loop = false; // Disable loop when expanded (user can control)
        video.play().catch(err => {
          console.log('Video play failed:', err);
        });
      }
    }
    
    // Scroll to the expanded image/video - center it perfectly
    setTimeout(() => {
      const rect = item.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const itemHeight = rect.height;
      const targetScroll = scrollTop + rect.top - (windowHeight / 2) + (itemHeight / 2);
      
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }, 150);
    
    currentExpandedItem = item;
  }
  
  window.contractImage = function(item) {
    item.classList.remove('expanded');
    
    // Hide navigation buttons
    const navButtons = item.querySelectorAll('.nav-button');
    navButtons.forEach(btn => {
      btn.style.opacity = '0';
    });
    
    // Reset video if it's a video item
    if (item.classList.contains('video-item')) {
      const video = item.querySelector('.gallery-video');
      if (video) {
        video.pause();
        video.currentTime = 0;
        video.controls = false;
        video.muted = true; // Mute again when closed
        video.loop = true; // Enable loop again when closed
      }
    }
    
    // Restore original grid spans
    if (item.dataset.originalColSpan) {
      item.style.gridColumn = item.dataset.originalColSpan;
    } else {
      item.style.gridColumn = '';
    }
    
    if (item.dataset.originalRowSpan) {
      item.style.gridRow = item.dataset.originalRowSpan;
    } else {
      item.style.gridRow = '';
    }
    
    item.style.justifySelf = '';
  }
  
  // Close button handler
  window.setupCloseButtons = function() {
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('close-button')) {
        e.stopPropagation();
        const item = e.target.closest('.mosaic-item');
        if (item && item.classList.contains('expanded')) {
          contractImage(item);
          currentExpandedItem = null;
        }
      }
    });
  }
  
  setupCloseButtons();
  
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

  // Navigation functions
  function getAllGalleryItems() {
    return Array.from(document.querySelectorAll('.mosaic-item'));
  }
  
  function getNextItem(currentItem) {
    const allItems = getAllGalleryItems();
    const currentIndex = allItems.indexOf(currentItem);
    if (currentIndex < allItems.length - 1) {
      return allItems[currentIndex + 1];
    }
    return null; // No next item
  }
  
  function getPrevItem(currentItem) {
    const allItems = getAllGalleryItems();
    const currentIndex = allItems.indexOf(currentItem);
    if (currentIndex > 0) {
      return allItems[currentIndex - 1];
    }
    return null; // No previous item
  }
  
  function navigateToItem(item) {
    if (item) {
      const wasExpanded = currentExpandedItem !== null;
      if (wasExpanded) {
        contractImage(currentExpandedItem);
      }
      setTimeout(() => {
        expandImage(item);
      }, wasExpanded ? 100 : 0);
    }
  }
  
  // Setup navigation buttons
  window.setupNavigationButtons = function() {
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('nav-button-prev')) {
        e.stopPropagation();
        const item = e.target.closest('.mosaic-item');
        if (item && item.classList.contains('expanded')) {
          const prevItem = getPrevItem(item);
          if (prevItem) {
            navigateToItem(prevItem);
          }
        }
      } else if (e.target.classList.contains('nav-button-next')) {
        e.stopPropagation();
        const item = e.target.closest('.mosaic-item');
        if (item && item.classList.contains('expanded')) {
          const nextItem = getNextItem(item);
          if (nextItem) {
            navigateToItem(nextItem);
          }
        }
      }
    });
  }
  
  setupNavigationButtons();

  // Add click handlers to gallery items (including videos)
  const galleryItems = document.querySelectorAll('.mosaic-item');
  galleryItems.forEach(item => {
    item.addEventListener('click', function(e) {
      // Don't expand if clicking buttons
      if (e.target.classList.contains('close-button') || 
          e.target.classList.contains('nav-button')) {
        return;
      }
      
      e.stopPropagation();
      expandImage(this);
    });
  });
  
  // Close expanded image when clicking outside (but not on buttons)
  document.addEventListener('click', function(e) {
    if (currentExpandedItem && 
        !currentExpandedItem.contains(e.target) && 
        !e.target.classList.contains('close-button') &&
        !e.target.classList.contains('nav-button')) {
      contractImage(currentExpandedItem);
      currentExpandedItem = null;
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!currentExpandedItem) return;
    
    if (e.key === 'Escape') {
      contractImage(currentExpandedItem);
      currentExpandedItem = null;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevItem = getPrevItem(currentExpandedItem);
      if (prevItem) {
        navigateToItem(prevItem);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextItem = getNextItem(currentExpandedItem);
      if (nextItem) {
        navigateToItem(nextItem);
      }
    }
  });
  
  // Swipe navigation for mobile
  function setupSwipeNavigation() {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50; // Minimum distance for swipe
    
    document.addEventListener('touchstart', function(e) {
      if (currentExpandedItem && currentExpandedItem.contains(e.target)) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
      if (!currentExpandedItem) return;
      
      if (currentExpandedItem.contains(e.target)) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        // Only trigger swipe if horizontal movement is greater than vertical (to avoid conflicts with scroll)
        if (absDeltaX > absDeltaY && absDeltaX > minSwipeDistance) {
          if (deltaX > 0) {
            // Swipe right - go to previous
            const prevItem = getPrevItem(currentExpandedItem);
            if (prevItem) {
              navigateToItem(prevItem);
            }
          } else {
            // Swipe left - go to next
            const nextItem = getNextItem(currentExpandedItem);
            if (nextItem) {
              navigateToItem(nextItem);
            }
          }
        }
      }
    }, { passive: true });
  }
  
  setupSwipeNavigation();
});

