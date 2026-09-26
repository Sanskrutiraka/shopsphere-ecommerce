from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('register/', views.RegisterView.as_view(), name='register'),
    path('verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend-otp'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('addresses/', views.UserAddressListCreateView.as_view(), name='address-list'),
    path('addresses/<int:pk>/', views.UserAddressDetailView.as_view(), name='address-detail'),

    # Admin - User Management
    path('admin/users/', views.AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:pk>/action/', views.AdminUserActionView.as_view(), name='admin-user-action'),
    path('admin/logs/', views.AdminLogListView.as_view(), name='admin-logs'),
    path('admin/dashboard/', views.DashboardStatsView.as_view(), name='admin-dashboard'),
]
