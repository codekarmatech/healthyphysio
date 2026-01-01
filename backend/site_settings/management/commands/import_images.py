"""
Management command to import and compress images from frontend folder to backend media
Compresses images to WebP format for optimal performance
"""
import os
import shutil
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings

try:
    from PIL import Image
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

from site_settings.models import Service, ProcessStep, WhyChooseUs, HeroImage, Founder, PageSettings


class Command(BaseCommand):
    help = 'Import and compress images from frontend folder to backend media'

    # Image mapping configuration
    IMAGE_MAPPING = {
        # Hero carousel images
        'hero': [
            {'source': 'Physio-1.png', 'alt': 'Professional Physiotherapy Treatment', 'order': 1},
            {'source': 'Physios at home.png', 'alt': 'Home Physiotherapy Service', 'order': 2},
            {'source': 'Physio Consultation.png', 'alt': 'Physiotherapy Consultation', 'order': 3},
        ],
        # Service hero images (slug -> image filename)
        'services': {
            'orthopedic': 'Fitness Physio.png',
            'neurological': 'Stroke Hand Rehab.png',
            'geriatric': 'Geriatric Physio.png',
            'pediatric': 'Pediatric Physio.png',
            'womens-health': 'Gynac Physiotherapy.png',
            'cardiopulmonary': 'Physiotherapy collaage.png',
        },
        # Service card images
        'service_cards': {
            'pediatric': 'Pedia Physio.png',
        },
        # Team/About images - now used for founders
        'founders': [
            {
                'source': 'Team-1.png',
                'name': 'Dr. Rajavi Dixit',
                'title': 'Founder & Chief Neurological Physiotherapist',
                'founder_type': 'physio',
                'description': 'A young and highly experienced neurological physiotherapist with a passion for revolutionizing home-based healthcare. Dr. Rajavi Dixit founded PhysioWay with the vision of making quality physiotherapy accessible to everyone, combining clinical expertise with innovative technology.',
                'qualifications': 'Masters in Neurological Physiotherapy, Certified Neuro-Developmental Therapist, Advanced Stroke Rehabilitation Specialist, Digital Health Innovation Certified',
                'order': 1
            },
            {
                'source': 'Team-2.png',
                'name': 'Pranshu Dixit',
                'title': 'Founder & CEO',
                'founder_type': 'tech',
                'description': 'A visionary technology leader specializing in healthcare solutions, digital transformation, and innovative software development. With expertise in modern web technologies, mobile applications, and cloud infrastructure, Pranshu has been instrumental in building PhysioWay\'s cutting-edge platform.',
                'qualifications': 'Full Stack Development, Cloud Architecture, Healthcare IT Solutions, Digital Transformation Expert',
                'company_name': 'Codingbull Technovations Pvt. LTD',
                'company_website': 'https://codingbullz.com',
                'order': 2
            },
        ],
        # Page background images
        'pages': {
            'services': {'source': 'Physiotherapy collaage.png', 'title': 'Our Services', 'subtitle': 'Comprehensive physiotherapy treatments delivered by certified professionals in the comfort of your home.'},
            'about': {'source': 'Physios at home.png', 'title': 'About PhysioWay', 'subtitle': 'Revolutionizing physiotherapy by bringing world-class treatment directly to your home.'},
            'blog': {'source': 'Software Showcase.png', 'title': 'Health & Wellness Blog', 'subtitle': 'Stay informed with the latest insights, tips, and expert advice on physiotherapy, health, and wellness.'},
            'contact': {'source': 'Physio Consultation.png', 'title': 'Contact Us', 'subtitle': 'Get in touch with our team for any questions or to schedule your consultation.'},
            'book': {'source': 'Physio-1.png', 'title': 'Book Consultation', 'subtitle': 'Schedule your free consultation with our expert physiotherapists.'},
        },
        # Software/Technology images - now used for page backgrounds (reused)
        'why_choose_us': [
            {'source': 'Software Showcase.png', 'title_match': 'Transparency'},
            {'source': 'Software on Gadget.png', 'title_match': 'Convenience'},
            {'source': 'SoftShow by therapist.png', 'title_match': 'Technology'},
        ],
    }

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            default='../frontend/physiowayimages',
            help='Source directory containing images (relative to backend folder)'
        )
        parser.add_argument(
            '--quality',
            type=int,
            default=85,
            help='Image compression quality (1-100)'
        )
        parser.add_argument(
            '--max-width',
            type=int,
            default=1920,
            help='Maximum image width for hero images'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        if not PILLOW_AVAILABLE:
            self.stderr.write(self.style.ERROR('Pillow is required. Install with: pip install Pillow'))
            return

        source_dir = Path(settings.BASE_DIR) / options['source']
        quality = options['quality']
        max_width = options['max_width']
        dry_run = options['dry_run']

        if not source_dir.exists():
            self.stderr.write(self.style.ERROR(f'Source directory not found: {source_dir}'))
            return

        self.stdout.write(f'Source directory: {source_dir}')
        self.stdout.write(f'Quality: {quality}, Max width: {max_width}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))

        # Process hero images
        self.process_hero_images(source_dir, quality, max_width, dry_run)
        
        # Process service hero images
        self.process_service_images(source_dir, quality, max_width, dry_run)
        
        # Process Why Choose Us images
        self.process_why_choose_us_images(source_dir, quality, max_width, dry_run)
        
        # Process founder images
        self.process_team_images(source_dir, quality, max_width, dry_run)
        
        # Process page background images
        self.process_page_backgrounds(source_dir, quality, max_width, dry_run)

        self.stdout.write(self.style.SUCCESS('Image import completed!'))

    def compress_image(self, source_path, dest_path, quality, max_width):
        """Compress and optionally resize image, convert to WebP"""
        with Image.open(source_path) as img:
            # Convert to RGB if necessary (for PNG with transparency)
            if img.mode in ('RGBA', 'P'):
                # Create white background for transparent images
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if larger than max_width
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
            
            # Save as WebP
            webp_path = dest_path.with_suffix('.webp')
            img.save(webp_path, 'WEBP', quality=quality, optimize=True)
            
            original_size = source_path.stat().st_size
            new_size = webp_path.stat().st_size
            reduction = ((original_size - new_size) / original_size) * 100
            
            self.stdout.write(
                f'  Compressed: {source_path.name} -> {webp_path.name} '
                f'({original_size/1024:.1f}KB -> {new_size/1024:.1f}KB, {reduction:.1f}% reduction)'
            )
            
            return webp_path

    def process_hero_images(self, source_dir, quality, max_width, dry_run):
        """Process and import hero carousel images"""
        self.stdout.write(self.style.MIGRATE_HEADING('\nProcessing Hero Images...'))
        
        media_hero_dir = Path(settings.MEDIA_ROOT) / 'hero'
        media_hero_dir.mkdir(parents=True, exist_ok=True)
        
        for hero_config in self.IMAGE_MAPPING['hero']:
            source_file = source_dir / hero_config['source']
            if not source_file.exists():
                self.stdout.write(self.style.WARNING(f'  Not found: {hero_config["source"]}'))
                continue
            
            dest_file = media_hero_dir / hero_config['source']
            
            if dry_run:
                self.stdout.write(f'  Would process: {hero_config["source"]} -> HeroImage')
                continue
            
            # Compress image
            webp_path = self.compress_image(source_file, dest_file, quality, max_width)
            
            # Create or update HeroImage
            relative_path = f'hero/{webp_path.name}'
            hero_image, created = HeroImage.objects.update_or_create(
                order=hero_config['order'],
                defaults={
                    'alt_text': hero_config['alt'],
                    'is_active': True,
                }
            )
            # Update image field
            hero_image.image.name = relative_path
            hero_image.save()
            
            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'  {action}: HeroImage #{hero_config["order"]}'))

    def process_service_images(self, source_dir, quality, max_width, dry_run):
        """Process and import service hero images"""
        self.stdout.write(self.style.MIGRATE_HEADING('\nProcessing Service Hero Images...'))
        
        media_services_dir = Path(settings.MEDIA_ROOT) / 'services' / 'hero'
        media_services_dir.mkdir(parents=True, exist_ok=True)
        
        for slug, filename in self.IMAGE_MAPPING['services'].items():
            source_file = source_dir / filename
            if not source_file.exists():
                self.stdout.write(self.style.WARNING(f'  Not found: {filename}'))
                continue
            
            try:
                service = Service.objects.get(slug=slug)
            except Service.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Service not found: {slug}'))
                continue
            
            dest_file = media_services_dir / filename
            
            if dry_run:
                self.stdout.write(f'  Would process: {filename} -> Service({slug}).hero_image')
                continue
            
            # Compress image
            webp_path = self.compress_image(source_file, dest_file, quality, max_width)
            
            # Update service
            relative_path = f'services/hero/{webp_path.name}'
            service.hero_image.name = relative_path
            service.save()
            
            self.stdout.write(self.style.SUCCESS(f'  Updated: {service.title} hero_image'))
        
        # Process service card images
        media_cards_dir = Path(settings.MEDIA_ROOT) / 'services'
        for slug, filename in self.IMAGE_MAPPING.get('service_cards', {}).items():
            source_file = source_dir / filename
            if not source_file.exists():
                continue
            
            try:
                service = Service.objects.get(slug=slug)
            except Service.DoesNotExist:
                continue
            
            dest_file = media_cards_dir / filename
            
            if dry_run:
                self.stdout.write(f'  Would process: {filename} -> Service({slug}).image')
                continue
            
            webp_path = self.compress_image(source_file, dest_file, quality, 800)
            relative_path = f'services/{webp_path.name}'
            service.image.name = relative_path
            service.save()
            
            self.stdout.write(self.style.SUCCESS(f'  Updated: {service.title} card image'))

    def process_why_choose_us_images(self, source_dir, quality, max_width, dry_run):
        """Process and import Why Choose Us images"""
        self.stdout.write(self.style.MIGRATE_HEADING('\nProcessing Why Choose Us Images...'))
        
        media_why_dir = Path(settings.MEDIA_ROOT) / 'why_choose_us'
        media_why_dir.mkdir(parents=True, exist_ok=True)
        
        for config in self.IMAGE_MAPPING['why_choose_us']:
            source_file = source_dir / config['source']
            if not source_file.exists():
                self.stdout.write(self.style.WARNING(f'  Not found: {config["source"]}'))
                continue
            
            # Find matching WhyChooseUs item by title
            items = WhyChooseUs.objects.filter(title__icontains=config['title_match'])
            if not items.exists():
                self.stdout.write(self.style.WARNING(f'  No WhyChooseUs match for: {config["title_match"]}'))
                continue
            
            item = items.first()
            dest_file = media_why_dir / config['source']
            
            if dry_run:
                self.stdout.write(f'  Would process: {config["source"]} -> WhyChooseUs({item.title})')
                continue
            
            webp_path = self.compress_image(source_file, dest_file, quality, 800)
            relative_path = f'why_choose_us/{webp_path.name}'
            item.image.name = relative_path
            item.save()
            
            self.stdout.write(self.style.SUCCESS(f'  Updated: {item.title}'))

    def process_team_images(self, source_dir, quality, max_width, dry_run):
        """Process founder images and create Founder records"""
        self.stdout.write(self.style.MIGRATE_HEADING('\nProcessing Founder Images...'))
        
        media_founders_dir = Path(settings.MEDIA_ROOT) / 'founders'
        media_founders_dir.mkdir(parents=True, exist_ok=True)
        
        for founder_config in self.IMAGE_MAPPING['founders']:
            source_file = source_dir / founder_config['source']
            if not source_file.exists():
                self.stdout.write(self.style.WARNING(f'  Not found: {founder_config["source"]}'))
                continue
            
            dest_file = media_founders_dir / founder_config['source']
            
            if dry_run:
                self.stdout.write(f'  Would process: {founder_config["source"]} -> Founder({founder_config["name"]})')
                continue
            
            # Compress image (square format, 600px)
            webp_path = self.compress_image(source_file, dest_file, quality, 600)
            relative_path = f'founders/{webp_path.name}'
            
            # Create or update Founder
            founder, created = Founder.objects.update_or_create(
                name=founder_config['name'],
                defaults={
                    'title': founder_config['title'],
                    'founder_type': founder_config['founder_type'],
                    'description': founder_config['description'],
                    'qualifications': founder_config['qualifications'],
                    'company_name': founder_config.get('company_name', ''),
                    'company_website': founder_config.get('company_website', ''),
                    'order': founder_config['order'],
                    'is_active': True,
                }
            )
            founder.image.name = relative_path
            founder.save()
            
            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'  {action}: {founder.name}'))
    
    def process_page_backgrounds(self, source_dir, quality, max_width, dry_run):
        """Process page background images"""
        self.stdout.write(self.style.MIGRATE_HEADING('\nProcessing Page Background Images...'))
        
        media_pages_dir = Path(settings.MEDIA_ROOT) / 'pages'
        media_pages_dir.mkdir(parents=True, exist_ok=True)
        
        for page_key, config in self.IMAGE_MAPPING['pages'].items():
            source_file = source_dir / config['source']
            if not source_file.exists():
                self.stdout.write(self.style.WARNING(f'  Not found: {config["source"]}'))
                continue
            
            dest_file = media_pages_dir / config['source']
            
            if dry_run:
                self.stdout.write(f'  Would process: {config["source"]} -> PageSettings({page_key})')
                continue
            
            # Compress image
            webp_path = self.compress_image(source_file, dest_file, quality, max_width)
            relative_path = f'pages/{webp_path.name}'
            
            # Create or update PageSettings
            page_settings, created = PageSettings.objects.update_or_create(
                page=page_key,
                defaults={
                    'hero_title': config['title'],
                    'hero_subtitle': config['subtitle'],
                    'is_active': True,
                }
            )
            page_settings.hero_background_image.name = relative_path
            page_settings.save()
            
            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'  {action}: {page_key} page settings'))
