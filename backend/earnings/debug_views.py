"""
Debug views for earnings API
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver

@api_view(['GET'])
def debug_urls(request):
    """
    Debug view to list all registered URLs
    """
    resolver = get_resolver()
    
    def collect_urls(resolver, prefix=''):
        urls = []
        for pattern in resolver.url_patterns:
            if isinstance(pattern, URLPattern):
                urls.append({
                    'pattern': prefix + str(pattern.pattern),
                    'name': pattern.name,
                    'callback': pattern.callback.__name__ if hasattr(pattern.callback, '__name__') else str(pattern.callback),
                })
            elif isinstance(pattern, URLResolver):
                urls.extend(collect_urls(pattern, prefix + str(pattern.pattern)))
        return urls
    
    all_urls = collect_urls(resolver)
    
    # Filter for earnings-related URLs
    earnings_urls = [url for url in all_urls if 'earnings' in url['pattern']]
    
    return Response({
        'request_path': request.path,
        'earnings_urls': earnings_urls,
    })