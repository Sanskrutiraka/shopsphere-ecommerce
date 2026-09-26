from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_number', 'user', 'user_email',
            'transaction_id', 'method', 'amount', 'status',
            'gateway_response', 'paid_at', 'created_at'
        ]
        read_only_fields = ['transaction_id', 'created_at', 'user']
