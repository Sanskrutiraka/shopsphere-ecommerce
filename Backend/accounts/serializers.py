from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import UserAddress, EmailVerificationToken, AdminLog

User = get_user_model()


class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = '__all__'
        read_only_fields = ['user']


class UserSerializer(serializers.ModelSerializer):
    addresses = UserAddressSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'status', 'phone', 'avatar', 'avatar_url',
            'is_verified', 'is_approved', 'date_joined', 'addresses'
        ]
        read_only_fields = ['id', 'role', 'status', 'is_verified', 'is_approved', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_avatar_url(self, obj):
        if obj.avatar:
            return str(obj.avatar.url) if hasattr(obj.avatar, 'url') else str(obj.avatar)
        return None


class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'role', 'status', 'phone', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'password', 'confirm_password']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            role='CUSTOMER',
            status='PENDING',
            is_verified=False,
            is_approved=False,
            is_active=True,
        )
        # Generate OTP
        otp = EmailVerificationToken.generate_otp()
        expires_at = timezone.now() + timedelta(minutes=10)
        EmailVerificationToken.objects.update_or_create(
            user=user,
            defaults={'otp': otp, 'expires_at': expires_at}
        )
        return user, otp


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'role', 'password']

    def create(self, validated_data):
        request = self.context.get('request')
        creator_role = request.user.role if request and request.user.is_authenticated else 'CUSTOMER'
        requested_role = validated_data.get('role', 'CUSTOMER')
        if creator_role != 'SUPERADMIN':
            requested_role = 'CUSTOMER'
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            role=requested_role,
            status='ACTIVE',
            is_verified=True,
            is_approved=True,
            is_active=True,
            created_by=request.user if request else None,
        )
        return user


class AdminLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()
    admin_email = serializers.SerializerMethodField()

    class Meta:
        model = AdminLog
        fields = '__all__'

    def get_admin_name(self, obj):
        return obj.admin.get_full_name() if obj.admin else 'System'

    def get_admin_email(self, obj):
        return obj.admin.email if obj.admin else 'system@local'
