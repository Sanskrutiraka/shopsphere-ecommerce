from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from .models import Cart, CartItem, Order, OrderItem, OrderStatusHistory
from .serializers import (
    CartSerializer, CartItemSerializer, OrderListSerializer,
    OrderDetailSerializer, PlaceOrderSerializer, UpdateOrderStatusSerializer
)
from accounts.permissions import IsAdminUser


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart, context={'request': request}).data)

    def post(self, request):
        """Add item or update quantity in cart"""
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        from products.models import Product, ProductStock
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            stock = product.stock
            if stock.quantity < quantity:
                return Response({'error': f'Only {stock.quantity} units available.'}, status=status.HTTP_400_BAD_REQUEST)
        except ProductStock.DoesNotExist:
            return Response({'error': 'Product stock info not available.'}, status=status.HTTP_400_BAD_REQUEST)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity += quantity
        else:
            item.quantity = quantity
        item.save()
        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def put(self, request):
        """Update specific item quantity"""
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item_id = request.data.get('item_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            item = CartItem.objects.get(pk=item_id, cart=cart)
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        if quantity <= 0:
            item.delete()
            return Response(CartSerializer(cart, context={'request': request}).data)

        item.quantity = quantity
        item.save()
        return Response(CartSerializer(cart, context={'request': request}).data)

    def delete(self, request):
        """Remove specific item from cart or clear entire cart"""
        cart, _ = Cart.objects.get_or_create(user=request.user)
        item_id = request.data.get('item_id')
        product_id = request.data.get('product_id')
        clear_all = request.data.get('clear_all', False)

        if clear_all:
            cart.items.all().delete()
            return Response(CartSerializer(cart, context={'request': request}).data)

        if item_id:
            try:
                CartItem.objects.get(pk=item_id, cart=cart).delete()
            except CartItem.DoesNotExist:
                pass
        elif product_id:
            try:
                CartItem.objects.get(product_id=product_id, cart=cart).delete()
            except CartItem.DoesNotExist:
                pass

        return Response(CartSerializer(cart, context={'request': request}).data)


class PlaceOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        if not cart.items.exists():
            return Response({'error': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        subtotal = sum(item.subtotal for item in cart.items.all())
        shipping_charge = 0 if subtotal >= 500 else 50
        total_amount = subtotal + shipping_charge

        order = Order.objects.create(
            user=request.user,
            payment_method=data['payment_method'],
            shipping_name=data['shipping_name'],
            shipping_phone=data['shipping_phone'],
            shipping_address=data['shipping_address'],
            shipping_city=data['shipping_city'],
            shipping_state=data['shipping_state'],
            shipping_pincode=data['shipping_pincode'],
            notes=data.get('notes', ''),
            subtotal=subtotal,
            shipping_charge=shipping_charge,
            total_amount=total_amount,
        )

        # Create order items + reduce stock
        for cart_item in cart.items.all():
            price_obj = cart_item.product.current_price
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                product_sku=cart_item.product.sku,
                quantity=cart_item.quantity,
                unit_price=price_obj.base_price if price_obj else 0,
                discount_percentage=price_obj.discount_percentage if price_obj else 0,
                subtotal=cart_item.subtotal,
            )
            # Reduce stock
            stock = cart_item.product.stock
            stock.quantity = max(0, stock.quantity - cart_item.quantity)
            stock.save()

        # Create initial status history
        OrderStatusHistory.objects.create(
            order=order, status='PLACED', changed_by=request.user, note='Order placed by customer.'
        )

        # Create payment record
        from payments.models import Payment
        payment = Payment.objects.create(
            order=order,
            user=request.user,
            method=data['payment_method'],
            amount=total_amount,
            status='PENDING',
        )

        # Clear cart
        cart.items.all().delete()

        return Response({
            'message': 'Order placed successfully!',
            'order': OrderDetailSerializer(order).data,
            'payment': {
                'id': payment.id,
                'status': payment.status,
                'method': payment.method,
                'amount': float(payment.amount),
                'transaction_id': payment.transaction_id,
            },
            'requires_payment_gateway': data['payment_method'] in ['CARD', 'UPI', 'NETBANKING']
        }, status=status.HTTP_201_CREATED)


class CustomerOrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-placed_at')


class CustomerOrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


# ── Admin Order Views ──────────────────────────────────────────────────────

class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Order.objects.select_related('user').order_by('-placed_at')
        status_filter = self.request.query_params.get('status')
        date_from = self.request.query_params.get('from')
        date_to = self.request.query_params.get('to')
        search = self.request.query_params.get('search')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if date_from:
            qs = qs.filter(placed_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(placed_at__date__lte=date_to)
        if search:
            qs = qs.filter(order_number__icontains=search) | qs.filter(user__email__icontains=search)
        return qs


class AdminOrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAdminUser]


class AdminUpdateOrderStatusView(APIView):
    permission_classes = [IsAdminUser]

    VALID_TRANSITIONS = {
        'PLACED': ['ACCEPTED', 'REJECTED'],
        'ACCEPTED': ['PROCESSED'],
        'PROCESSED': ['DISPATCHED'],
        'DISPATCHED': ['DELIVERED'],
        'REJECTED': [],
        'DELIVERED': [],
    }

    def post(self, request, pk):
        serializer = UpdateOrderStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = serializer.validated_data['status']
        allowed = self.VALID_TRANSITIONS.get(order.status, [])

        if new_status not in allowed:
            return Response(
                {'error': f'Cannot transition from {order.status} to {new_status}. Allowed: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        if new_status == 'REJECTED':
            order.rejection_reason = serializer.validated_data.get('rejection_reason', '')
        if new_status == 'DISPATCHED':
            order.tracking_number = serializer.validated_data.get('tracking_number', '')
        if new_status == 'DELIVERED':
            order.delivered_at = timezone.now()
        order.managed_by = request.user
        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            status=new_status,
            changed_by=request.user,
            note=serializer.validated_data.get('note', '')
        )

        from accounts.views import log_admin_action
        log_admin_action(
            request.user, 'ORDER_STATUS', 'Order', order.id,
            f'Order #{order.order_number} status changed to {new_status}', request
        )

        return Response({
            'message': f'Order status updated to {new_status}.',
            'order': OrderDetailSerializer(order).data
        })
