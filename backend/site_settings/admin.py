from django.contrib import admin
from django.utils.html import format_html
from .models import (
    ThemeSettings, BrandingSettings, HeroSection, HeroImage, SectionSettings,
    Testimonial, Statistic, TrustedPartner, FooterSettings,
    NavbarSettings, SEOSettings, PageContent, ProcessStep, Service,
    WhyChooseUs, CTASection, ProcessSectionSettings, ServicesSectionSettings,
    TestimonialsSectionSettings, WhyChooseUsSectionSettings
)


class SingletonModelAdmin(admin.ModelAdmin):
    """Admin for singleton models - prevents add/delete"""
    
    def has_add_permission(self, request):
        # Only allow add if no instance exists
        return not self.model.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ThemeSettings)
class ThemeSettingsAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Primary Colors', {
            'fields': ('primary_color', 'primary_light', 'primary_dark'),
            'description': 'Main brand colors used for buttons, links, and accents.'
        }),
        ('Secondary Colors', {
            'fields': ('secondary_color', 'secondary_light', 'secondary_dark'),
            'description': 'Accent colors used for CTAs and highlights.'
        }),
        ('Text Colors', {
            'fields': ('text_primary', 'text_secondary', 'text_muted'),
        }),
        ('Background Colors', {
            'fields': ('bg_primary', 'bg_secondary', 'bg_dark'),
        }),
        ('Status Colors', {
            'fields': ('success_color', 'warning_color', 'error_color', 'info_color'),
            'classes': ('collapse',),
        }),
        ('Typography', {
            'fields': ('font_family_heading', 'font_family_body'),
        }),
        ('Borders & Shadows', {
            'fields': ('border_radius', 'border_color'),
            'classes': ('collapse',),
        }),
    )
    
    def color_preview(self, obj):
        return format_html(
            '<div style="display:flex;gap:8px;">'
            '<div style="width:30px;height:30px;background:{};border-radius:4px;border:1px solid #ccc;" title="Primary"></div>'
            '<div style="width:30px;height:30px;background:{};border-radius:4px;border:1px solid #ccc;" title="Secondary"></div>'
            '</div>',
            obj.primary_color, obj.secondary_color
        )
    color_preview.short_description = 'Colors'


@admin.register(BrandingSettings)
class BrandingSettingsAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Logo & Favicon (Navbar)', {
            'fields': ('logo', 'logo_dark', 'favicon'),
            'description': '⚠️ NAVBAR LOGO: Upload your company logo here. This will appear in the website navbar/header. Recommended: PNG or SVG with transparency, 200x60px. Do NOT upload hero/banner images here.'
        }),
        ('Company Information', {
            'fields': ('company_name', 'tagline', 'description'),
        }),
        ('Contact Information', {
            'fields': ('phone', 'email', 'address', 'working_hours'),
        }),
        ('Social Media Links', {
            'fields': ('facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url', 'youtube_url'),
            'classes': ('collapse',),
        }),
        ('Technology Partner', {
            'fields': ('tech_partner_name', 'tech_partner_url', 'tech_partner_logo'),
            'description': 'Technology partner information displayed in footer.'
        }),
    )


@admin.register(HeroSection)
class HeroSectionAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Main Content', {
            'fields': ('badge_text', 'headline', 'subheadline'),
        }),
        ('Call to Action Buttons', {
            'fields': ('primary_cta_text', 'primary_cta_link', 'secondary_cta_text', 'secondary_cta_link'),
        }),
        ('Hero Image', {
            'fields': ('hero_image', 'hero_image_alt'),
        }),
        ('Trust Badges', {
            'fields': (
                'show_trust_badges',
                ('trust_badge_1_icon', 'trust_badge_1_text', 'trust_badge_1_subtext'),
                ('trust_badge_2_icon', 'trust_badge_2_text', 'trust_badge_2_subtext'),
                ('trust_badge_3_icon', 'trust_badge_3_text', 'trust_badge_3_subtext'),
            ),
        }),
        ('Hero Stats', {
            'fields': (
                'show_stats',
                ('stat_1_value', 'stat_1_label'),
                ('stat_2_value', 'stat_2_label'),
                ('stat_3_value', 'stat_3_label'),
            ),
        }),
    )


