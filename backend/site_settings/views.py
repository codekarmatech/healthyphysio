"""
Site Settings Views - Public API endpoints for frontend
"""
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.cache import cache

from .models import (
    ThemeSettings, BrandingSettings, HeroSection, SectionSettings,
    Testimonial, Statistic, TrustedPartner, FooterSettings,
    NavbarSettings, SEOSettings, PageContent, ProcessStep, Service,
    WhyChooseUs, CTASection, ProcessSectionSettings, ServicesSectionSettings,
    TestimonialsSectionSettings, WhyChooseUsSectionSettings
)
from .serializers import (
    ThemeSettingsSerializer, BrandingSettingsSerializer, HeroSectionSerializer,
    SectionSettingsSerializer, TestimonialSerializer, StatisticSerializer,
    TrustedPartnerSerializer, FooterSettingsSerializer, NavbarSettingsSerializer,
    SEOSettingsSerializer, PageContentSerializer, ProcessStepSerializer,
    ServiceSerializer, WhyChooseUsSerializer, CTASectionSerializer,
    ProcessSectionSettingsSerializer, ServicesSectionSettingsSerializer,
    TestimonialsSectionSettingsSerializer, WhyChooseUsSectionSettingsSerializer
)


class SiteSettingsViewSet(viewsets.ViewSet):
    """
    Public API for site settings - no authentication required
    Provides all frontend customization data in a single endpoint
    """
    authentication_classes = []  # Disable authentication for public endpoints
    permission_classes = [AllowAny]
    
    def list(self, request):
        """
        GET /api/site-settings/
        Returns all site settings for frontend initialization
        """
        cache_key = 'site_settings_all'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        context = {'request': request}
        
        data = {
            'theme': ThemeSettingsSerializer(
                ThemeSettings.load(), context=context
            ).data,
            'branding': BrandingSettingsSerializer(
                BrandingSettings.load(), context=context
            ).data,
            'hero': HeroSectionSerializer(
                HeroSection.load(), context=context
            ).data,
            'sections': SectionSettingsSerializer(
                SectionSettings.objects.filter(is_visible=True).order_by('order'),
                many=True, context=context
            ).data,
            'testimonials': TestimonialSerializer(
                Testimonial.objects.filter(is_active=True, is_featured=True).order_by('order')[:6],
                many=True, context=context
            ).data,
            'statistics': StatisticSerializer(
                Statistic.objects.filter(is_active=True).order_by('order'),
                many=True, context=context
            ).data,
            'partners': TrustedPartnerSerializer(
                TrustedPartner.objects.filter(is_active=True).order_by('order'),
                many=True, context=context
            ).data,
            'footer': FooterSettingsSerializer(
                FooterSettings.load(), context=context
            ).data,
            'navbar': NavbarSettingsSerializer(
                NavbarSettings.load(), context=context
            ).data,
            'seo': SEOSettingsSerializer(
                SEOSettings.load(), context=context
            ).data,
            'process_steps': ProcessStepSerializer(
                ProcessStep.objects.filter(is_active=True).order_by('step_number'),
                many=True, context=context
            ).data,
            'services': ServiceSerializer(
                Service.objects.filter(is_active=True, is_featured=True).order_by('order')[:6],
                many=True, context=context
            ).data,
            'why_choose_us': WhyChooseUsSerializer(
                WhyChooseUs.objects.filter(is_active=True).order_by('order'),
                many=True, context=context
            ).data,
            'cta': CTASectionSerializer(
                CTASection.load(), context=context
            ).data,
            'process_section': ProcessSectionSettingsSerializer(
                ProcessSectionSettings.load(), context=context
            ).data,
            'services_section': ServicesSectionSettingsSerializer(
                ServicesSectionSettings.load(), context=context
            ).data,
            'testimonials_section': TestimonialsSectionSettingsSerializer(
                TestimonialsSectionSettings.load(), context=context
            ).data,
            'why_choose_us_section': WhyChooseUsSectionSettingsSerializer(
                WhyChooseUsSectionSettings.load(), context=context
            ).data,
        }
        
        # Cache for 5 minutes
        cache.set(cache_key, data, 300)
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def theme(self, request):
        """GET /api/site-settings/theme/ - Theme colors and typography"""
        return Response(ThemeSettingsSerializer(
            ThemeSettings.load(), context={'request': request}
        ).data)
    
    @action(detail=False, methods=['get'])
    def branding(self, request):
        """GET /api/site-settings/branding/ - Logo, company info, social links"""
        return Response(BrandingSettingsSerializer(
            BrandingSettings.load(), context={'request': request}
        ).data)
    
    @action(detail=False, methods=['get'])
    def hero(self, request):
        """GET /api/site-settings/hero/ - Hero section content"""
        return Response(HeroSectionSerializer(
            HeroSection.load(), context={'request': request}
        ).data)
    
    @action(detail=False, methods=['get'])
    def testimonials(self, request):
        """GET /api/site-settings/testimonials/ - All active testimonials"""
        testimonials = Testimonial.objects.filter(is_active=True).order_by('order')
        return Response(TestimonialSerializer(
            testimonials, many=True, context={'request': request}
        ).data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """GET /api/site-settings/statistics/ - Stats for landing page"""
        stats = Statistic.objects.filter(is_active=True).order_by('order')
        return Response(StatisticSerializer(
            stats, many=True, context={'request': request}
        ).data)
    
    @action(detail=False, methods=['get'])
    def partners(self, request):
        """GET /api/site-settings/partners/ - Trusted partners/logos"""
        partners = TrustedPartner.objects.filter(is_active=True).order_by('order')
        return Response(TrustedPartnerSerializer(
            partners, many=True, context={'request': request}
        ).data)
    
    @action(detail=False, methods=['get'])
    def navbar(self, request):
        """GET /api/site-settings/navbar/ - Navbar configuration"""
        return Response(NavbarSettingsSerializer(
            NavbarSettings.load(), context={'request': request}
        ).data)
    
    @action(detail=False, methods=['get'])
    def footer(self, request):
        """GET /api/site-settings/footer/ - Footer configuration"""
        return Response(FooterSettingsSerializer(
            FooterSettings.load(), context={'request': request}
        ).data)
    
    @action(detail=False, methods=['get'])
    def seo(self, request):
        """GET /api/site-settings/seo/ - SEO meta tags"""
        return Response(SEOSettingsSerializer(
            SEOSettings.load(), context={'request': request}
        ).data)
    
    @action(detail=False, methods=['get'], url_path='page/(?P<page_name>[^/.]+)')
    def page_content(self, request, page_name=None):
        """GET /api/site-settings/page/{page_name}/ - Dynamic page content"""
        content = PageContent.objects.filter(page=page_name, is_active=True)
        return Response(PageContentSerializer(
            content, many=True, context={'request': request}
        ).data)
