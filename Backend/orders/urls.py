from django.urls import path
from . import views

urlpatterns = [
    # Cart
    path('cart/', views.CartView.as_view(), name='cart'),

    # Customer Orders
    path('place/', views.PlaceOrderView.as_view(), name='place-order'),
    path('my-orders/', views.CustomerOrderListView.as_view(), name='customer-orders'),
    path('my-orders/<int:pk>/', views.CustomerOrderDetailView.as_view(), name='customer-order-detail'),

    # Admin Orders
    path('admin/orders/', views.AdminOrderListView.as_view(), name='admin-orders'),
    path('admin/orders/<int:pk>/', views.AdminOrderDetailView.as_view(), name='admin-order-detail'),
    path('admin/orders/<int:pk>/status/', views.AdminUpdateOrderStatusView.as_view(), name='admin-order-status'),
]