@admin.register(HeroImage)
class HeroImageAdmin(admin.ModelAdmin):
    list_display = ('image_preview', 'alt_text', 'caption', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    list_filter = ('is_active',)
    ordering = ('order',)
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="width:80px;height:60px;object-fit:cover;border-radius:4px;"/>', obj.image.url)
        return '-'
    image_preview.short_description = 'Preview'


@admin.register(SectionSettings)
class SectionSettingsAdmin(admin.ModelAdmin):
    list_display = ('section_id', 'title', 'is_visible', 'order')
    list_editable = ('is_visible', 'order')
    list_filter = ('is_visible',)
    ordering = ('order',)
    
    fieldsets = (
        (None, {
            'fields': ('section_id', 'is_visible', 'order'),
        }),
        ('Content', {
            'fields': ('badge_text', 'title', 'subtitle'),
        }),
        ('Styling Override', {
            'fields': ('background_color', 'text_color'),
            'classes': ('collapse',),
            'description': 'Leave empty to use default theme colors.'
        }),
    )


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('name', 'condition', 'location', 'rating', 'is_featured', 'is_active', 'order')
    list_editable = ('is_featured', 'is_active', 'order')
    list_filter = ('is_featured', 'is_active', 'rating')
    search_fields = ('name', 'condition', 'text')
    ordering = ('order', '-created_at')


@admin.register(Statistic)
class StatisticAdmin(admin.ModelAdmin):
    list_display = ('icon', 'value', 'label', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    ordering = ('order',)


@admin.register(TrustedPartner)
class TrustedPartnerAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    ordering = ('order',)


@admin.register(FooterSettings)
class FooterSettingsAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Footer Sections', {
            'fields': ('show_quick_links', 'show_services', 'show_contact', 'show_social_links'),
        }),
        ('Newsletter', {
            'fields': ('show_newsletter', 'newsletter_title', 'newsletter_subtitle'),
            'classes': ('collapse',),
        }),
        ('Legal', {
            'fields': ('copyright_text', 'privacy_policy_url', 'terms_url'),
        }),
    )


@admin.register(NavbarSettings)
class NavbarSettingsAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Appearance', {
            'fields': ('is_sticky', 'is_transparent_on_hero', 'background_color'),
        }),
        ('CTA Button', {
            'fields': ('show_cta_button', 'cta_text', 'cta_link'),
        }),
        ('Contact', {
            'fields': ('show_phone',),
        }),
    )


@admin.register(SEOSettings)
class SEOSettingsAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Meta Tags', {
            'fields': ('site_title', 'site_description', 'keywords'),
        }),
        ('Social Sharing', {
            'fields': ('og_image',),
        }),
        ('Analytics', {
            'fields': ('google_analytics_id', 'facebook_pixel_id'),
            'classes': ('collapse',),
        }),
    )


@admin.register(PageContent)
class PageContentAdmin(admin.ModelAdmin):
    list_display = ('page', 'section_key', 'title', 'is_active')
    list_filter = ('page', 'is_active')
    search_fields = ('section_key', 'title', 'content')
    list_editable = ('is_active',)


@admin.register(ProcessStep)
class ProcessStepAdmin(admin.ModelAdmin):
    list_display = ('step_number', 'icon', 'title', 'description', 'is_active')
    list_editable = ('icon', 'title', 'is_active')
    ordering = ('step_number',)
    
    fieldsets = (
        (None, {
            'fields': ('step_number', 'icon', 'title', 'description', 'is_active'),
        }),
    )


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('title', 'icon', 'order', 'is_featured', 'is_active')
    list_editable = ('order', 'is_featured', 'is_active')
    list_filter = ('is_featured', 'is_active')
    search_fields = ('title', 'description')
    ordering = ('order',)
    
    fieldsets = (
        (None, {
            'fields': ('icon', 'title', 'description'),
        }),
        ('Features', {
            'fields': ('features',),
            'description': 'Enter features separated by commas'
        }),
        ('Display Settings', {
            'fields': ('image', 'link', 'order', 'is_featured', 'is_active'),
        }),
    )


@admin.register(WhyChooseUs)
class WhyChooseUsAdmin(admin.ModelAdmin):
    list_display = ('title', 'icon', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    ordering = ('order',)
    
    fieldsets = (
        (None, {
            'fields': ('icon', 'title', 'description', 'order', 'is_active'),
        }),
    )


@admin.register(CTASection)
class CTASectionAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Content', {
            'fields': ('headline', 'subheadline'),
        }),
        ('Primary Button', {
            'fields': ('primary_button_text', 'primary_button_link'),
        }),
        ('Options', {
            'fields': ('show_phone_button', 'background_color'),
        }),
    )


@admin.register(ProcessSectionSettings)
class ProcessSectionSettingsAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Section Header', {
            'fields': ('badge_text', 'title', 'is_visible'),
            'description': 'Settings for the "How PhysioWay Works" section'
        }),
    )


@admin.register(ServicesSectionSettings)
class ServicesSectionSettingsAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Section Header', {
            'fields': ('badge_text', 'title', 'is_visible'),
            'description': 'Settings for the "Our Expertise - Comprehensive Services" section'
        }),
        ('View All Button', {
            'fields': ('show_view_all_button', 'view_all_button_text', 'view_all_button_link'),
        }),
    )


@admin.register(TestimonialsSectionSettings)
class TestimonialsSectionSettingsAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Section Header', {
            'fields': ('badge_text', 'title', 'is_visible'),
            'description': 'Settings for the "What Our Patients Say" section'
        }),
    )


@admin.register(WhyChooseUsSectionSettings)
class WhyChooseUsSectionSettingsAdmin(SingletonModelAdmin):
    fieldsets = (
        ('Section Header', {
            'fields': ('title', 'is_visible'),
            'description': 'Settings for "The PhysioWay Difference" section'
        }),
    )
