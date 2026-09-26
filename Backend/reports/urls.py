from django.urls import path
from . import views

urlpatterns = [
    path('payments/', views.PaymentReportView.as_view(), name='payment-report'),
    path('payments', views.PaymentReportView.as_view(), name='payment-report-no-slash'),
    path('orders/', views.OrderReportView.as_view(), name='order-report'),
    path('orders', views.OrderReportView.as_view(), name='order-report-no-slash'),
]
