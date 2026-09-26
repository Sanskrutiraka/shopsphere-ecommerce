import os
import django
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from products.models import Category, Product, ProductStock, PriceHistory

def seed():
    print("Seeding users...")
    admin, created = User.objects.get_or_create(
        email='admin@shopsphere.com',
        defaults={
            'first_name': 'Admin',
            'last_name': 'ShopSphere',
            'role': 'SUPERADMIN',
            'status': 'ACTIVE',
            'is_verified': True,
            'is_approved': True,
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin.set_password('admin123')
        admin.save()
        print("Created superadmin: admin@shopsphere.com / admin123")
    else:
        print("Superadmin already exists")

    customer, created = User.objects.get_or_create(
        email='user@shopsphere.com',
        defaults={
            'first_name': 'Demo',
            'last_name': 'User',
            'role': 'CUSTOMER',
            'status': 'ACTIVE',
            'is_verified': True,
            'is_approved': True,
        }
    )
    if created:
        customer.set_password('user123')
        customer.save()
        print("Created customer: user@shopsphere.com / user123")
    else:
        print("Customer already exists")

    print("\nSeeding categories and products...")
    categories_data = [
        {'name': 'Electronics', 'slug': 'electronics', 'description': 'Gadgets, devices and more'},
        {'name': 'Audio & Headphones', 'slug': 'audio-headphones', 'description': 'Premium headphones, earbuds and speakers'},
        {'name': 'Wearables & Smartwatches', 'slug': 'wearables', 'description': 'Fitness trackers and smartwatches'},
        {'name': 'Fashion & Apparel', 'slug': 'fashion', 'description': 'Trendy clothing and accessories'},
        {'name': 'Home & Lifestyle', 'slug': 'home-lifestyle', 'description': 'Modern home essentials'},
    ]

    cat_map = {}
    for cdata in categories_data:
        cat, _ = Category.objects.get_or_create(
            slug=cdata['slug'],
            defaults={'name': cdata['name'], 'description': cdata['description'], 'is_active': True}
        )
        cat_map[cdata['slug']] = cat

    products_data = [
        {
            'name': 'Aura Pro Wireless Noise-Cancelling Headphones',
            'slug': 'aura-pro-wireless-headphones',
            'brand': 'SonicWave',
            'category': cat_map['audio-headphones'],
            'sku': 'AUD-AURA-001',
            'description': 'Industry-leading active noise cancellation with 40-hour battery life and spatial audio support.',
            'is_featured': True,
            'price': Decimal('299.99'),
            'discount': Decimal('15.00'),
            'sale_label': 'Summer Deal',
            'stock': 45,
        },
        {
            'name': 'Nova Ultra Smartwatch Series 5',
            'slug': 'nova-ultra-smartwatch-s5',
            'brand': 'NovaTech',
            'category': cat_map['wearables'],
            'sku': 'WEAR-NOVA-005',
            'description': 'Advanced health tracking, AMOLED display, ECG monitoring, and waterproof up to 50m.',
            'is_featured': True,
            'price': Decimal('349.00'),
            'discount': Decimal('10.00'),
            'sale_label': 'Hot Seller',
            'stock': 30,
        },
        {
            'name': 'Lumina 4K OLED Gaming Monitor 27"',
            'slug': 'lumina-4k-oled-gaming-monitor-27',
            'brand': 'Lumina',
            'category': cat_map['electronics'],
            'sku': 'DISP-LUM-027',
            'description': 'Ultra-fast 240Hz refresh rate, 0.03ms response time, 99% DCI-P3 color gamut OLED display.',
            'is_featured': True,
            'price': Decimal('799.99'),
            'discount': Decimal('5.00'),
            'sale_label': 'Featured',
            'stock': 15,
        },
        {
            'name': 'Pulse Mini Portable Bluetooth Speaker',
            'slug': 'pulse-mini-portable-speaker',
            'brand': 'SonicWave',
            'category': cat_map['audio-headphones'],
            'sku': 'AUD-PLS-002',
            'description': 'Deep bass, IP67 waterproof and dustproof with 360-degree room-filling sound.',
            'is_featured': False,
            'price': Decimal('79.99'),
            'discount': Decimal('0.00'),
            'sale_label': '',
            'stock': 60,
        },
        {
            'name': 'ErgoFit Minimalist Mechanical Keyboard',
            'slug': 'ergofit-minimalist-mechanical-keyboard',
            'brand': 'KeyCraft',
            'category': cat_map['electronics'],
            'sku': 'ACC-KEY-087',
            'description': 'Hot-swappable custom tactile switches, RGB per-key backlighting, aluminum CNC chassis.',
            'is_featured': True,
            'price': Decimal('149.50'),
            'discount': Decimal('20.00'),
            'sale_label': 'Special Offer',
            'stock': 25,
        },
        {
            'name': 'Urban Commuter Waterproof Backpack',
            'slug': 'urban-commuter-backpack',
            'brand': 'Aegis',
            'category': cat_map['fashion'],
            'sku': 'FASH-BAG-012',
            'description': 'Durable Cordura fabric, dedicated padded 16-inch laptop compartment, hidden anti-theft pocket.',
            'is_featured': False,
            'price': Decimal('89.00'),
            'discount': Decimal('0.00'),
            'sale_label': '',
            'stock': 50,
        },
    ]

    for pdata in products_data:
        prod, pcreated = Product.objects.get_or_create(
            slug=pdata['slug'],
            defaults={
                'name': pdata['name'],
                'brand': pdata['brand'],
                'category': pdata['category'],
                'sku': pdata['sku'],
                'description': pdata['description'],
                'is_featured': pdata['is_featured'],
                'is_active': True,
                'created_by': admin,
            }
        )
        ProductStock.objects.update_or_create(
            product=prod,
            defaults={'quantity': pdata['stock'], 'min_level': 5, 'max_level': 200, 'updated_by': admin}
        )
        PriceHistory.objects.get_or_create(
            product=prod,
            is_active=True,
            defaults={
                'base_price': pdata['price'],
                'discount_percentage': pdata['discount'],
                'sale_label': pdata['sale_label'],
                'effective_from': timezone.now() - timedelta(days=1),
            }
        )
        print(f"Product seeded: {prod.name}")

    print("\n[SUCCESS] Seed completed successfully!")

if __name__ == '__main__':
    seed()
