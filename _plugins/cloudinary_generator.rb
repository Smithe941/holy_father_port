require 'cloudinary'

# Load environment variables from .env file
begin
  require 'dotenv'
  Dotenv.load
rescue LoadError
  # dotenv gem not available, try to read from environment variables directly
end

module Jekyll
  class CloudinaryGenerator < Generator
    safe true
    priority :high

    def generate(site)
      # Try to get credentials from environment variables first, then from config
      cloud_name = ENV['CLOUDINARY_CLOUD_NAME'] || site.config.dig('cloudinary', 'cloud_name')
      api_key = ENV['CLOUDINARY_API_KEY'] || site.config.dig('cloudinary', 'api_key')
      api_secret = ENV['CLOUDINARY_API_SECRET'] || site.config.dig('cloudinary', 'api_secret')
      
      return if cloud_name.nil? || cloud_name.empty? || api_key.nil? || api_secret.nil?
      
      # Configure Cloudinary
      Cloudinary.config(
        cloud_name: cloud_name,
        api_key: api_key,
        api_secret: api_secret
      )
      
      Jekyll.logger.info "Cloudinary:", "Fetching media from Cloudinary..."
      
      begin
        # Fetch resources from collections
        media_data = fetch_cloudinary_media_from_collections(cloud_name)
        
        # Generate _data/media.yml content
        media_yml = generate_media_yml(media_data)
        
        # Write to _data/media.yml
        data_dir = File.join(site.source, '_data')
        FileUtils.mkdir_p(data_dir) unless File.directory?(data_dir)
        
        media_file = File.join(data_dir, 'media.yml')
        File.write(media_file, media_yml)
        
        Jekyll.logger.info "Cloudinary:", "Generated _data/media.yml from Cloudinary"
        
        # Reload data
        site.data['media'] = YAML.safe_load(media_yml)
      rescue => e
        Jekyll.logger.error "Cloudinary:", "Error fetching from Cloudinary: #{e.message}"
        Jekyll.logger.error "Cloudinary:", e.backtrace.join("\n")
      end
    end

    private

    def fetch_cloudinary_media_from_collections(cloud_name)
      media_data = {
        'hero' => nil,
        'main' => [],
        'galleries' => {}
      }
      
      all_resources = fetch_all_resources
      
      # Fetch hero
      Jekyll.logger.info "Cloudinary:", "Fetching hero..."
      begin
        hero_resources = filter_resources(all_resources, asset_folder: ['holy_father_port/main/hero', 'hero', 'holy_father_port/hero'])
        hero_resources.concat(list_resources("holy_father_port/main/hero")['resources'] || [])
        hero_resources.uniq! { |r| r['public_id'] }
        
        if hero_resources.any?
          hero = hero_resources.first
          media_data['hero'] = build_media_item(cloud_name, hero, 'Hero Image')
          Jekyll.logger.info "Cloudinary:", "Hero photo: #{hero['public_id']}"
        end
      rescue => e
        Jekyll.logger.warn "Cloudinary:", "Error fetching hero: #{e.message}"
      end
      
      # Fetch main collection
      Jekyll.logger.info "Cloudinary:", "Fetching main collection..."
      begin
        main_by_collection = filter_resources(all_resources, asset_folder: ['holy_father_port/main', 'main'], exclude: ['hero', 'galleries', 'sample'])
        main_by_public_id = filter_resources(all_resources, public_id_contains: 'main', exclude: ['hero', 'galleries', 'sample'], require_empty_asset_folder: true)
        main_by_folder = (list_resources("holy_father_port/main")['resources'] || []).reject { |r| r['public_id'].include?('/hero/') || r['public_id'].include?('sample') }
        
        main_resources = (main_by_collection + main_by_public_id + main_by_folder).uniq { |r| r['public_id'] }
        # Additional filter to exclude samples
        main_resources.reject! { |r| r['public_id'].downcase.include?('sample') || r['public_id'].downcase.include?('cld-sample') }
        
        Jekyll.logger.info "Cloudinary:", "Total unique main resources: #{main_resources.length}"
        
        main_resources.each do |resource|
          media_data['main'] << build_media_item(cloud_name, resource)
        end
      rescue => e
        Jekyll.logger.warn "Cloudinary:", "Error fetching main collection: #{e.message}"
      end
      
      # Fetch galleries
      Jekyll.logger.info "Cloudinary:", "Fetching galleries..."
      begin
        galleries_by_asset_folder = filter_resources(all_resources, asset_folder_contains: 'galleries/')
        galleries_by_public_id = filter_resources(all_resources, public_id_contains: 'galleries/')
        
        all_galleries_resources = (galleries_by_asset_folder + galleries_by_public_id).uniq { |r| r['public_id'] }
        Jekyll.logger.info "Cloudinary:", "Total unique galleries resources: #{all_galleries_resources.length}"
      
        if all_galleries_resources.any?
          galleries_hash = group_galleries_by_path(cloud_name, all_galleries_resources)
          
          galleries_hash.sort_by { |k, v| v['number'] }.each do |key, gallery_data|
            gallery_key = gallery_data['name']
            # Find first photo for title_photo
            title_photo = gallery_data['items'].find { |item| item['type'] == 'photo' }
            
            # If no photo found, generate thumbnail from first video using Cloudinary
            if !title_photo && gallery_data['items'].any?
              first_item = gallery_data['items'].first
              if first_item['type'] == 'video'
                # Extract public_id from video URL
                # URL format: https://res.cloudinary.com/cloud_name/video/upload/public_id.mp4
                video_url = first_item['url']
                if video_url.include?('/video/upload/')
                  # Extract public_id from URL
                  parts = video_url.split('/video/upload/')
                  if parts.length > 1
                    public_id_with_ext = parts[1]
                    public_id = public_id_with_ext.gsub(/\.(mp4|mov|avi|webm)$/i, '')
                    
                    # Generate thumbnail from video using Cloudinary
                    # Use video/upload/so_0 (start offset 0) to get first frame as image
                    thumbnail_url = "https://res.cloudinary.com/#{cloud_name}/video/upload/so_0,w_1920,c_limit,q_auto:good,f_jpg/#{public_id}"
                    
                    title_photo = {
                      'type' => 'photo',
                      'url' => thumbnail_url,
                      'alt' => first_item['alt']
                    }
                  end
                end
              end
            end
            
            media_data['galleries'][gallery_key] = {
              'title' => gallery_data['title'],
              'title_photo' => title_photo ? { 'url' => title_photo['url'], 'alt' => title_photo['alt'] } : nil,
              'items' => gallery_data['items']
            }
          end
        end
      rescue => e
        Jekyll.logger.warn "Cloudinary:", "Error fetching galleries: #{e.message}"
      end
      
      media_data
    end

    def fetch_all_resources
      images = Cloudinary::Api.resources(type: 'upload', max_results: 500, resource_type: 'image')
      videos = Cloudinary::Api.resources(type: 'upload', max_results: 500, resource_type: 'video')
      (images['resources'] || []) + (videos['resources'] || [])
    end

    def filter_resources(resources, asset_folder: nil, asset_folder_contains: nil, public_id_contains: nil, exclude: [], require_empty_asset_folder: false)
      resources.select do |resource|
        asset_folder_val = resource['asset_folder'] || ''
        public_id = resource['public_id'] || ''
        
        # Check asset_folder filters
        matches_asset_folder = if asset_folder
          Array(asset_folder).any? { |af| asset_folder_val == af || (af.is_a?(String) && asset_folder_val.include?(af)) }
        elsif asset_folder_contains
          asset_folder_val.include?(asset_folder_contains)
        else
          true
        end
        
        # Check public_id filters
        matches_public_id = if public_id_contains
          if require_empty_asset_folder
            (asset_folder_val.nil? || asset_folder_val.empty?) && public_id.include?(public_id_contains)
          else
            public_id.include?(public_id_contains)
          end
        else
          true
        end
        
        # Check exclusions
        excluded = exclude.any? do |excl|
          asset_folder_val.include?(excl) || public_id.include?(excl)
        end
        
        matches_asset_folder && matches_public_id && !excluded
      end
    end

    def build_media_item(cloud_name, resource, default_alt = nil)
      alt_text = extract_context_value(resource, 'alt') || default_alt || resource['public_id'].split('/').last
      
      if resource['resource_type'] == 'video'
        # For videos, use full URL and optional thumbnail
        item = {
          'type' => 'video',
          'url' => get_cloudinary_url(cloud_name, resource['public_id'], resource['format'], resource['resource_type']),
          'alt' => alt_text
        }
        thumbnail = extract_context_value(resource, 'thumbnail')
        item['thumbnail'] = thumbnail if thumbnail
      else
        # For photos, generate both thumbnail and full-size URLs
        # Thumbnail: width 400px, limit size, auto quality and format
        thumbnail_url = get_cloudinary_url(cloud_name, resource['public_id'], resource['format'], resource['resource_type'], 'w_400,c_limit,q_auto,f_auto')
        # Full size: limit width to 1920px (sufficient for most screens), economy quality for faster loading, auto format
        # Options: w_1920 (max width), c_limit (maintain aspect ratio), q_auto:eco (economy quality, smaller file), f_auto (auto format like WebP)
        # Alternative options:
        # - q_auto:best - highest quality (largest file)
        # - q_auto:good - good quality (balanced)
        # - q_auto:eco - economy quality (smaller file, faster loading) - CURRENT
        # - q_80 - specific quality 80% (0-100)
        # - q_75 - specific quality 75% (0-100)
        # - w_2048 - max width 2048px (for larger screens)
        full_url = get_cloudinary_url(cloud_name, resource['public_id'], resource['format'], resource['resource_type'], 'w_1080,c_limit,q_auto:eco,f_auto')
        
        item = {
          'type' => 'photo',
          'url' => full_url, # Full-size URL for lightbox
          'thumbnail_url' => thumbnail_url, # Thumbnail URL for gallery
          'alt' => alt_text
        }
      end
      
      item
    end

    def group_galleries_by_path(cloud_name, resources)
      galleries_hash = {}
      
      resources.each do |resource|
        path = extract_gallery_path(resource)
        next unless path
        
        gallery_num, gallery_name = path
        gallery_key = "#{gallery_num}_#{gallery_name}"
        
        galleries_hash[gallery_key] ||= {
          'number' => gallery_num.to_i,
          'name' => gallery_name,
          'title' => gallery_name.split('_').map(&:capitalize).join(' '),
          'items' => []
        }
        
        galleries_hash[gallery_key]['items'] << build_media_item(cloud_name, resource)
      end
      
      galleries_hash
    end

    def extract_gallery_path(resource)
      asset_folder = resource['asset_folder'] || ''
      public_id = resource['public_id'] || ''
      
      path_to_parse = nil
      if asset_folder.include?('galleries/')
        path_to_parse = asset_folder.sub(/.*?galleries\//, '')
      elsif public_id.include?('galleries/')
        path_to_parse = public_id.sub(/.*?galleries\//, '')
      end
      
      return nil unless path_to_parse
      
      path_parts = path_to_parse.split('/')
      return nil if path_parts.length < 2
      
      [path_parts[0], path_parts[1]]
    end

    def list_resources(folder)
      all_resources = []
      
      begin
        # Fetch images
        Jekyll.logger.info "Cloudinary:", "Listing images with prefix: #{folder}"
        image_result = Cloudinary::Api.resources(
          type: 'upload',
          prefix: folder,
          max_results: 500,
          resource_type: 'image'
        )
        
        if image_result && image_result['resources']
          Jekyll.logger.info "Cloudinary:", "Found #{image_result['resources'].length} images"
          image_result['resources'].each { |r| r['resource_type'] = 'image' }
          all_resources.concat(image_result['resources'])
        else
          Jekyll.logger.info "Cloudinary:", "No images found for prefix: #{folder}"
        end
      rescue => e
        Jekyll.logger.warn "Cloudinary:", "Error fetching images: #{e.message}"
        Jekyll.logger.warn "Cloudinary:", e.backtrace.first(3).join("\n")
      end
      
      begin
        # Fetch videos
        Jekyll.logger.info "Cloudinary:", "Listing videos with prefix: #{folder}"
        video_result = Cloudinary::Api.resources(
          type: 'upload',
          prefix: folder,
          max_results: 500,
          resource_type: 'video'
        )
        
        if video_result && video_result['resources']
          Jekyll.logger.info "Cloudinary:", "Found #{video_result['resources'].length} videos"
          video_result['resources'].each { |r| r['resource_type'] = 'video' }
          all_resources.concat(video_result['resources'])
        else
          Jekyll.logger.info "Cloudinary:", "No videos found for prefix: #{folder}"
        end
      rescue => e
        Jekyll.logger.warn "Cloudinary:", "Error fetching videos: #{e.message}"
        Jekyll.logger.warn "Cloudinary:", e.backtrace.first(3).join("\n")
      end
      
      Jekyll.logger.info "Cloudinary:", "Total resources found: #{all_resources.length}"
      { 'resources' => all_resources }
    rescue => e
      Jekyll.logger.error "Cloudinary:", "Error in list_resources: #{e.message}"
      Jekyll.logger.error "Cloudinary:", e.backtrace.first(5).join("\n")
      { 'resources' => [] }
    end

    def get_cloudinary_url(cloud_name, public_id, format, resource_type = 'image', transformations = nil)
      # Remove format extension from public_id if present
      clean_public_id = public_id.gsub(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i, '')
      
      # Build transformation string if provided
      transform_str = transformations ? "#{transformations}/" : ""
      
      if resource_type == 'video'
        "https://res.cloudinary.com/#{cloud_name}/video/upload/#{transform_str}#{clean_public_id}.#{format || 'mp4'}"
      else
        "https://res.cloudinary.com/#{cloud_name}/image/upload/#{transform_str}#{clean_public_id}.#{format || 'jpg'}"
      end
    end

    def extract_context_value(resource, key)
      return nil unless resource['context']
      
      # Cloudinary context can be in different formats
      if resource['context'].is_a?(Hash)
        return resource['context'][key] if resource['context'][key]
        
        # Try custom fields
        if resource['context']['custom']
          return resource['context']['custom'][key]
        end
      elsif resource['context'].is_a?(Array)
        # Context as array of key-value pairs
        context_hash = resource['context'].each_with_object({}) do |item, hash|
          hash[item['key']] = item['value'] if item.is_a?(Hash) && item['key']
        end
        return context_hash[key]
      end
      
      nil
    end

    def generate_media_yml(media_data)
      yml = "# Auto-generated from Cloudinary - DO NOT EDIT MANUALLY\n"
      yml += "# This file is regenerated on each build\n\n"
      
      # Hero
      if media_data['hero']
        yml += "# Hero photo (full width at top)\n"
        yml += "hero:\n"
        yml += "  url: \"#{media_data['hero']['url']}\"\n"
        yml += "  alt: \"#{media_data['hero']['alt']}\"\n\n"
      end
      
      # Main gallery
      yml += "# Main gallery - фото та відео разом\n"
      yml += "main:\n"
      media_data['main'].each do |item|
        yml += "  - type: \"#{item['type']}\"\n"
        yml += "    url: \"#{item['url']}\"\n"
        yml += "    alt: \"#{item['alt']}\"\n"
        if item['thumbnail_url']
          yml += "    thumbnail_url: \"#{item['thumbnail_url']}\"\n"
        end
        if item['thumbnail']
          yml += "    thumbnail: \"#{item['thumbnail']}\"\n"
        end
        yml += "\n"
      end
      
      # Galleries
      if media_data['galleries'].any?
        yml += "# Galleries - перелік галерей\n"
        yml += "galleries:\n"
        media_data['galleries'].each do |gallery_key, gallery_data|
          yml += "  #{gallery_key}:\n"
          yml += "    title: \"#{gallery_data['title']}\"\n"
          if gallery_data['title_photo']
            yml += "    title_photo:\n"
            yml += "      url: \"#{gallery_data['title_photo']['url']}\"\n"
            yml += "      alt: \"#{gallery_data['title_photo']['alt']}\"\n"
          end
          yml += "    items:\n"
          gallery_data['items'].each do |item|
            yml += "      - type: \"#{item['type']}\"\n"
            yml += "        url: \"#{item['url']}\"\n"
            yml += "        alt: \"#{item['alt']}\"\n"
            if item['thumbnail_url']
              yml += "        thumbnail_url: \"#{item['thumbnail_url']}\"\n"
            end
            if item['thumbnail']
              yml += "        thumbnail: \"#{item['thumbnail']}\"\n"
            end
          end
          yml += "\n"
        end
      end
      
      yml
    end
  end
end

