from django.contrib import admin
from .models import BrowsingHistory, RecommendationFeedback


@admin.register(BrowsingHistory)
class BrowsingHistoryAdmin(admin.ModelAdmin):
	list_display = ['user', 'product', 'view_count', 'viewed_at']
	list_filter = ['viewed_at']
	search_fields = ['user__email', 'product__name', 'product__sku']


@admin.register(RecommendationFeedback)
class RecommendationFeedbackAdmin(admin.ModelAdmin):
	list_display = ['user', 'product', 'feedback_type', 'updated_at']
	list_filter = ['feedback_type', 'updated_at']
	search_fields = ['user__email', 'product__name', 'product__sku']
