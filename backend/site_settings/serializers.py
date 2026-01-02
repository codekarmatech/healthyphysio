"""
Site Settings Serializers - API serialization for frontend consumption
"""
from rest_framework import serializers
from .models import (
    ThemeSettings, BrandingSettings, HeroSection, HeroImage, SectionSettings,
    Testimonial, Statistic, TrustedPartner, FooterSettings,
    NavbarSettings, SEOSettings, PageContent, ProcessStep, Service,
    WhyChooseUs, CTASection, ProcessSectionSettings, ServicesSectionSettings,
    TestimonialsSectionSettings, WhyChooseUsSectionSettings, Founder, PageSettings,
    BlogPost
)


class ThemeSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThemeSettings
        exclude = ['id', 'updated_at']


class BrandingSettingsSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    logo_dark_url = serializers.SerializerMethodField()
    favicon_url = serializers.SerializerMethodField()
    tech_partner_logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = BrandingSettings
        exclude = ['id', 'updated_at']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    def get_logo_dark_url(self, obj):
        if obj.logo_dark:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo_dark.url)
            return obj.logo_dark.url
        return None
    
    def get_favicon_url(self, obj):
        if obj.favicon:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.favicon.url)
            return obj.favicon.url
        return None
    
    def get_tech_partner_logo_url(self, obj):
        if obj.tech_partner_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.tech_partner_logo.url)
            return obj.tech_partner_logo.url
        return None


class HeroSectionSerializer(serializers.ModelSerializer):
    hero_image_url = serializers.SerializerMethodField()
    trust_badges = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    
    class Meta:
        model = HeroSection
        exclude = ['id', 'updated_at']
    
    def get_hero_image_url(self, obj):
        if obj.hero_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hero_image.url)
            return obj.hero_image.url
        return None
    
    def get_trust_badges(self, obj):
        if not obj.show_trust_badges:
            return []
        return [
            {'icon': obj.trust_badge_1_icon, 'text': obj.trust_badge_1_text, 'subtext': obj.trust_badge_1_subtext},
            {'icon': obj.trust_badge_2_icon, 'text': obj.trust_badge_2_text, 'subtext': obj.trust_badge_2_subtext},
            {'icon': obj.trust_badge_3_icon, 'text': obj.trust_badge_3_text, 'subtext': obj.trust_badge_3_subtext},
        ]
    
    def get_stats(self, obj):
        if not obj.show_stats:
            return []
        return [
            {'value': obj.stat_1_value, 'label': obj.stat_1_label},
            {'value': obj.stat_2_value, 'label': obj.stat_2_label},
            {'value': obj.stat_3_value, 'label': obj.stat_3_label},
        ]


class SectionSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionSettings
        exclude = ['id', 'updated_at']


class HeroImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = HeroImage
        fields = ['id', 'image_url', 'alt_text', 'caption', 'order']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class TestimonialSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Testimonial
        exclude = ['created_at']
    
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class StatisticSerializer(serializers.ModelSerializer):
    class Meta:
        model = Statistic
        exclude = ['id']


class TrustedPartnerSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TrustedPartner
        exclude = ['id']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class FooterSettingsSerializer(serializers.ModelSerializer):
    copyright_text = serializers.SerializerMethodField()
    
    class Meta:
        model = FooterSettings
        exclude = ['id', 'updated_at']
    
    def get_copyright_text(self, obj):
        from datetime import datetime
        return obj.copyright_text.replace('{year}', str(datetime.now().year))


class NavbarSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NavbarSettings
        exclude = ['id', 'updated_at']


class SEOSettingsSerializer(serializers.ModelSerializer):
    og_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SEOSettings
        exclude = ['id', 'updated_at']
    
    def get_og_image_url(self, obj):
        if obj.og_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.og_image.url)
            return obj.og_image.url
        return None


class PageContentSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PageContent
        exclude = ['id']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProcessStepSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProcessStep
        fields = ['step_number', 'icon', 'image_url', 'title', 'description']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ServiceSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    hero_image_url = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
    conditions = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = ['id', 'slug', 'icon', 'title', 'description', 'long_description', 'features', 'conditions', 'image_url', 'hero_image_url', 'order']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_hero_image_url(self, obj):
        if obj.hero_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hero_image.url)
            return obj.hero_image.url
        return None
    
    def get_features(self, obj):
        return obj.get_features_list()
    
    def get_conditions(self, obj):
        return obj.get_conditions_list()


class WhyChooseUsSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = WhyChooseUs
        fields = ['id', 'icon', 'image_url', 'title', 'description', 'order']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class CTASectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CTASection
        exclude = ['id', 'updated_at']


class ProcessSectionSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessSectionSettings
        exclude = ['id', 'updated_at']


class ServicesSectionSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicesSectionSettings
        exclude = ['id', 'updated_at']


class TestimonialsSectionSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestimonialsSectionSettings
        exclude = ['id', 'updated_at']


class WhyChooseUsSectionSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhyChooseUsSectionSettings
        exclude = ['id', 'updated_at']


class FounderSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    qualifications = serializers.SerializerMethodField()
    
    class Meta:
        model = Founder
        fields = ['id', 'name', 'title', 'founder_type', 'image_url', 'description', 
                  'qualifications', 'company_name', 'company_website', 'order']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_qualifications(self, obj):
        return obj.get_qualifications_list()


class PageSettingsSerializer(serializers.ModelSerializer):
    hero_background_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PageSettings
        fields = ['page', 'hero_background_image_url', 'hero_title', 'hero_subtitle']
    
    def get_hero_background_image_url(self, obj):
        if obj.hero_background_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hero_background_image.url)
            return obj.hero_background_image.url
        return None


class BlogPostSerializer(serializers.ModelSerializer):
    """
    Blog post serializer with SEO fields
    """
    featured_image_url = serializers.SerializerMethodField()
    author_image_url = serializers.SerializerMethodField()
    tags_list = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()
    meta_title_computed = serializers.SerializerMethodField()
    meta_description_computed = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content',
            'featured_image', 'featured_image_url', 'featured_image_alt',
            'category', 'category_display', 'tags', 'tags_list',
            'author_name', 'author_title', 'author_image', 'author_image_url', 'author_bio',
            'read_time_minutes',
            'meta_title', 'meta_title_computed', 'meta_description', 'meta_description_computed', 'meta_keywords',
            'is_featured', 'is_published',
            'published_at', 'created_at', 'updated_at',
            'view_count'
        ]
    
    def get_featured_image_url(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None
    
    def get_author_image_url(self, obj):
        if obj.author_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.author_image.url)
            return obj.author_image.url
        return None
    
    def get_tags_list(self, obj):
        return obj.get_tags_list()
    
    def get_category_display(self, obj):
        return obj.get_category_display()
    
    def get_meta_title_computed(self, obj):
        return obj.get_meta_title()
    
    def get_meta_description_computed(self, obj):
        return obj.get_meta_description()


class BlogPostListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for blog list views
    """
    featured_image_url = serializers.SerializerMethodField()
    tags_list = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt',
            'featured_image_url', 'featured_image_alt',
            'category', 'category_display', 'tags_list',
            'author_name', 'author_title',
            'read_time_minutes', 'is_featured',
            'published_at', 'view_count'
        ]
    
    def get_featured_image_url(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
            return obj.featured_image.url
        return None
    
    def get_tags_list(self, obj):
        return obj.get_tags_list()
    
    def get_category_display(self, obj):
        return obj.get_category_display()


class AllSettingsSerializer(serializers.Serializer):
    """
    Combined serializer for all site settings - single API call for frontend
    """
    theme = ThemeSettingsSerializer()
    branding = BrandingSettingsSerializer()
    hero = HeroSectionSerializer()
    sections = SectionSettingsSerializer(many=True)
    testimonials = TestimonialSerializer(many=True)
    statistics = StatisticSerializer(many=True)
    partners = TrustedPartnerSerializer(many=True)
    footer = FooterSettingsSerializer()
    navbar = NavbarSettingsSerializer()
    seo = SEOSettingsSerializer()
    process_steps = ProcessStepSerializer(many=True)
    services = ServiceSerializer(many=True)
    why_choose_us = WhyChooseUsSerializer(many=True)
    cta = CTASectionSerializer()
    process_section = ProcessSectionSettingsSerializer()
    services_section = ServicesSectionSettingsSerializer()
    testimonials_section = TestimonialsSectionSettingsSerializer()
    why_choose_us_section = WhyChooseUsSectionSettingsSerializer()
