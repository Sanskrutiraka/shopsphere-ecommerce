from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductStock, PriceHistory, Wishlist, WishlistItem, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'parent', 'is_active', 'children', 'product_count']
        read_only_fields = ['slug', 'children', 'product_count']

    def get_image(self, obj):
        if not obj or not obj.image:
            return None
        request = self.context.get('request') if hasattr(self, 'context') else None
        return _resolve_image_url(obj.image, request=request)

    def get_children(self, obj):
        return CategorySerializer(obj.children.filter(is_active=True), many=True, context=self.context).data

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


def _extract_media_filename(val_str):
    if not val_str:
        return ""
    s = str(val_str).replace('\\', '/').strip()
    if '://' in s:
        s = s.split('://', 1)[1]
        if '/' in s:
            s = s.split('/', 1)[1]
    if 'image/upload/' in s:
        s = s.split('image/upload/', 1)[1]
    import re
    s = re.sub(r'^v\d+/', '', s)
    if s.startswith('/media/'):
        s = s[7:]
    elif s.startswith('media/'):
        s = s[6:]
    return s.lstrip('/')


def _resolve_image_url(image_field_value, product_id=None, request=None):
    import os
    import urllib.parse
    from django.conf import settings

    raw_str = str(image_field_value).strip() if image_field_value else ""

    def _format_media_url(path):
        quoted_path = urllib.parse.quote(path.replace('\\', '/').lstrip('/'))
        media_path = f"/media/{quoted_path}"
        if request:
            try:
                return request.build_absolute_uri(media_path)
            except Exception:
                pass
        render_host = getattr(settings, 'RENDER_EXTERNAL_HOSTNAME', None) or os.getenv('RENDER_EXTERNAL_HOSTNAME')
        if render_host:
            return f"https://{render_host}{media_path}"
        backend_url = os.getenv('BACKEND_URL', '').rstrip('/')
        if backend_url:
            return f"{backend_url}{media_path}"
        return f"http://127.0.0.1:8000{media_path}"

    clean = _extract_media_filename(raw_str)

    # 1. First priority: Check if file actually exists on local disk (MEDIA_ROOT)
    if clean:
        p1 = os.path.join(settings.MEDIA_ROOT, clean.replace('/', os.sep))
        if os.path.isfile(p1):
            return _format_media_url(clean)

        p2 = os.path.join(settings.MEDIA_ROOT, 'products', os.path.basename(clean))
        if os.path.isfile(p2):
            return _format_media_url(f"products/{os.path.basename(clean)}")

        p3 = os.path.join(settings.MEDIA_ROOT, os.path.basename(clean))
        if os.path.isfile(p3):
            return _format_media_url(os.path.basename(clean))

    # 2. Check if product_id has an image file on disk in media/products/
    if product_id:
        prod_dir = os.path.join(settings.MEDIA_ROOT, 'products')
        if os.path.isdir(prod_dir):
            prefix = f"{product_id}_"
            for fname in os.listdir(prod_dir):
                if fname.startswith(prefix):
                    return _format_media_url(f"products/{fname}")

    # 3. Check if image_field_value is a CloudinaryResource or FieldFile with .url
    if image_field_value and hasattr(image_field_value, 'url'):
        try:
            url = image_field_value.url
            if url and ('res.cloudinary.com' in url or url.startswith('http')):
                if url.startswith('http://res.cloudinary.com'):
                    url = url.replace('http://', 'https://')
                return url
        except Exception:
            pass

    # 4. If raw_str is a full valid HTTP/HTTPS URL
    if raw_str.startswith('http://') or raw_str.startswith('https://'):
        if raw_str.startswith('http://res.cloudinary.com'):
            return raw_str.replace('http://', 'https://')
        return raw_str

    # 5. If Cloudinary cloud name is configured and raw_str looks like a Cloudinary path
    cloud_name = (
        getattr(settings, 'CLOUDINARY_STORAGE', {}).get('CLOUD_NAME')
        or os.getenv('CLOUDINARY_CLOUD_NAME')
    )
    if cloud_name and raw_str:
        if 'image/upload/' in raw_str:
            clean_path = raw_str.split('image/upload/', 1)[1].lstrip('/')
            return f"https://res.cloudinary.com/{cloud_name}/image/upload/{clean_path}"

    # 6. Fallback formatted media URL
    if clean:
        if not clean.startswith('products/'):
            clean = f"products/{clean}"
        return _format_media_url(clean)

    return None


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'alt_text', 'is_primary', 'order']

    def get_image_url(self, obj):
        if not obj:
            return None
        request = self.context.get('request') if hasattr(self, 'context') else None
        return _resolve_image_url(
            getattr(obj, 'image', None),
            product_id=getattr(obj, 'product_id', None),
            request=request
        )


