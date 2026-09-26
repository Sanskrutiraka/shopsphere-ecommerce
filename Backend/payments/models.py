from django.db import models


class Payment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]
    METHOD_CHOICES = [
        ('COD', 'Cash on Delivery'),
        ('CARD', 'Credit/Debit Card'),
        ('UPI', 'UPI'),
        ('NETBANKING', 'Net Banking'),
    ]

    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='payment_record')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='payments')
    transaction_id = models.CharField(max_length=200, unique=True, blank=True)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    gateway_response = models.JSONField(default=dict, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment for Order #{self.order.order_number} - {self.status}"

    def save(self, *args, **kwargs):
        if not self.transaction_id:
            import uuid
            self.transaction_id = f"TXN-{uuid.uuid4().hex[:16].upper()}"
        super().save(*args, **kwargs)
