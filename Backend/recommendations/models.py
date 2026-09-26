from django.db import models


class BrowsingHistory(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='browsing_history')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='views')
    viewed_at = models.DateTimeField(auto_now=True)
    view_count = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'browsing_history'
        unique_together = ['user', 'product']
        ordering = ['-viewed_at']

    def __str__(self):
        return f"{self.user.email} viewed {self.product.name}"


class RecommendationFeedback(models.Model):
    FEEDBACK_CHOICES = [
        ('HELPFUL', 'Helpful'),
        ('NOT_HELPFUL', 'Not Helpful'),
    ]

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='recommendation_feedback')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='recommendation_feedback')
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_CHOICES)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'recommendation_feedback'
        unique_together = ['user', 'product']
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.email} -> {self.product.name} ({self.feedback_type})"
