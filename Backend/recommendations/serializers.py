from rest_framework import serializers

from .models import RecommendationFeedback


class RecommendationFeedbackSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    feedback_type = serializers.ChoiceField(choices=RecommendationFeedback.FEEDBACK_CHOICES)
    note = serializers.CharField(required=False, allow_blank=True)