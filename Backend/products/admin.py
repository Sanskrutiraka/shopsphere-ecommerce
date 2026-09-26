from django.contrib import admin
from .models import Category, Product, ProductImage, ProductStock, PriceHistory, Wishlist, WishlistItem, ProductReview


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'is_active', 'is_featured', 'created_at']
    list_filter = ['is_active', 'is_featured', 'category']
    search_fields = ['name', 'sku', 'brand']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'parent', 'is_active']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(ProductStock)
class ProductStockAdmin(admin.ModelAdmin):
    list_display = ['product', 'quantity', 'min_level', 'is_below_minimum', 'updated_at']


@admin.register(PriceHistory)
class PriceHistoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'base_price', 'discount_percentage', 'selling_price', 'is_active', 'effective_from']


admin.site.register(ProductImage)
admin.site.register(Wishlist)
admin.site.register(WishlistItem)
admin.site.register(ProductReview)
