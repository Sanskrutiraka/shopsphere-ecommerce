from django.urls import path
from . import views

urlpatterns = [
    path('admin/', views.AdminPaymentListView.as_view(), name='admin-payments'),
    path('my-payments/', views.CustomerPaymentListView.as_view(), name='customer-payments'),
    path('<int:pk>/simulate/', views.SimulatePaymentView.as_view(), name='simulate-payment'),
    path('razorpay/create-order/', views.RazorpayCreateOrderView.as_view(), name='razorpay-create-order'),
    path('razorpay/verify/', views.RazorpayVerifyPaymentView.as_view(), name='razorpay-verify-payment'),
]
