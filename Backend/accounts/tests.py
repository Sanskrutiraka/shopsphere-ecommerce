from decimal import Decimal

from django.core import mail
from django.test import override_settings
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from orders.models import Order, OrderItem
from payments.models import Payment
from products.models import Category, Product, ProductStock

from .models import AdminLog, User


class AdminDashboardApiTests(TestCase):
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
		self.customer = User.objects.create_user(
			email='customer@example.com',
			password='password123',
			first_name='Jane',
			last_name='Doe',
			role='CUSTOMER',
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
		ProductStock.objects.create(product=self.product, quantity=2, min_level=5)

		self.order = Order.objects.create(
			user=self.customer,
			shipping_name='Jane Doe',
			shipping_phone='9999999999',
			shipping_address='123 Main Street',
			shipping_city='Pune',
			shipping_state='Maharashtra',
			shipping_pincode='411001',
			subtotal=Decimal('1000.00'),
			shipping_charge=Decimal('0.00'),
			total_amount=Decimal('1000.00'),
			payment_method='COD',
			status='DELIVERED',
		)
		OrderItem.objects.create(
			order=self.order,
			product=self.product,
			product_name=self.product.name,
			product_sku=self.product.sku,
			quantity=1,
			unit_price=Decimal('1000.00'),
			discount_percentage=Decimal('0.00'),
			subtotal=Decimal('1000.00'),
		)
		Payment.objects.create(
			order=self.order,
			user=self.customer,
			method='COD',
			amount=Decimal('1000.00'),
			status='SUCCESS',
		)
		AdminLog.objects.create(
			admin=self.admin,
			action='UPDATE',
			model_name='Order',
			object_id=self.order.id,
			description='Updated order status',
		)

	def test_dashboard_endpoint_returns_extended_metrics(self):
		response = self.client.get(reverse('admin-dashboard'))

		self.assertEqual(response.status_code, 200)
		self.assertIn('today_collections', response.data)
		self.assertIn('today_order_statuses', response.data)
		self.assertIn('trending_products', response.data)
		self.assertIn('low_stock_products', response.data)
		self.assertIn('top_customer_today', response.data)
		self.assertEqual(response.data['low_stock_count'], 1)
		self.assertEqual(response.data['top_customer_today']['email'], self.customer.email)


@override_settings(
	EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
	EMAIL_HOST_USER='noreply@example.com',
)
class AccountEmailTests(TestCase):
	def test_register_sends_verification_email(self):
		client = APIClient()
		response = client.post('/api/auth/register/', {
			'email': 'newuser@example.com',
			'first_name': 'New',
			'last_name': 'User',
			'phone': '9999999999',
			'password': 'password123',
			'confirm_password': 'password123',
		}, format='json')

		self.assertEqual(response.status_code, 201)
		self.assertEqual(len(mail.outbox), 1)
		self.assertEqual(mail.outbox[0].to, ['newuser@example.com'])
		self.assertEqual(mail.outbox[0].from_email, 'noreply@example.com')

	def test_resend_otp_sends_email(self):
		user = User.objects.create_user(
			email='pending@example.com',
			password='password123',
			first_name='Pending',
			last_name='User',
			role='CUSTOMER',
			is_verified=False,
			is_approved=False,
			status='PENDING',
		)

		client = APIClient()
		response = client.post('/api/auth/resend-otp/', {'email': user.email}, format='json')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(len(mail.outbox), 1)
		self.assertEqual(mail.outbox[0].to, [user.email])
		self.assertEqual(mail.outbox[0].from_email, 'noreply@example.com')