class ProductStockSerializer(serializers.ModelSerializer):
    is_below_minimum = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()

    class Meta:
        model = ProductStock
        fields = ['id', 'quantity', 'min_level', 'max_level', 'is_below_minimum', 'is_out_of_stock', 'updated_at']


class PriceHistorySerializer(serializers.ModelSerializer):
    selling_price = serializers.ReadOnlyField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PriceHistory
        fields = [
            'id', 'base_price', 'discount_percentage', 'selling_price',
            'sale_label', 'effective_from', 'effective_until', 'is_active',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else None


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = ['id', 'rating', 'title', 'comment', 'user_name', 'created_at']
        read_only_fields = ['user', 'created_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name()


class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    current_price = PriceHistorySerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_qty = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand', 'sku', 'category', 'category_name',
            'primary_image', 'current_price', 'stock_qty',
            'is_active', 'is_featured', 'avg_rating', 'review_count', 'created_at'
        ]

    def get_primary_image(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            data = ProductImageSerializer(img, context=self.context).data
            if data and not data.get('image_url'):
                data['image_url'] = _resolve_image_url(getattr(img, 'image', None), product_id=obj.id, request=request)
            return data
        disk_url = _resolve_image_url(None, product_id=obj.id, request=request)
        if disk_url:
            return {
                'id': 0,
                'image': disk_url,
                'image_url': disk_url,
                'alt_text': obj.name,
                'is_primary': True,
                'order': 0
            }
        return None

    def get_stock_qty(self, obj):
        return obj.stock.quantity if hasattr(obj, 'stock') else 0

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return None

    def get_review_count(self, obj):
        return obj.reviews.count()


class ProductDetailSerializer(serializers.ModelSerializer):
    images = serializers.SerializerMethodField()
    stock = ProductStockSerializer(read_only=True)
    current_price = PriceHistorySerializer(read_only=True)
    price_history = PriceHistorySerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    avg_rating = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'brand', 'sku',
            'category', 'images', 'stock', 'current_price', 'price_history',
            'reviews', 'avg_rating', 'is_active', 'is_featured', 'created_at', 'updated_at'
        ]

    def get_images(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        imgs = obj.images.all()
        if imgs.exists():
            data_list = ProductImageSerializer(imgs, many=True, context=self.context).data
            for d in data_list:
                if not d.get('image_url'):
                    d['image_url'] = _resolve_image_url(d.get('image'), product_id=obj.id, request=request)
            return data_list
        disk_url = _resolve_image_url(None, product_id=obj.id, request=request)
        if disk_url:
            return [{
                'id': 0,
                'image': disk_url,
                'image_url': disk_url,
                'alt_text': obj.name,
                'is_primary': True,
                'order': 0
            }]
        return []

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return None


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'slug', 'description', 'category', 'brand', 'sku', 'is_active', 'is_featured']
        read_only_fields = ['slug']


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True), source='product', write_only=True
    )

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'added_at']


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Wishlist
        fields = ['id', 'items', 'item_count', 'created_at']

    def get_item_count(self, obj):
        return obj.items.count()
