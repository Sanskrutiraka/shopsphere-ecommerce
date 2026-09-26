from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to ADMIN or SUPERADMIN users."""
    message = 'Admin access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role in ['ADMIN', 'SUPERADMIN']
        )


class IsSuperAdmin(BasePermission):
    """Allow access only to SUPERADMIN users."""
    message = 'Super Admin access required.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'SUPERADMIN'
        )


class IsCustomer(BasePermission):
    """Allow access only to CUSTOMER users."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'CUSTOMER'
        )


class IsOwnerOrAdmin(BasePermission):
    """Allow access to the owner of an object or admins."""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['ADMIN', 'SUPERADMIN']:
            return True
        return obj.user == request.user
