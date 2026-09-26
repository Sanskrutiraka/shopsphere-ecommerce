from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductStock, PriceHistory, Wishlist, WishlistItem, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'parent', 'is_active', 'children', 'product_count']
        read_only_fields = ['slug', 'children', 'product_count']

    def get_children(self, obj):
        return CategorySerializer(obj.children.filter(is_active=True), many=True).data

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'image_url', 'alt_text', 'is_primary', 'order']

    def get_image_url(self, obj):
        return str(obj.image.url) if obj.image else None


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
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        return ProductImageSerializer(img).data if img else None

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
    images = ProductImageSerializer(many=True, read_only=True)
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
