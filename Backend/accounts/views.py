from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
import logging

from .models import UserAddress, EmailVerificationToken, AdminLog
from .serializers import (
    UserSerializer, UserMiniSerializer, RegisterSerializer, VerifyOTPSerializer,
    LoginSerializer, ChangePasswordSerializer, AdminCreateUserSerializer,
    UserAddressSerializer, AdminLogSerializer
)
from .permissions import IsAdminUser, IsSuperAdmin

User = get_user_model()
logger = logging.getLogger(__name__)


def _send_otp_email(*, recipient, subject, message):
    sender = settings.EMAIL_HOST_USER or settings.DEFAULT_FROM_EMAIL
    send_mail(
        subject=subject,
        message=message,
        from_email=sender,
        recipient_list=[recipient],
        fail_silently=False,
    )


def log_admin_action(admin, action, model_name, object_id, description, request=None):
    ip = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
    AdminLog.objects.create(
        admin=admin, action=action, model_name=model_name,
        object_id=object_id, description=description, ip_address=ip
    )


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user, otp = serializer.save()
            try:
                _send_otp_email(
                    recipient=user.email,
                    subject='ShopSphere – Verify Your Email',
                    message=f'Hi {user.first_name},\n\nYour OTP is: {otp}\n\nIt expires in 10 minutes.',
                )
            except Exception as exc:
                logger.exception('Failed to send verification email to %s', user.email)
                return Response({
                    'error': 'Registration succeeded, but verification email could not be sent.',
                    'details': str(exc),
                }, status=status.HTTP_502_BAD_GATEWAY)
            return Response({
                'message': 'Registration successful. Please verify your email with the OTP sent.',
                'email': user.email
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        try:
            user = User.objects.get(email=email)
            token = EmailVerificationToken.objects.get(user=user)
        except (User.DoesNotExist, EmailVerificationToken.DoesNotExist):
            return Response({'error': 'Invalid email or OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if token.is_expired():
            return Response({'error': 'OTP has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        if token.otp != otp:
            return Response({'error': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_verified = True
        user.is_approved = True
        user.status = 'ACTIVE'
        user.save()
        token.delete()

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Email verified successfully.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email, is_verified=False)
        except User.DoesNotExist:
            return Response({'error': 'User not found or already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        otp = EmailVerificationToken.generate_otp()
        expires_at = timezone.now() + timedelta(minutes=10)
        EmailVerificationToken.objects.update_or_create(
            user=user, defaults={'otp': otp, 'expires_at': expires_at}
        )
        try:
            _send_otp_email(
                recipient=user.email,
                subject='ShopSphere – New OTP',
                message=f'Your new OTP is: {otp}\n\nIt expires in 10 minutes.',
            )
        except Exception as exc:
            logger.exception('Failed to resend verification email to %s', user.email)
            return Response({
                'error': 'OTP was regenerated, but email delivery failed.',
                'details': str(exc),
            }, status=status.HTTP_502_BAD_GATEWAY)
        return Response({'message': 'New OTP sent to your email.'})


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_verified:
            return Response({'error': 'Please verify your email first.', 'needs_verification': True},
                            status=status.HTTP_403_FORBIDDEN)

        if user.status == 'BLOCKED':
            return Response({'error': 'Your account has been blocked. Contact support.'},
                            status=status.HTTP_403_FORBIDDEN)

        if user.status == 'PENDING':
            return Response({'error': 'Your account is pending approval.'},
                            status=status.HTTP_403_FORBIDDEN)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'})


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = UserSerializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            # Only allow updating safe fields
            allowed = ['first_name', 'last_name', 'phone', 'avatar']
            for key in list(request.data.keys()):
                if key not in allowed:
                    serializer.validated_data.pop(key, None)
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Old password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully.'})


class UserAddressListCreateView(generics.ListCreateAPIView):
    serializer_class = UserAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if serializer.validated_data.get('is_default'):
            UserAddress.objects.filter(user=self.request.user).update(is_default=False)
        serializer.save(user=self.request.user)


class UserAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserAddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)


# ── Admin User Management ──────────────────────────────────────────────────

class AdminUserListView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminCreateUserSerializer
        return UserMiniSerializer

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        if self.request.user.role == 'ADMIN':
            qs = qs.filter(role='CUSTOMER')
        role = self.request.query_params.get('role')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')
        if role:
            qs = qs.filter(role=role)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(email__icontains=search) | qs.filter(first_name__icontains=search)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        if self.request.user.role == 'ADMIN':
            serializer.validated_data['role'] = 'CUSTOMER'
        user = serializer.save()
        log_admin_action(
            self.request.user, 'CREATE', 'User', user.id,
            f'Created user {user.email} with role {user.role}', self.request
        )


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserMiniSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'ADMIN':
            qs = qs.filter(role='CUSTOMER')
        return qs


class AdminUserActionView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        action = request.data.get('action')
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.id == user.id:
            return Response({'error': 'You cannot perform admin actions on your own account.'}, status=status.HTTP_403_FORBIDDEN)

        if request.user.role == 'ADMIN' and user.role != 'CUSTOMER':
            return Response({'error': 'Admins can only manage customer accounts.'}, status=status.HTTP_403_FORBIDDEN)

        if action == 'block':
            user.status = 'BLOCKED'
            user.save()
            log_admin_action(request.user, 'BLOCK', 'User', user.id, f'Blocked user {user.email}', request)
            return Response({'message': f'{user.email} has been blocked.'})

        elif action == 'unblock':
            user.status = 'ACTIVE'
            user.save()
            log_admin_action(request.user, 'UNBLOCK', 'User', user.id, f'Unblocked user {user.email}', request)
            return Response({'message': f'{user.email} has been unblocked.'})

        elif action == 'approve':
            user.status = 'ACTIVE'
            user.is_approved = True
            user.is_verified = True
            user.save()
            log_admin_action(request.user, 'APPROVE', 'User', user.id, f'Approved user {user.email}', request)
            return Response({'message': f'{user.email} has been approved.'})

        elif action == 'make_admin':
            if request.user.role != 'SUPERADMIN':
                return Response({'error': 'Only super admins can create admin accounts.'}, status=status.HTTP_403_FORBIDDEN)
            user.role = 'ADMIN'
            user.status = 'ACTIVE'
            user.is_verified = True
            user.is_approved = True
            user.save()
            log_admin_action(request.user, 'UPDATE', 'User', user.id, f'Promoted user {user.email} to admin', request)
            return Response({'message': f'{user.email} has been promoted to admin.'})

        return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)


class AdminLogListView(generics.ListAPIView):
    serializer_class = AdminLogSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = AdminLog.objects.select_related('admin').order_by('-timestamp')
        admin_id = self.request.query_params.get('admin')
        action = self.request.query_params.get('action')
        if admin_id:
            qs = qs.filter(admin_id=admin_id)
        if action:
            qs = qs.filter(action=action)
        return qs


class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from datetime import timedelta
        from django.db.models import Count, F, Sum
        from django.db.models.functions import Coalesce, TruncDate
        from django.utils import timezone
        from orders.models import Order
        from payments.models import Payment
        from products.models import Product, ProductStock
        from .models import AdminLog
        from .serializers import AdminLogSerializer

        period = request.query_params.get('period', 'week').lower()
        days = 30 if period == 'month' else 7
        today = timezone.localdate()
        start_date = today - timedelta(days=days - 1)

        # Total Revenue (sum of all successful payments)
        total_revenue = Payment.objects.filter(status='SUCCESS').aggregate(total=Sum('amount'))['total'] or 0
        total_orders = Order.objects.count()
        total_products = Product.objects.count()
        total_customers = User.objects.filter(role='CUSTOMER').count()
        total_admins = User.objects.filter(role__in=['ADMIN', 'SUPERADMIN']).count()
        total_users = total_customers + total_admins

        today_payments_qs = (
            Payment.objects
            .filter(status='SUCCESS')
            .annotate(day=TruncDate(Coalesce('paid_at', 'created_at')))
            .filter(day=today)
        )
        today_collections = today_payments_qs.aggregate(total=Sum('amount'))['total'] or 0

        today_orders_qs = Order.objects.filter(placed_at__date=today)
        today_order_counts = {status: 0 for status, _ in Order.STATUS_CHOICES}
        for row in today_orders_qs.values('status').annotate(count=Count('id')):
            today_order_counts[row['status']] = row['count']

        today_order_statuses = [
            {
                'status': status,
                'label': label,
                'count': today_order_counts.get(status, 0),
            }
            for status, label in Order.STATUS_CHOICES
        ]

        trending_products_qs = (
            Order.objects
            .filter(placed_at__date=today)
            .values('items__product_id', 'items__product_name', 'items__product_sku')
            .annotate(
                units_sold=Sum('items__quantity'),
                revenue=Sum('items__subtotal'),
            )
            .order_by('-units_sold', '-revenue', 'items__product_name')[:5]
        )
        trending_products = []
        for row in trending_products_qs:
            trending_products.append({
                'product_id': row['items__product_id'],
                'product_name': row['items__product_name'] or '-',
                'product_sku': row['items__product_sku'] or '-',
                'units_sold': int(row['units_sold'] or 0),
                'revenue': float(row['revenue'] or 0),
            })

        low_stock_qs = (
            ProductStock.objects
            .select_related('product')
            .filter(quantity__lte=F('min_level'))
            .order_by('quantity', 'product__name')[:10]
        )
        low_stock_products = []
        for stock in low_stock_qs:
            low_stock_products.append({
                'product_id': stock.product_id,
                'product_name': stock.product.name,
                'sku': stock.product.sku,
                'quantity': stock.quantity,
                'min_level': stock.min_level,
                'is_out_of_stock': stock.is_out_of_stock,
            })

        top_customer_qs = (
            Order.objects
            .filter(placed_at__date=today)
            .values('user_id', 'user__email', 'user__first_name', 'user__last_name')
            .annotate(
                total_spent=Sum('total_amount'),
                orders_count=Count('id'),
            )
            .order_by('-total_spent', '-orders_count')
        )
        top_customer_today = None
        if top_customer_qs:
            row = top_customer_qs[0]
            full_name = ' '.join(filter(None, [row['user__first_name'], row['user__last_name']]))
            top_customer_today = {
                'user_id': row['user_id'],
                'name': full_name or row['user__email'],
                'email': row['user__email'],
                'orders_count': row['orders_count'],
                'total_spent': float(row['total_spent'] or 0),
            }

        revenue_qs = (
            Payment.objects
            .filter(status='SUCCESS')
            .annotate(day=TruncDate(Coalesce('paid_at', 'created_at')))
            .filter(day__gte=start_date, day__lte=today)
            .values('day')
            .annotate(total=Sum('amount'))
            .order_by('day')
        )
        revenue_by_day = {row['day']: float(row['total'] or 0) for row in revenue_qs}

        revenue_series = []
        for offset in range(days):
            day = start_date + timedelta(days=offset)
            revenue_series.append({
                'date': day.isoformat(),
                'label': day.strftime('%b %d'),
                'revenue': revenue_by_day.get(day, 0.0),
            })
        
        recent_logs = AdminLog.objects.select_related('admin').order_by('-timestamp')[:5]
        logs_data = AdminLogSerializer(recent_logs, many=True).data
        
        # Modify the log data slightly to match what frontend expects
        formatted_logs = []
        for log in logs_data:
            formatted_logs.append({
                'id': log['id'],
                'admin_email': log.get('admin_email', 'system@local'),
                'action_type': log.get('action', 'UNKNOWN'),
                'model_name': log.get('model_name'),
                'timestamp': log.get('timestamp')
            })

        return Response({
            'total_revenue': float(total_revenue),
            'today_collections': float(today_collections),
            'total_orders': total_orders,
            'today_orders_count': today_orders_qs.count(),
            'today_order_statuses': today_order_statuses,
            'total_products': total_products,
            'total_users': total_users,
            'total_customers': total_customers,
            'low_stock_products': low_stock_products,
            'low_stock_count': len(low_stock_products),
            'trending_products': trending_products,
            'top_customer_today': top_customer_today,
            'recent_logs': formatted_logs,
            'revenue_period': period if period in ['week', 'month'] else 'week',
            'revenue_series': revenue_series,
        })
