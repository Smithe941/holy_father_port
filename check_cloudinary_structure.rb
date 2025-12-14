#!/usr/bin/env ruby

require 'cloudinary'
require 'dotenv'

# Load environment variables
Dotenv.load

# Configure Cloudinary
Cloudinary.config(
  cloud_name: ENV['CLOUDINARY_CLOUD_NAME'],
  api_key: ENV['CLOUDINARY_API_KEY'],
  api_secret: ENV['CLOUDINARY_API_SECRET']
)

puts "=" * 80
puts "Cloudinary Folder Structure Analysis"
puts "=" * 80
puts

# Get all resources
puts "Fetching all resources..."
all_images = Cloudinary::Api.resources(
  type: 'upload',
  max_results: 500,
  resource_type: 'image'
)
all_videos = Cloudinary::Api.resources(
  type: 'upload',
  max_results: 500,
  resource_type: 'video'
)

all_resources = (all_images['resources'] || []) + (all_videos['resources'] || [])

puts "Total resources found: #{all_resources.length}"
puts

# Group by asset_folder
puts "=" * 80
puts "Resources grouped by asset_folder:"
puts "=" * 80

asset_folders = {}
all_resources.each do |resource|
  asset_folder = resource['asset_folder'] || '(no asset_folder)'
  asset_folders[asset_folder] ||= []
  asset_folders[asset_folder] << resource
end

asset_folders.sort.each do |folder, resources|
  puts
  puts "📁 Asset Folder: #{folder}"
  puts "   Count: #{resources.length}"
  puts "   Resources:"
  resources.first(10).each do |resource|
    public_id = resource['public_id']
    resource_type = resource['resource_type']
    format = resource['format']
    puts "     - #{public_id} (#{resource_type}/#{format})"
  end
  if resources.length > 10
    puts "     ... and #{resources.length - 10} more"
  end
end

# Group by public_id folder structure
puts
puts "=" * 80
puts "Resources grouped by public_id folder structure:"
puts "=" * 80

folder_structure = {}
all_resources.each do |resource|
  public_id = resource['public_id']
  if public_id.include?('/')
    folder_path = public_id.split('/')[0..-2].join('/')
    filename = public_id.split('/').last
    folder_structure[folder_path] ||= []
    folder_structure[folder_path] << filename
  else
    folder_structure['(root)'] ||= []
    folder_structure['(root)'] << public_id
  end
end

folder_structure.sort.each do |folder, files|
  puts
  puts "📁 Folder: #{folder}"
  puts "   Count: #{files.length}"
  puts "   Files:"
  files.first(10).each do |file|
    puts "     - #{file}"
  end
  if files.length > 10
    puts "     ... and #{files.length - 10} more"
  end
end

# Check for main collection resources
puts
puts "=" * 80
puts "Resources with 'main' in asset_folder or public_id:"
puts "=" * 80

main_resources = all_resources.select do |resource|
  asset_folder = resource['asset_folder'] || ''
  public_id = resource['public_id'] || ''
  (asset_folder.include?('main') || public_id.include?('main')) &&
  !asset_folder.include?('hero') &&
  !public_id.include?('hero') &&
  !asset_folder.include?('galleries') &&
  !public_id.include?('galleries')
end

puts "Found #{main_resources.length} resources:"
main_resources.each do |resource|
  asset_folder = resource['asset_folder'] || '(no asset_folder)'
  public_id = resource['public_id']
  puts "  - #{public_id}"
  puts "    asset_folder: #{asset_folder}"
end

# Check for hero collection resources
puts
puts "=" * 80
puts "Resources with 'hero' in asset_folder or public_id:"
puts "=" * 80

hero_resources = all_resources.select do |resource|
  asset_folder = resource['asset_folder'] || ''
  public_id = resource['public_id'] || ''
  asset_folder.include?('hero') || public_id.include?('hero')
end

puts "Found #{hero_resources.length} resources:"
hero_resources.each do |resource|
  asset_folder = resource['asset_folder'] || '(no asset_folder)'
  public_id = resource['public_id']
  puts "  - #{public_id}"
  puts "    asset_folder: #{asset_folder}"
end

# Check for galleries
puts
puts "=" * 80
puts "Resources with 'galleries' in public_id:"
puts "=" * 80

gallery_resources = all_resources.select do |resource|
  public_id = resource['public_id'] || ''
  public_id.include?('galleries')
end

puts "Found #{gallery_resources.length} resources:"
gallery_resources.each do |resource|
  public_id = resource['public_id']
  asset_folder = resource['asset_folder'] || '(no asset_folder)'
  puts "  - #{public_id}"
  puts "    asset_folder: #{asset_folder}"
end

puts
puts "=" * 80
puts "Analysis complete!"
puts "=" * 80

