"""
Site Settings Models - Admin-controlled frontend customization
Controls: Theme colors, typography, images, content, and layout for entire frontend
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.cache import cache


class SingletonModel(models.Model):
    """Base class for singleton models (only one instance allowed)"""
    
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)
        # Clear cache when settings change
        cache.delete(f'{self.__class__.__name__}_cache')

    def delete(self, *args, **kwargs):
        pass  # Prevent deletion

    @classmethod
    def load(cls):
        """Load the singleton instance, create if doesn't exist"""
        cache_key = f'{cls.__name__}_cache'
        obj = cache.get(cache_key)
        if obj is None:
            obj, _ = cls.objects.get_or_create(pk=1)
            cache.set(cache_key, obj, 3600)  # Cache for 1 hour
        return obj


class ThemeSettings(SingletonModel):
    """
    Global theme settings - Controls colors, fonts, and overall styling
    """
    # Primary Colors
    primary_color = models.CharField(
        max_length=7, 
        default='#2563EB',
        help_text='Primary brand color (hex). Used for buttons, links, accents.'
    )
    primary_light = models.CharField(
        max_length=7, 
        default='#EFF6FF',
        help_text='Light variant of primary color for backgrounds.'
    )
    primary_dark = models.CharField(
        max_length=7, 
        default='#1D4ED8',
        help_text='Dark variant of primary color for hover states.'
    )
    
    # Secondary/Accent Colors
    secondary_color = models.CharField(
        max_length=7, 
        default='#F97316',
        help_text='Secondary/accent color (hex). Used for CTAs, highlights.'
    )
    secondary_light = models.CharField(
        max_length=7, 
        default='#FFF7ED',
        help_text='Light variant of secondary color.'
    )
    secondary_dark = models.CharField(
        max_length=7, 
        default='#EA580C',
        help_text='Dark variant of secondary color.'
    )
    
    # Text Colors
    text_primary = models.CharField(
        max_length=7, 
        default='#1E293B',
        help_text='Primary text color (headings, important text).'
    )
    text_secondary = models.CharField(
        max_length=7, 
        default='#64748B',
        help_text='Secondary text color (body text, descriptions).'
    )
    text_muted = models.CharField(
        max_length=7, 
        default='#94A3B8',
        help_text='Muted text color (placeholders, hints).'
    )
    
    # Background Colors
    bg_primary = models.CharField(
        max_length=7, 
        default='#FFFFFF',
        help_text='Primary background color.'
    )
    bg_secondary = models.CharField(
        max_length=7, 
        default='#F8FAFC',
        help_text='Secondary background color (alternating sections).'
    )
    bg_dark = models.CharField(
        max_length=7, 
        default='#0F172A',
        help_text='Dark background color (footer, dark sections).'
    )
    
    # Status Colors
    success_color = models.CharField(max_length=7, default='#10B981', help_text='Success/positive color.')
    warning_color = models.CharField(max_length=7, default='#F59E0B', help_text='Warning color.')
    error_color = models.CharField(max_length=7, default='#EF4444', help_text='Error/danger color.')
    info_color = models.CharField(max_length=7, default='#3B82F6', help_text='Info color.')
    
    # Typography
    font_family_heading = models.CharField(
        max_length=100, 
        default='Inter, system-ui, sans-serif',
        help_text='Font family for headings.'
    )
    font_family_body = models.CharField(
        max_length=100, 
        default='Inter, system-ui, sans-serif',
        help_text='Font family for body text.'
    )
    
    # Border & Shadow
    border_radius = models.CharField(
        max_length=20, 
        default='0.75rem',
        help_text='Default border radius for cards, buttons.'
    )
    border_color = models.CharField(
        max_length=7, 
        default='#E2E8F0',
        help_text='Default border color.'
    )
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Theme Settings'
        verbose_name_plural = 'Theme Settings'
    
    def __str__(self):
        return 'Theme Settings'


