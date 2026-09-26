from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from products.models import Product
from products.serializers import ProductListSerializer

from .models import BrowsingHistory, RecommendationFeedback
from .serializers import RecommendationFeedbackSerializer
from .services import RecommendationEngine


class RecommendationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get('limit', 8))
        except (TypeError, ValueError):
            limit = 8
        limit = max(1, min(limit, 24))
        ranked = RecommendationEngine(request.user, limit=limit).build()

        products = [product for _, _, product in ranked]
        serializer = ProductListSerializer(products, many=True)
        payload = []
        for index, (item, (_, reasons, _product)) in enumerate(zip(serializer.data, ranked)):
            payload.append({
                **item,
                'recommendation_score': round(ranked[index][0], 2),
                'recommendation_reasons': reasons,
            })
        return Response({
            'count': len(payload),
            'recommendations': payload
        })


class RecommendationFeedbackView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RecommendationFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            product = Product.objects.get(pk=serializer.validated_data['product_id'], is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        feedback, _ = RecommendationFeedback.objects.update_or_create(
            user=request.user,
            product=product,
            defaults={
                'feedback_type': serializer.validated_data['feedback_type'],
                'note': serializer.validated_data.get('note', ''),
            }
        )
        return Response({
            'message': 'Feedback saved.',
            'feedback_type': feedback.feedback_type,
            'product_id': feedback.product_id,
        }, status=status.HTTP_201_CREATED)


class TrackBrowsingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=404)

        hist, created = BrowsingHistory.objects.get_or_create(user=request.user, product=product)
        if not created:
            hist.view_count += 1
            hist.save()
        return Response({'tracked': True})
