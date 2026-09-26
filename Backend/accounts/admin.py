from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserAddress, EmailVerificationToken, AdminLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'status', 'is_verified', 'date_joined']
    list_filter = ['role', 'status', 'is_verified', 'is_approved']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone', 'avatar')}),
        ('Permissions', {'fields': ('role', 'status', 'is_verified', 'is_approved', 'is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('date_joined', 'last_login')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role')}),
    )


admin.site.register(UserAddress)
admin.site.register(EmailVerificationToken)
admin.site.register(AdminLog)
