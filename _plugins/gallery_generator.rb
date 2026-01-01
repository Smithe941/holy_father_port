module Jekyll
  class GalleryGenerator < Generator
    safe true
    priority :normal

    def generate(site)
      return unless site.data['media'] && site.data['media']['galleries']

      galleries = site.data['media']['galleries']
      
      galleries.each do |gallery_key, gallery_data|
        gallery_key_str = gallery_key.to_s
        
        # Create gallery page
        page = GalleryPage.new(site, site.source, 'gallery', gallery_key_str, gallery_data)
        site.pages << page
      end
    end
  end

  class GalleryPage < Page
    def initialize(site, base, dir, gallery_key, gallery_data)
      @site = site
      @base = base
      @dir = dir
      @name = "#{gallery_key}.html"
      @gallery_key = gallery_key

      self.process(@name)
      
      # Read the template
      template_path = File.join(base, '_layouts', 'gallery.html')
      if File.exist?(template_path)
        template = File.read(template_path)
      else
        # Use inline template if layout doesn't exist
        template = read_template
      end
      
      # Set page data
      self.data = {}
      self.data['layout'] = 'default'
      self.data['title'] = "#{gallery_data['title']} Gallery"
      self.data['permalink'] = "/gallery/#{gallery_key}/"
      
      # Render template with Liquid
      self.content = template
    end

    def read_template
      <<~TEMPLATE
        <script type="application/json" id="galleries-data">
        {% raw %}{{% endraw %}
        {% for gallery in site.data.media.galleries %}
          {% assign gallery_key = gallery[0] %}
          {% assign gallery_data = gallery[1] %}
          "{{ gallery_key }}": {
            "title": "{{ gallery_data.title }}",
            "items": [
              {% for item in gallery_data.items %}
              {
                "type": "{{ item.type }}",
                "url": "{{ item.url }}",
                "alt": "{{ item.alt | escape }}"{% if item.thumbnail %},"thumbnail": "{{ item.thumbnail }}"{% endif %}
              }{% unless forloop.last %},{% endunless %}
              {% endfor %}
            ]
          }{% unless forloop.last %},{% endunless %}
        {% endfor %}
        {% raw %}}{% endraw %}
        </script>

        <div class="gallery-page">
          <div class="gallery-header">
            <h1 class="gallery-page-title" id="gallery-title">Loading...</h1>
          </div>
          
          <div class="gallery-section">
            <div class="gallery-container mosaic-grid" id="gallery-container">
              <!-- Gallery items will be loaded dynamically -->
            </div>
          </div>
        </div>

        <script>
          // Show back button if we're on a gallery page
          function showGalleryBackButton() {
            const path = window.location.pathname;
            const backButton = document.getElementById('gallery-back-button');
            if (backButton && (path.includes('/gallery/') || path === '/gallery.html' || path.includes('/holy_father_port/gallery/'))) {
              backButton.style.display = 'flex';
            }
          }

          // Get gallery key from URL
          function getGalleryKeyFromURL() {
            const path = window.location.pathname;
            const baseurl = "{{ site.baseurl }}";
            
            // Remove baseurl from path if present
            let relativePath = path;
            if (baseurl && path.startsWith(baseurl)) {
              relativePath = path.substring(baseurl.length);
            }
            
            // Match both /gallery/key, /gallery/key.html, and /gallery/key/
            const match = relativePath.match(/\\/gallery\\/([^\\/\\.]+)/);
            if (match) {
              return match[1];
            }
            
            // Also try matching with .html extension
            const matchHtml = relativePath.match(/\\/gallery\\/([^\\/]+)\\.html/);
            if (matchHtml) {
              return matchHtml[1];
            }
            
            // Fallback: try to get from query string or hash
            const urlParams = new URLSearchParams(window.location.search);
            const galleryKey = urlParams.get('gallery');
            if (galleryKey) {
              return galleryKey;
            }
            
            // Try hash
            if (window.location.hash) {
              const hashKey = window.location.hash.substring(1);
              if (hashKey) {
                return hashKey;
              }
            }
            
            // For static pages, return the gallery key from permalink
            return '#{@gallery_key}';
          }

          // Load gallery data
          function loadGallery() {
            const galleryKey = getGalleryKeyFromURL();
            if (!galleryKey) {
              document.getElementById('gallery-container').innerHTML = '<p>Gallery not found</p>';
              document.getElementById('gallery-title').textContent = 'Gallery Not Found';
              return;
            }

            // Get gallery data from embedded JSON
            const dataScript = document.getElementById('galleries-data');
            if (!dataScript) {
              document.getElementById('gallery-container').innerHTML = '<p>Gallery data not found</p>';
              return;
            }

            let galleryData;
            try {
              galleryData = JSON.parse(dataScript.textContent);
            } catch (e) {
              console.error('Error parsing gallery data:', e);
              document.getElementById('gallery-container').innerHTML = '<p>Error loading gallery data</p>';
              return;
            }

            if (!galleryData[galleryKey]) {
              document.getElementById('gallery-container').innerHTML = '<p>Gallery not found</p>';
              document.getElementById('gallery-title').textContent = 'Gallery Not Found';
              return;
            }

            const gallery = galleryData[galleryKey];
            document.getElementById('gallery-title').textContent = gallery.title;

            // Render gallery items
            const container = document.getElementById('gallery-container');
            container.innerHTML = '';

            gallery.items.forEach((item, index) => {
              const itemDiv = document.createElement('div');
              itemDiv.className = 'gallery-item mosaic-item';
              itemDiv.setAttribute('data-type', item.type);
              itemDiv.setAttribute('data-url', item.url);
              itemDiv.setAttribute('data-alt', item.alt || '');
              
              if (item.type === 'video') {
                itemDiv.classList.add('video-item');
                if (!item.thumbnail) {
                  itemDiv.classList.add('no-thumbnail');
                }
                if (item.thumbnail) {
                  itemDiv.setAttribute('data-thumbnail', item.thumbnail);
                }
              }

              const videoIconPath = '{{ "/assets/svg/video.svg" | relative_url }}';
              
              if (item.type === 'photo') {
                const img = document.createElement('img');
                img.className = 'gallery-image';
                // Use thumbnail_url for gallery, but keep full url in data-url for lightbox
                img.src = item.thumbnail_url || item.url;
                img.alt = item.alt || '';
                img.loading = 'lazy';
                itemDiv.appendChild(img);
              } else {
                const videoWrapper = document.createElement('div');
                videoWrapper.className = 'video-wrapper';
                
                const video = document.createElement('video');
                video.className = 'gallery-video';
                video.preload = 'metadata';
                video.muted = true;
                video.loop = true;
                const source = document.createElement('source');
                source.src = item.url;
                source.type = 'video/mp4';
                video.appendChild(source);
                videoWrapper.appendChild(video);
                
                if (item.thumbnail) {
                  const thumbnail = document.createElement('img');
                  thumbnail.className = 'video-thumbnail';
                  thumbnail.src = item.thumbnail;
                  thumbnail.alt = item.alt || '';
                  thumbnail.loading = 'lazy';
                  videoWrapper.appendChild(thumbnail);
                }
                
                const videoIcon = document.createElement('div');
                videoIcon.className = 'video-icon';
                const iconImg = document.createElement('img');
                iconImg.src = videoIconPath;
                iconImg.alt = 'Video icon';
                videoIcon.appendChild(iconImg);
                videoWrapper.appendChild(videoIcon);
                
                itemDiv.appendChild(videoWrapper);
              }

              container.appendChild(itemDiv);
            });

            // Reinitialize gallery functionality after a short delay
            setTimeout(() => {
              // Re-run setup functions from main.js if they exist
              if (window.setupMosaicGrid) {
                window.setupMosaicGrid();
              }
              if (window.setupVideoHover) {
                window.setupVideoHover();
              }
            }, 200);
          }

          // Load gallery when page loads
          document.addEventListener('DOMContentLoaded', function() {
            showGalleryBackButton();
            loadGallery();
          });
        </script>
      TEMPLATE
    end
  end
end

