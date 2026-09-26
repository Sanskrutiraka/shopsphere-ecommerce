from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('', views.ProductListView.as_view(), name='product-list'),
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    # Customer
    path('wishlist/', views.WishlistView.as_view(), name='wishlist'),

    path('<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('<int:product_id>/reviews/', views.ProductReviewView.as_view(), name='product-reviews'),

    # Admin
    path('admin/products/', views.AdminProductListView.as_view(), name='admin-product-list'),
    path('admin/products/<int:pk>/', views.AdminProductDetailView.as_view(), name='admin-product-detail'),
    path('admin/products/<int:product_id>/images/', views.ProductImageUploadView.as_view(), name='product-images'),
    path('admin/products/generate-description/', views.ProductDescriptionGenerateView.as_view(), name='product-generate-description'),
    path('admin/stock/', views.StockUpdateView.as_view(), name='stock-management'),
    path('admin/pricing/<int:product_id>/', views.PriceManagementView.as_view(), name='price-management'),
]
