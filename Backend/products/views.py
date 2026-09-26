from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.text import slugify
from django.utils import timezone
import os
import importlib
from django.db.models import OuterRef, Subquery, DecimalField, ExpressionWrapper, F, Value
from django.db.models.functions import Coalesce

from .models import Category, Product, ProductImage, ProductStock, PriceHistory, Wishlist, WishlistItem, ProductReview
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer,
    ProductWriteSerializer, ProductImageSerializer, ProductStockSerializer,
    PriceHistorySerializer, WishlistSerializer, WishlistItemSerializer, ProductReviewSerializer
)
from accounts.permissions import IsAdminUser


def _fallback_product_description(name: str) -> str:
    clean_name = (name or 'This product').strip()
    return (
        f"{clean_name} is designed for everyday reliability and comfort. "
        "It offers practical performance, quality materials, and a clean finish that fits a wide range of use cases. "
        "Great for customers who value durability, convenience, and a modern look."
    )


def _generate_description_with_ai(name: str, image_file) -> str:
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return _fallback_product_description(name)

    try:
        genai = importlib.import_module('google.generativeai')
    except Exception:
        return _fallback_product_description(name)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name='gemini-2.5-flash')

        prompt = (
            "Generate a concise e-commerce product description in plain text. "
            "Use 2 short paragraphs, around 80 to 120 words total. "
            "Do not include markdown, emojis, or unsupported claims. "
            f"Product name: {name}."
        )

        parts = [prompt]
        if image_file:
            image_bytes = image_file.read()
            image_file.seek(0)
            parts.append({
                'mime_type': getattr(image_file, 'content_type', None) or 'image/jpeg',
                'data': image_bytes,
            })

        response = model.generate_content(parts)
        text = (response.text or '').strip()
        return text or _fallback_product_description(name)
    except Exception:
        return _fallback_product_description(name)


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.filter(is_active=True, parent=None)
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        name = serializer.validated_data.get('name', '')
        slug = slugify(name)
        base_slug = slug
        counter = 1
        while Category.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        serializer.save(slug=slug)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [IsAdminUser()]


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'is_featured', 'is_active']
    search_fields = ['name', 'description', 'brand', 'sku']
    ordering_fields = ['created_at', 'name', 'current_price_value']
    ordering = ['-created_at']

    def get_queryset(self):
        latest_price = PriceHistory.objects.filter(
            product=OuterRef('pk'),
            is_active=True,
        ).order_by('-effective_from', '-created_at')

        qs = Product.objects.filter(is_active=True).select_related('category', 'stock').prefetch_related('images', 'price_history', 'reviews').annotate(
            current_price_base=Subquery(
                latest_price.values('base_price')[:1],
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
            current_price_discount=Subquery(
                latest_price.values('discount_percentage')[:1],
                output_field=DecimalField(max_digits=5, decimal_places=2),
            ),
        ).annotate(
            current_price_value=ExpressionWrapper(
                F('current_price_base') - (
                    F('current_price_base') * Coalesce(F('current_price_discount'), Value(0)) / Value(100)
                ),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            )
        )

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        in_stock = self.request.query_params.get('in_stock')
        if in_stock == 'true':
            qs = qs.filter(stock__quantity__gt=0)
        if min_price not in (None, ''):
            qs = qs.filter(current_price_value__gte=min_price)
        if max_price not in (None, ''):
            qs = qs.filter(current_price_value__lte=max_price)
        return qs


class AdminProductListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category', 'is_active', 'is_featured']
    search_fields = ['name', 'sku', 'brand']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductWriteSerializer
        return ProductListSerializer

    def get_queryset(self):
        return Product.objects.all().select_related('category', 'stock').prefetch_related('images', 'price_history')

    def perform_create(self, serializer):
        name = serializer.validated_data.get('name', '')
        slug = slugify(name)
        base = slug
        counter = 1
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base}-{counter}"
            counter += 1
        product = serializer.save(created_by=self.request.user, slug=slug)
        
        # Create default stock entry
        initial_quantity = self.request.data.get('quantity', 0)
        try:
            initial_quantity = int(initial_quantity)
        except (ValueError, TypeError):
            initial_quantity = 0
            
        ProductStock.objects.create(product=product, quantity=initial_quantity, updated_by=self.request.user)
        
        # Create initial price history if base_price is provided
        base_price = self.request.data.get('base_price')
        if base_price:
            from .models import PriceHistory
            from django.utils import timezone
            PriceHistory.objects.create(
                product=product,
                base_price=base_price,
                effective_from=timezone.now(),
                created_by=self.request.user
            )
            
        # Handle multiple images if provided
        images = self.request.FILES.getlist('images')
        if images:
            from .models import ProductImage
            for i, img in enumerate(images):
                ProductImage.objects.create(
                    product=product,
                    image=img,
                    is_primary=(i == 0),
                    alt_text=product.name,
                    order=i
                )
            
        return product


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).select_related('category', 'stock').prefetch_related('images', 'price_history', 'reviews')
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Track browsing history for authenticated users
        if request.user.is_authenticated and request.user.role == 'CUSTOMER':
            from recommendations.models import BrowsingHistory
            hist, created = BrowsingHistory.objects.get_or_create(user=request.user, product=instance)
            if not created:
                hist.view_count += 1
                hist.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProductDetailSerializer
        return ProductWriteSerializer

    def perform_update(self, serializer):
        product = serializer.save()
        images = self.request.FILES.getlist('images')
        if images:
            from .models import ProductImage
            ProductImage.objects.filter(product=product, is_primary=True).update(is_primary=False)
            base_order = ProductImage.objects.filter(product=product).count()
            for i, img in enumerate(images):
                ProductImage.objects.create(
                    product=product,
                    image=img,
                    is_primary=(i == 0),
                    alt_text=product.name,
                    order=base_order + i
                )


