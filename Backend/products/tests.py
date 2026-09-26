from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import User
from .models import Category, Product, ProductImage, ProductStock


class StockManagementApiTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.admin = User.objects.create_user(
			email='admin@example.com',
			password='password123',
			first_name='Admin',
			last_name='User',
			role='ADMIN',
			is_staff=True,
			is_approved=True,
			is_verified=True,
			status='ACTIVE',
		)
		self.client.force_authenticate(user=self.admin)

		self.category = Category.objects.create(name='Electronics', slug='electronics')
		self.product = Product.objects.create(
			name='Wireless Mouse',
			slug='wireless-mouse',
			description='Ergonomic mouse',
			category=self.category,
			sku='MOUSE-001',
			created_by=self.admin,
		)
		self.stock = ProductStock.objects.create(product=self.product, quantity=12, min_level=5)
		self.image = ProductImage.objects.create(
			product=self.product,
			image=SimpleUploadedFile('mouse.jpg', b'fake-image-bytes', content_type='image/jpeg'),
			alt_text='Wireless mouse',
			is_primary=True,
			order=0,
		)

	def test_stock_endpoint_returns_primary_image(self):
		response = self.client.get('/api/products/admin/stock/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(len(response.data), 1)
		item = response.data[0]
		self.assertEqual(item['product_id'], self.product.id)
		self.assertIn('primary_image', item)
		self.assertIsNotNone(item['primary_image'])
		self.assertEqual(item['primary_image']['id'], self.image.id)
		self.assertEqual(item['primary_image']['alt_text'], 'Wireless mouse')