class BrandingSettings(SingletonModel):
    """
    Branding settings - Logo, company info, social links
    """
    # Logo
    logo = models.ImageField(
        upload_to='branding/',
        blank=True,
        null=True,
        help_text='Main logo (recommended: SVG or PNG with transparency, 200x60px)'
    )
    logo_dark = models.ImageField(
        upload_to='branding/',
        blank=True,
        null=True,
        help_text='Logo for dark backgrounds'
    )
    favicon = models.ImageField(
        upload_to='branding/',
        blank=True,
        null=True,
        help_text='Favicon (32x32px PNG or ICO)'
    )
    
    # Company Info
    company_name = models.CharField(max_length=100, default='PhysioWay')
    tagline = models.CharField(max_length=200, default='Your Health, Our Priority')
    description = models.TextField(
        default='Professional physiotherapy services delivered to your doorstep.',
        help_text='Short company description for footer and meta tags.'
    )
    
    # Contact Info
    phone = models.CharField(max_length=20, default='+91 63532 02177')
    email = models.EmailField(default='contact@physioway.com')
    address = models.TextField(blank=True, default='')
    working_hours = models.CharField(max_length=100, default='Mon-Sat: 8AM-8PM, Sun: 10AM-6PM')
    
    # Social Links
    facebook_url = models.URLField(blank=True, default='')
    twitter_url = models.URLField(blank=True, default='')
    instagram_url = models.URLField(blank=True, default='')
    linkedin_url = models.URLField(blank=True, default='')
    youtube_url = models.URLField(blank=True, default='')
    
    # Technology Partner
    tech_partner_name = models.CharField(max_length=100, default='CodingBull Technovations Pvt Ltd')
    tech_partner_url = models.URLField(default='https://www.codingbullz.com')
    tech_partner_logo = models.ImageField(
        upload_to='branding/',
        blank=True,
        null=True,
        help_text='Technology partner logo'
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Branding Settings'
        verbose_name_plural = 'Branding Settings'
    
    def __str__(self):
        return 'Branding Settings'


class HeroSection(SingletonModel):
    """
    Hero section content and styling
    """
    # Content
    badge_text = models.CharField(max_length=100, default='Available 24/7')
    headline = models.CharField(max_length=200, default='Expert Physiotherapy At Your Doorstep')
    subheadline = models.TextField(
        default='Experience world-class physiotherapy in the comfort of your home. Our certified professionals combine cutting-edge technology with personalized care.'
    )
    
    # CTA Buttons
    primary_cta_text = models.CharField(max_length=50, default='Book Free Consultation')
    primary_cta_link = models.CharField(max_length=200, default='/book-consultation')
    secondary_cta_text = models.CharField(max_length=50, default='Explore Services')
    secondary_cta_link = models.CharField(max_length=200, default='/services')
    
    # Hero Image
    hero_image = models.ImageField(
        upload_to='hero/',
        blank=True,
        null=True,
        help_text='Main hero image (recommended: 1200x900px)'
    )
    hero_image_alt = models.CharField(max_length=200, default='Professional Physiotherapy Treatment')
    
    # Trust Badges
    show_trust_badges = models.BooleanField(default=True)
    trust_badge_1_icon = models.CharField(max_length=10, default='🏥')
    trust_badge_1_text = models.CharField(max_length=50, default='Licensed Therapists')
    trust_badge_1_subtext = models.CharField(max_length=50, default='Govt. Certified')
    
    trust_badge_2_icon = models.CharField(max_length=10, default='👨‍⚕️')
    trust_badge_2_text = models.CharField(max_length=50, default='Doctor Oversight')
    trust_badge_2_subtext = models.CharField(max_length=50, default='MD Supervised')
    
    trust_badge_3_icon = models.CharField(max_length=10, default='🛡️')
    trust_badge_3_text = models.CharField(max_length=50, default='Insurance Accepted')
    trust_badge_3_subtext = models.CharField(max_length=50, default='Cashless Claims')
    
    # Stats
    show_stats = models.BooleanField(default=True)
    stat_1_value = models.CharField(max_length=20, default='5000+')
    stat_1_label = models.CharField(max_length=50, default='Patients')
    stat_2_value = models.CharField(max_length=20, default='98%')
    stat_2_label = models.CharField(max_length=50, default='Success Rate')
    stat_3_value = models.CharField(max_length=20, default='50+')
    stat_3_label = models.CharField(max_length=50, default='Experts')
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Hero Section'
        verbose_name_plural = 'Hero Section'
    
    def __str__(self):
        return 'Hero Section'


class HeroImage(models.Model):
    """
    Multiple hero images for carousel/slider on landing page
    """
    image = models.ImageField(
        upload_to='hero/',
        help_text='Hero image for landing page carousel (recommended: 1200x900px)'
    )
    alt_text = models.CharField(max_length=200, default='Physiotherapy Treatment')
    caption = models.CharField(max_length=200, blank=True, help_text='Optional caption overlay')
    order = models.PositiveIntegerField(default=0, help_text='Display order (lower = first)')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Hero Image'
        verbose_name_plural = 'Hero Images (Carousel)'
    
    def __str__(self):
        return f'Hero Image {self.order}: {self.alt_text[:30]}'


class SectionSettings(models.Model):
    """
    Settings for individual page sections (stats, services, testimonials, etc.)
    """
    SECTION_CHOICES = [
        ('stats', 'Stats Section'),
        ('services', 'Services Section'),
        ('process', 'How It Works Section'),
        ('testimonials', 'Testimonials Section'),
        ('why_us', 'Why Choose Us Section'),
        ('cta', 'Call to Action Section'),
        ('trusted_by', 'Trusted By Section'),
    ]
    
    section_id = models.CharField(max_length=50, choices=SECTION_CHOICES, unique=True)
    is_visible = models.BooleanField(default=True, help_text='Show/hide this section')
    order = models.PositiveIntegerField(default=0, help_text='Display order (lower = higher)')
    
    # Section Header
    badge_text = models.CharField(max_length=100, blank=True)
    title = models.CharField(max_length=200)
    subtitle = models.TextField(blank=True)
    
    # Styling
    background_color = models.CharField(
        max_length=7, 
        blank=True,
        help_text='Override background color (leave empty for default)'
    )
    text_color = models.CharField(
        max_length=7, 
        blank=True,
        help_text='Override text color (leave empty for default)'
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Section Setting'
        verbose_name_plural = 'Section Settings'
        ordering = ['order']
    
    def __str__(self):
        return f'{self.get_section_id_display()}'


class Testimonial(models.Model):
    """
    Customer testimonials
    """
    name = models.CharField(max_length=100)
    condition = models.CharField(max_length=100, help_text='e.g., Post-Surgery Recovery')
    location = models.CharField(max_length=100)
    text = models.TextField()
    rating = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    photo = models.ImageField(upload_to='testimonials/', blank=True, null=True)
    is_featured = models.BooleanField(default=False, help_text='Show on landing page')
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', '-created_at']
    
    def __str__(self):
        return f'{self.name} - {self.condition}'


class Statistic(models.Model):
    """
    Statistics displayed on the landing page
    """
    icon = models.CharField(max_length=10, help_text='Emoji icon')
    value = models.CharField(max_length=50, help_text='e.g., 5000+, 98%')
    label = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f'{self.value} {self.label}'


class TrustedPartner(models.Model):
    """
    Trusted by / Partner logos section
    """
    name = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='partners/', blank=True, null=True)
    url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return self.name


class FooterSettings(SingletonModel):
    """
    Footer configuration
    """
    # Footer Columns
    show_quick_links = models.BooleanField(default=True)
    show_services = models.BooleanField(default=True)
    show_contact = models.BooleanField(default=True)
    show_social_links = models.BooleanField(default=True)
    
    # Newsletter
    show_newsletter = models.BooleanField(default=False)
    newsletter_title = models.CharField(max_length=100, default='Subscribe to our newsletter')
    newsletter_subtitle = models.CharField(max_length=200, default='Get health tips and updates')
    
    # Copyright
    copyright_text = models.CharField(
        max_length=200, 
        default='© {year} PhysioWay. All rights reserved.',
        help_text='Use {year} for dynamic year'
    )
    
    # Additional Links
    privacy_policy_url = models.CharField(max_length=200, default='/privacy')
    terms_url = models.CharField(max_length=200, default='/terms')
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Footer Settings'
        verbose_name_plural = 'Footer Settings'
    
    def __str__(self):
        return 'Footer Settings'


class NavbarSettings(SingletonModel):
    """
    Navbar configuration
    """
    # Appearance
    is_sticky = models.BooleanField(default=True)
    is_transparent_on_hero = models.BooleanField(default=False)
    background_color = models.CharField(max_length=7, default='#FFFFFF')
    
    # CTA Button
    show_cta_button = models.BooleanField(default=True)
    cta_text = models.CharField(max_length=50, default='Book Now')
    cta_link = models.CharField(max_length=200, default='/book-consultation')
    
    # Phone Number
    show_phone = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Navbar Settings'
        verbose_name_plural = 'Navbar Settings'
    
    def __str__(self):
        return 'Navbar Settings'


class SEOSettings(SingletonModel):
    """
    SEO and meta tag settings
    """
    site_title = models.CharField(max_length=60, default='PhysioWay - Professional Home Physiotherapy Services')
    site_description = models.CharField(
        max_length=160,
        default='Expert physiotherapy at your doorstep. Book a free consultation today.'
    )
    keywords = models.TextField(
        default='physiotherapy, home physiotherapy, physical therapy, rehabilitation',
        help_text='Comma-separated keywords'
    )
    og_image = models.ImageField(
        upload_to='seo/',
        blank=True,
        null=True,
        help_text='Open Graph image for social sharing (1200x630px)'
    )
    google_analytics_id = models.CharField(max_length=50, blank=True)
    facebook_pixel_id = models.CharField(max_length=50, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'SEO Settings'
        verbose_name_plural = 'SEO Settings'
    
    def __str__(self):
        return 'SEO Settings'


class PageContent(models.Model):
    """
    Dynamic page content blocks
    """
    PAGE_CHOICES = [
        ('landing', 'Landing Page'),
        ('about', 'About Page'),
        ('services', 'Services Page'),
        ('contact', 'Contact Page'),
    ]
    
    page = models.CharField(max_length=50, choices=PAGE_CHOICES)
    section_key = models.CharField(max_length=100, help_text='Unique identifier for this content block')
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField(blank=True)
    image = models.ImageField(upload_to='content/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['page', 'section_key']
        verbose_name = 'Page Content'
        verbose_name_plural = 'Page Contents'
    
    def __str__(self):
        return f'{self.get_page_display()} - {self.section_key}'


class ProcessStep(models.Model):
    """
    How PhysioWay Works - Process steps
    """
    step_number = models.PositiveIntegerField(unique=True, help_text='Step number (1, 2, 3...)')
    icon = models.CharField(max_length=10, help_text='Emoji icon for the step')
    title = models.CharField(max_length=100)
    description = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['step_number']
        verbose_name = 'Process Step'
        verbose_name_plural = 'Process Steps (How It Works)'
    
    def __str__(self):
        return f'Step {self.step_number}: {self.title}'


class Service(models.Model):
    """
    Services offered - displayed on landing page and service detail pages
    """
    slug = models.SlugField(max_length=100, unique=True, help_text='URL-friendly identifier (auto-generated from title)')
    icon = models.CharField(max_length=10, help_text='Emoji icon')
    title = models.CharField(max_length=100)
    description = models.TextField()
    long_description = models.TextField(blank=True, help_text='Detailed description for service detail page')
    features = models.TextField(help_text='Comma-separated list of features')
    conditions = models.TextField(blank=True, help_text='Comma-separated list of conditions treated')
    image = models.ImageField(upload_to='services/', blank=True, null=True)
    hero_image = models.ImageField(upload_to='services/hero/', blank=True, null=True, help_text='Hero image for service detail page')
    order = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=True, help_text='Show on landing page')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = 'Service'
        verbose_name_plural = 'Services'
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    def get_features_list(self):
        """Return features as a list"""
        return [f.strip() for f in self.features.split(',') if f.strip()]
    
    def get_conditions_list(self):
        """Return conditions as a list"""
        return [c.strip() for c in self.conditions.split(',') if c.strip()]


class WhyChooseUs(models.Model):
    """
    Why Choose Us / PhysioWay Difference items
    """
    icon = models.CharField(max_length=10, help_text='Emoji icon')
    title = models.CharField(max_length=100)
    description = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order']
        verbose_name = 'Why Choose Us Item'
        verbose_name_plural = 'Why Choose Us (PhysioWay Difference)'
    
    def __str__(self):
        return self.title


class CTASection(SingletonModel):
    """
    Call to Action section settings
    """
    headline = models.CharField(max_length=200, default='Ready to Begin Your Healing Journey?')
    subheadline = models.CharField(max_length=300, default='Join thousands who transformed their lives with PhysioWay.')
    primary_button_text = models.CharField(max_length=50, default='Book Free Consultation')
    primary_button_link = models.CharField(max_length=200, default='/book-consultation')
    show_phone_button = models.BooleanField(default=True)
    background_color = models.CharField(max_length=7, blank=True, help_text='Leave empty for default')
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'CTA Section'
        verbose_name_plural = 'CTA Section'
    
    def __str__(self):
        return 'CTA Section'


class ProcessSectionSettings(SingletonModel):
    """
    How It Works section header settings
    """
    badge_text = models.CharField(max_length=50, default='Simple Process')
    title = models.CharField(max_length=200, default='How PhysioWay Works')
    is_visible = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Process Section Settings'
        verbose_name_plural = 'Process Section Settings'
    
    def __str__(self):
        return 'Process Section Settings'


class ServicesSectionSettings(SingletonModel):
    """
    Services section header settings
    """
    badge_text = models.CharField(max_length=50, default='Our Expertise')
    title = models.CharField(max_length=200, default='Comprehensive Services')
    show_view_all_button = models.BooleanField(default=True)
    view_all_button_text = models.CharField(max_length=50, default='View All Services →')
    view_all_button_link = models.CharField(max_length=200, default='/services')
    is_visible = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Services Section Settings'
        verbose_name_plural = 'Services Section Settings'
    
    def __str__(self):
        return 'Services Section Settings'


class TestimonialsSectionSettings(SingletonModel):
    """
    Testimonials section header settings
    """
    badge_text = models.CharField(max_length=50, default='4.9/5 Rating')
    title = models.CharField(max_length=200, default='What Our Patients Say')
    is_visible = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Testimonials Section Settings'
        verbose_name_plural = 'Testimonials Section Settings'
    
    def __str__(self):
        return 'Testimonials Section Settings'


class WhyChooseUsSectionSettings(SingletonModel):
    """
    Why Choose Us section header settings
    """
    title = models.CharField(max_length=200, default='The PhysioWay Difference')
    is_visible = models.BooleanField(default=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Why Choose Us Section Settings'
        verbose_name_plural = 'Why Choose Us Section Settings'
    
    def __str__(self):
        return 'Why Choose Us Section Settings'
