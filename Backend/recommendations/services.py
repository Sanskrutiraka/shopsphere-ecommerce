from django.db.models import Avg, Count, Q
from django.db.models.functions import Coalesce

from orders.models import OrderItem
from products.models import Product, ProductReview

from .models import BrowsingHistory


class RecommendationEngine:
    def __init__(self, user, limit=8):
        self.user = user
        self.limit = limit

    def build(self):
        browsed_history = list(
            BrowsingHistory.objects.filter(user=self.user)
            .select_related('product__category')
            .order_by('-viewed_at')[:30]
        )
        browsed_product_ids = {history.product_id for history in browsed_history}
        browsed_category_ids = {history.product.category_id for history in browsed_history if history.product.category_id}

        purchased_items = list(
            OrderItem.objects.filter(order__user=self.user)
            .select_related('product__category')
        )
        purchased_product_ids = {item.product_id for item in purchased_items if item.product_id}
        purchased_category_ids = {item.product.category_id for item in purchased_items if item.product and item.product.category_id}

        liked_reviews = ProductReview.objects.filter(user=self.user, rating__gte=4).select_related('product__category')
        liked_brand_names = {review.product.brand for review in liked_reviews if review.product and review.product.brand}
        liked_review_category_ids = {review.product.category_id for review in liked_reviews if review.product and review.product.category_id}

        candidate_ids = set()
        candidate_ids.update(browsed_product_ids)
        candidate_ids.update(purchased_product_ids)
        candidate_ids.update(self._related_products_from_categories(browsed_category_ids | purchased_category_ids | liked_review_category_ids))
        candidate_ids.update(self._collaborative_product_ids(purchased_product_ids))
        candidate_ids.update(self._top_rated_product_ids())
        candidate_ids.update(self._featured_product_ids())

        candidate_ids.difference_update(browsed_product_ids)
        candidate_ids.difference_update(purchased_product_ids)

        products = list(
            Product.objects.filter(id__in=candidate_ids, is_active=True, stock__quantity__gt=0)
            .select_related('category', 'stock')
            .prefetch_related('images', 'price_history', 'reviews')
            .annotate(
                avg_rating=Coalesce(Avg('reviews__rating'), 0.0),
                review_count=Count('reviews', distinct=True),
                helpful_feedback_count=Count(
                    'recommendation_feedback',
                    filter=Q(recommendation_feedback__feedback_type='HELPFUL'),
                    distinct=True,
                ),
                not_helpful_feedback_count=Count(
                    'recommendation_feedback',
                    filter=Q(recommendation_feedback__feedback_type='NOT_HELPFUL'),
                    distinct=True,
                ),
            )
        )

        scored = []
        collaborative_ids = set(self._collaborative_product_ids(purchased_product_ids))
        for product in products:
            score = 0.0
            reasons = []

            if product.category_id in browsed_category_ids:
                score += 5.0
                reasons.append('same category as recently viewed products')

            if product.category_id in purchased_category_ids:
                score += 4.0
                reasons.append('same category as your purchases')

            if product.category_id in liked_review_category_ids:
                score += 2.0
                reasons.append('matches categories from your positive reviews')

            if product.brand and product.brand in liked_brand_names:
                score += 2.0
                reasons.append('same brand as products you rated highly')

            if product.id in collaborative_ids:
                score += 6.0
                reasons.append('frequently bought together')

            if getattr(product, 'is_featured', False):
                score += 1.5
                reasons.append('featured product')

            score += float(product.avg_rating or 0) * 1.4
            score += min(int(product.review_count or 0), 50) * 0.08
            score += int(product.helpful_feedback_count or 0) * 1.5
            score -= int(product.not_helpful_feedback_count or 0) * 2.5

            if score > 0:
                scored.append((score, reasons, product))

        scored.sort(key=lambda item: (item[0], item[2].created_at), reverse=True)
        return scored[: self.limit]

    def _related_products_from_categories(self, category_ids):
        if not category_ids:
            return set()
        return set(
            Product.objects.filter(is_active=True, stock__quantity__gt=0, category_id__in=category_ids)
            .values_list('id', flat=True)
        )

    def _collaborative_product_ids(self, purchased_product_ids):
        if not purchased_product_ids:
            return set()

        other_buyers = (
            OrderItem.objects.filter(product_id__in=purchased_product_ids)
            .exclude(order__user=self.user)
            .values_list('order__user_id', flat=True)
            .distinct()
        )

        collab_rows = (
            OrderItem.objects.filter(order__user_id__in=other_buyers)
            .exclude(product_id__in=purchased_product_ids)
            .values('product_id')
            .annotate(score=Count('id'))
            .order_by('-score')
        )
        return {row['product_id'] for row in collab_rows}

    def _top_rated_product_ids(self):
        return set(
            ProductReview.objects.values('product_id')
            .annotate(avg_rating=Avg('rating'), review_count=Count('id'))
            .filter(avg_rating__gte=4.0, review_count__gte=2)
            .values_list('product_id', flat=True)
        )

    def _featured_product_ids(self):
        return set(
            Product.objects.filter(is_active=True, is_featured=True, stock__quantity__gt=0)
            .values_list('id', flat=True)
        )