class ProductDescriptionGenerateView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        image = request.FILES.get('image')

        if not name:
            return Response({'error': 'Product name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        description = _generate_description_with_ai(name, image)
        return Response({'description': description}, status=status.HTTP_200_OK)


class ProductImageUploadView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        images = request.FILES.getlist('images')
        is_primary = request.data.get('is_primary', 'false') == 'true'
        created_images = []

        for i, image_file in enumerate(images):
            if is_primary and i == 0:
                ProductImage.objects.filter(product=product, is_primary=True).update(is_primary=False)
            img = ProductImage.objects.create(
                product=product,
                image=image_file,
                is_primary=(is_primary and i == 0),
                alt_text=request.data.get('alt_text', product.name),
                order=product.images.count() + i
            )
            created_images.append(img)

        return Response(ProductImageSerializer(created_images, many=True).data, status=status.HTTP_201_CREATED)

    def delete(self, request, product_id):
        image_id = request.data.get('image_id')
        try:
            image = ProductImage.objects.get(pk=image_id, product_id=product_id)
            image.delete()
            return Response({'message': 'Image deleted.'})
        except ProductImage.DoesNotExist:
            return Response({'error': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)


class StockUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        """List all products with stock info, filter low stock"""
        stocks = ProductStock.objects.select_related('product', 'updated_by').prefetch_related('product__images').all()
        low_only = request.query_params.get('low_stock') == 'true'
        if low_only:
            from django.db.models import F
            stocks = stocks.filter(quantity__lte=F('min_level'))

        data = []
        for s in stocks:
            primary_image = s.product.images.filter(is_primary=True).first() or s.product.images.first()
            data.append({
                'product_id': s.product.id,
                'product_name': s.product.name,
                'sku': s.product.sku,
                'primary_image': ProductImageSerializer(primary_image).data if primary_image else None,
                'quantity': s.quantity,
                'min_level': s.min_level,
                'max_level': s.max_level,
                'is_below_minimum': s.is_below_minimum,
                'is_out_of_stock': s.is_out_of_stock,
                'updated_at': s.updated_at,
            })
        return Response(data)

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity')
        min_level = request.data.get('min_level')
        max_level = request.data.get('max_level')

        try:
            stock = ProductStock.objects.get(product_id=product_id)
        except ProductStock.DoesNotExist:
            return Response({'error': 'Product stock not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quantity is not None:
            stock.quantity = int(quantity)
        if min_level is not None:
            stock.min_level = int(min_level)
        if max_level is not None:
            stock.max_level = int(max_level)
        stock.updated_by = request.user
        stock.save()

        from accounts.views import log_admin_action
        log_admin_action(
            request.user, 'STOCK_UPDATE', 'ProductStock', stock.id,
            f'Updated stock for {stock.product.name}: qty={stock.quantity}', request
        )
        return Response(ProductStockSerializer(stock).data)


class PriceManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        history = product.price_history.all()
        return Response(PriceHistorySerializer(history, many=True).data)

    def post(self, request, product_id):
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Deactivate all existing active prices
        PriceHistory.objects.filter(product=product, is_active=True).update(is_active=False)

        serializer = PriceHistorySerializer(data=request.data)
        if serializer.is_valid():
            price = serializer.save(product=product, created_by=request.user, is_active=True)
            from accounts.views import log_admin_action
            log_admin_action(
                request.user, 'PRICE_CHANGE', 'PriceHistory', price.id,
                f'Set price for {product.name}: ₹{price.selling_price} ({price.discount_percentage}% off)', request
            )
            return Response(PriceHistorySerializer(price).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        return Response(WishlistSerializer(wishlist).data)

    def post(self, request):
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        _, created = WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)
        if created:
            return Response({'message': 'Added to wishlist.'}, status=status.HTTP_201_CREATED)
        return Response({'message': 'Already in wishlist.'})

    def delete(self, request):
        product_id = request.data.get('product_id')
        try:
            wishlist = Wishlist.objects.get(user=request.user)
            WishlistItem.objects.filter(wishlist=wishlist, product_id=product_id).delete()
            return Response({'message': 'Removed from wishlist.'})
        except Wishlist.DoesNotExist:
            return Response({'error': 'Wishlist not found.'}, status=status.HTTP_404_NOT_FOUND)


class ProductReviewView(generics.ListCreateAPIView):
    serializer_class = ProductReviewSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return ProductReview.objects.filter(product_id=self.kwargs['product_id'])

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, product_id=self.kwargs['product_id'])
