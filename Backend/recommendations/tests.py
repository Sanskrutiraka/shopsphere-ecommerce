from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from products.models import Category, Product, ProductReview, ProductStock

from .models import BrowsingHistory, RecommendationFeedback


class RecommendationApiTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.customer = User.objects.create_user(
			email='customer@example.com',
			password='password123',
			first_name='Jane',
			last_name='Doe',
			role='CUSTOMER',
			is_verified=True,
			is_approved=True,
			status='ACTIVE',
		)
		self.reviewer = User.objects.create_user(
			email='reviewer@example.com',
			password='password123',
			first_name='John',
			last_name='Smith',
			role='CUSTOMER',
			is_verified=True,
			is_approved=True,
			status='ACTIVE',
		)
		self.client.force_authenticate(user=self.customer)

		self.category = Category.objects.create(name='Electronics', slug='electronics')
		self.other_category = Category.objects.create(name='Home', slug='home')

		self.viewed_product = Product.objects.create(
			name='Viewed Product',
			slug='viewed-product',
			description='A browsed item',
			category=self.category,
			sku='VIEW-001',
			created_by=self.reviewer,
		)
		self.recommended_product = Product.objects.create(
			name='Recommended Product',
			slug='recommended-product',
			description='Highly rated product',
			category=self.category,
			sku='REC-001',
			brand='BrandA',
			is_featured=True,
			created_by=self.reviewer,
		)
		self.secondary_product = Product.objects.create(
			name='Secondary Product',
			slug='secondary-product',
			description='Lower rated product',
			category=self.other_category,
			sku='SEC-001',
			brand='BrandB',
			is_featured=True,
			created_by=self.reviewer,
		)

		ProductStock.objects.create(product=self.viewed_product, quantity=5, min_level=2)
		ProductStock.objects.create(product=self.recommended_product, quantity=5, min_level=2)
		ProductStock.objects.create(product=self.secondary_product, quantity=5, min_level=2)

		ProductReview.objects.create(
			product=self.recommended_product,
			user=self.reviewer,
			rating=5,
			title='Great',
			comment='Excellent product.',
		)
		ProductReview.objects.create(
			product=self.secondary_product,
			user=self.reviewer,
			rating=3,
			title='Okay',
			comment='Average product.',
		)

		BrowsingHistory.objects.create(user=self.customer, product=self.viewed_product)
		RecommendationFeedback.objects.create(
			user=self.customer,
			product=self.recommended_product,
			feedback_type='HELPFUL',
		)

	def test_recommendations_rank_highly_reviewed_and_helpful_products_first(self):
		response = self.client.get('/api/recommendations/')

		self.assertEqual(response.status_code, 200)
		self.assertGreaterEqual(response.data['count'], 2)
		recommendations = response.data['recommendations']
		self.assertIn('recommendation_score', recommendations[0])
		self.assertIn('recommendation_reasons', recommendations[0])
		self.assertEqual(recommendations[0]['id'], self.recommended_product.id)

	def test_feedback_endpoint_saves_user_input(self):
		response = self.client.post('/api/recommendations/feedback/', {
			'product_id': self.secondary_product.id,
			'feedback_type': 'NOT_HELPFUL',
			'note': 'Not relevant to me',
		}, format='json')

		self.assertEqual(response.status_code, 201)
		self.assertEqual(response.data['product_id'], self.secondary_product.id)
		self.assertEqual(
			RecommendationFeedback.objects.get(user=self.customer, product=self.secondary_product).feedback_type,
			'NOT_HELPFUL'
		)
