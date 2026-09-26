import hashlib
import hmac
from decimal import Decimal

import razorpay
from django.conf import settings
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Payment
from .serializers import PaymentSerializer
from accounts.permissions import IsAdminUser


def _get_razorpay_client():
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', '')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))


class AdminPaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Payment.objects.select_related('order', 'user').order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        date_from = self.request.query_params.get('from')
        date_to = self.request.query_params.get('to')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        return qs


class CustomerPaymentListView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')


class SimulatePaymentView(APIView):
    """Simulate payment success/failure for demo purposes"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            payment = Payment.objects.get(pk=pk, user=request.user)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=404)

        action = request.data.get('action', 'success')
        from django.utils import timezone

        if action == 'success':
            payment.status = 'SUCCESS'
            payment.paid_at = timezone.now()
            payment.gateway_response = {'simulated': True, 'result': 'success'}
            payment.save()
            payment.order.payment_status = 'PAID'
            payment.order.save()
            return Response({'message': 'Payment marked as successful.'})
        else:
            payment.status = 'FAILED'
            payment.gateway_response = {'simulated': True, 'result': 'failed'}
            payment.save()
            payment.order.payment_status = 'FAILED'
            payment.order.save()
            return Response({'message': 'Payment marked as failed.'})


class RazorpayCreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get('payment_id')
        if not payment_id:
            return Response({'error': 'payment_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.select_related('order').get(pk=payment_id, user=request.user)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        if payment.method == 'COD':
            return Response({'error': 'Razorpay is only used for online payments.'}, status=status.HTTP_400_BAD_REQUEST)

        client = _get_razorpay_client()
        if not client:
            return Response({'error': 'Razorpay is not configured.'}, status=status.HTTP_400_BAD_REQUEST)

        amount_paise = int(Decimal(payment.amount) * 100)
        if amount_paise <= 0:
            return Response({'error': 'Invalid payment amount.'}, status=status.HTTP_400_BAD_REQUEST)

        razorpay_order = client.order.create({
            'amount': amount_paise,
            'currency': 'INR',
            'receipt': payment.transaction_id,
            'payment_capture': 1,
            'notes': {
                'payment_id': str(payment.id),
                'order_id': str(payment.order.id),
                'order_number': payment.order.order_number,
            },
        })

        gateway_response = payment.gateway_response or {}
        gateway_response['razorpay_order'] = razorpay_order
        payment.gateway_response = gateway_response
        payment.save(update_fields=['gateway_response', 'updated_at'])

        return Response({
            'key_id': settings.RAZORPAY_KEY_ID,
            'order_id': razorpay_order['id'],
            'amount': amount_paise,
            'currency': 'INR',
            'payment_id': payment.id,
            'order_number': payment.order.order_number,
            'receipt': payment.transaction_id,
            'name': 'ShopSphere',
            'description': f'Payment for Order #{payment.order.order_number}',
        })


class RazorpayVerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get('payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')

        if not all([payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature]):
            return Response({'error': 'Missing payment verification fields.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payment = Payment.objects.select_related('order').get(pk=payment_id, user=request.user)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found.'}, status=status.HTTP_404_NOT_FOUND)

        client_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
        if not client_secret:
            return Response({'error': 'Razorpay is not configured.'}, status=status.HTTP_400_BAD_REQUEST)

        payload = f'{razorpay_order_id}|{razorpay_payment_id}'
        expected_signature = hmac.new(
            client_secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, razorpay_signature):
            return Response({'error': 'Payment signature verification failed.'}, status=status.HTTP_400_BAD_REQUEST)

        payment.status = 'SUCCESS'
        payment.paid_at = timezone.now()
        gateway_response = payment.gateway_response or {}
        gateway_response.update({
            'verified': True,
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature,
        })
        payment.gateway_response = gateway_response
        payment.save(update_fields=['status', 'paid_at', 'gateway_response', 'updated_at'])

        payment.order.payment_status = 'PAID'
        payment.order.save(update_fields=['payment_status', 'updated_at'])

        return Response({
            'message': 'Payment verified successfully.',
            'payment': PaymentSerializer(payment).data,
        })
