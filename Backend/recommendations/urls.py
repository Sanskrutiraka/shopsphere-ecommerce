from django.urls import path
from . import views

urlpatterns = [
    path('', views.RecommendationsView.as_view(), name='recommendations'),
    path('track/', views.TrackBrowsingView.as_view(), name='track-browsing'),
    path('feedback/', views.RecommendationFeedbackView.as_view(), name='recommendation-feedback'),
]
