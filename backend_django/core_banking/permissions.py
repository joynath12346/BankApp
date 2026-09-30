from rest_framework.permissions import BasePermission, SAFE_METHODS


def user_role(user):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return 'administrator'
    profile = getattr(user, 'bank_profile', None)
    return profile.role if profile else None


class RolePermission(BasePermission):
    """Endpoint-level role policy; object ownership is enforced by querysets."""

    role_actions = {}

    def has_permission(self, request, view):
        role = user_role(request.user)
        if role == 'administrator':
            return True
        allowed = self.role_actions.get(role, set())
        action = getattr(view, 'action', request.method.lower())
        return action in allowed or (request.method in SAFE_METHODS and 'read' in allowed)


class AccountPermission(RolePermission):
    role_actions = {
        'bank_manager': {'read', 'list', 'retrieve', 'create', 'update', 'partial_update', 'toggle_freeze'},
        'teller': {'read', 'list', 'retrieve', 'create', 'deposit', 'withdraw'},
        'compliance_officer': {'read', 'list', 'retrieve', 'toggle_freeze'},
        'customer': {'read', 'list', 'retrieve'},
    }


class TransactionPermission(RolePermission):
    role_actions = {role: {'read', 'list', 'retrieve'} for role in ('bank_manager', 'teller', 'compliance_officer', 'customer')}


class TransferPermission(RolePermission):
    role_actions = {'bank_manager': {'post'}, 'teller': {'post'}, 'customer': {'post'}}


class LoanPermission(RolePermission):
    role_actions = {
        'bank_manager': {'read', 'list', 'retrieve', 'create', 'update', 'partial_update', 'approve', 'disburse'},
        'teller': {'read', 'list', 'retrieve', 'create'},
        'customer': {'read', 'list', 'retrieve', 'create'},
    }


class CardPermission(RolePermission):
    role_actions = {
        'bank_manager': {'read', 'list', 'retrieve', 'create', 'update', 'partial_update', 'toggle_lock'},
        'teller': {'read', 'list', 'retrieve', 'create'},
        'customer': {'read', 'list', 'retrieve', 'toggle_lock'},
    }


class CompliancePermission(RolePermission):
    role_actions = {'bank_manager': {'read', 'list', 'retrieve'}, 'compliance_officer': {'read', 'list', 'retrieve', 'resolve', 'create', 'update', 'partial_update'}}


class VaultPermission(RolePermission):
    role_actions = {'bank_manager': {'get', 'post'}, 'teller': {'get'}, 'compliance_officer': {'get'}}


class ReadAuthenticatedPermission(RolePermission):
    role_actions = {role: {'read', 'list', 'retrieve'} for role in ('bank_manager', 'teller', 'compliance_officer', 'customer')}


class AuditPermission(RolePermission):
    role_actions = {'bank_manager': {'read', 'list', 'retrieve'}, 'compliance_officer': {'read', 'list', 'retrieve'}}
