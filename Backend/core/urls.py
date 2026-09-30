from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from reports.views import OrderReportView, PaymentReportView

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
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
