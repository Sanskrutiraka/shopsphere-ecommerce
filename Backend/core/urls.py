import os
import mimetypes
import urllib.parse
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.http import FileResponse, HttpResponse, Http404
from reports.views import OrderReportView, PaymentReportView


def serve_media(request, path):
    """Serve media files with proper CORS, unquoting, and mime types to prevent ORB blocking."""
    raw_path = urllib.parse.unquote(path).replace('\\', '/').lstrip('/')
    
    # 1. Direct path in MEDIA_ROOT
    target = os.path.join(settings.MEDIA_ROOT, raw_path.replace('/', os.sep))
    if not os.path.isfile(target):
        # 2. Check in products subfolder
        target = os.path.join(settings.MEDIA_ROOT, 'products', os.path.basename(raw_path))
    
    if not os.path.isfile(target):
        # 3. Check by prefix matching (e.g., "3_" for product 3)
        prod_dir = os.path.join(settings.MEDIA_ROOT, 'products')
        if os.path.isdir(prod_dir):
            base = os.path.basename(raw_path)
            prefix = base.split('_', 1)[0] + '_' if '_' in base else None
            if prefix:
                for fname in os.listdir(prod_dir):
                    if fname.startswith(prefix):
                        target = os.path.join(prod_dir, fname)
                        break

    if os.path.isfile(target):
        mime, _ = mimetypes.guess_type(target)
        if not mime:
            if target.lower().endswith('.webp'):
                mime = 'image/webp'
            elif target.lower().endswith('.png'):
                mime = 'image/png'
            elif target.lower().endswith('.jpg') or target.lower().endswith('.jpeg'):
                mime = 'image/jpeg'
            else:
                mime = 'application/octet-stream'
        
        response = FileResponse(open(target, 'rb'), content_type=mime)
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Cross-Origin-Resource-Policy'] = 'cross-origin'
        response['Cache-Control'] = 'public, max-age=86400'
        return response

    # If file not found, return a lightweight empty transparent image with CORS so ORB is never triggered
    svg_fallback = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="none"/>'
    response = HttpResponse(svg_fallback, content_type='image/svg+xml', status=404)
    response['Access-Control-Allow-Origin'] = '*'
    response['Cross-Origin-Resource-Policy'] = 'cross-origin'
    return response


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/reports/orders/', OrderReportView.as_view(), name='order-report-direct'),
    path('api/reports/orders', OrderReportView.as_view(), name='order-report-direct-no-slash'),
    path('api/reports/payments/', PaymentReportView.as_view(), name='payment-report-direct'),
    path('api/reports/payments', PaymentReportView.as_view(), name='payment-report-direct-no-slash'),
    path('api/reports/', include('reports.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/recommendations/', include('recommendations.urls')),
    re_path(r'^media/(?P<path>.*)$', serve_media),
]
