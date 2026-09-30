from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, OrderStatusHistory
from products.serializers import ProductListSerializer, ProductImageSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    unit_price = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'unit_price', 'subtotal', 'added_at']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()
    item_count = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'item_count', 'updated_at']


class OrderItemSerializer(serializers.ModelSerializer):
    product_image = serializers.SerializerMethodField()
    product_slug = serializers.CharField(source='product.slug', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'product_slug', 'product_image',
            'quantity', 'unit_price', 'discount_percentage', 'subtotal'
        ]

    def get_product_image(self, obj):
        if obj.product:
            img = obj.product.images.filter(is_primary=True).first() or obj.product.images.first()
            if img:
                return ProductImageSerializer(img, context=self.context).data
        return None


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'changed_by', 'changed_by_name', 'note', 'timestamp']

    def get_changed_by_name(self, obj):
        return obj.changed_by.get_full_name() if obj.changed_by else 'System'


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'user_email', 'user_name',
            'status', 'payment_method', 'payment_status',
            'shipping_name', 'shipping_phone',
            'total_amount', 'item_count', 'placed_at', 'updated_at'
        ]

    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()

    def get_item_count(self, obj):
        return obj.items.count()

    def get_user_name(self, obj):
        return obj.user.get_full_name()


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user_email', 'user_name',
            'status', 'payment_method', 'payment_status',
            'shipping_name', 'shipping_phone', 'shipping_address',
            'shipping_city', 'shipping_state', 'shipping_pincode',
            'subtotal', 'discount_amount', 'shipping_charge', 'total_amount',
            'notes', 'rejection_reason', 'tracking_number',
            'items', 'status_history',
            'placed_at', 'updated_at', 'delivered_at'
        ]

    def get_user_name(self, obj):
        return obj.user.get_full_name()


class PlaceOrderSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=['COD', 'CARD', 'UPI', 'NETBANKING'])
    shipping_name = serializers.CharField()
    shipping_phone = serializers.CharField()
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField()
    shipping_state = serializers.CharField()
    shipping_pincode = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True)


class UpdateOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['ACCEPTED', 'REJECTED', 'PROCESSED', 'DISPATCHED', 'DELIVERED'])
    note = serializers.CharField(required=False, allow_blank=True)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
    tracking_number = serializers.CharField(required=False, allow_blank=True)
