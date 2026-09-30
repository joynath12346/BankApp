from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BankAccountViewSet,
    TransactionViewSet,
    TransferExecutionAPIView,
    LoanApplicationViewSet,
    BankCardViewSet,
    AMLAlertViewSet,
    BranchVaultAPIView,
    ExchangeRateViewSet
    ,AuditLogViewSet
)
from .auth_views import LoginAPIView, RegisterAPIView, LogoutAPIView, SessionAPIView

router = DefaultRouter()
router.register(r'accounts', BankAccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'loans', LoanApplicationViewSet, basename='loan')
router.register(r'cards', BankCardViewSet, basename='card')
router.register(r'aml-alerts', AMLAlertViewSet, basename='aml-alert')
router.register(r'exchange-rates', ExchangeRateViewSet, basename='exchange-rate')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
    path('transfers/execute/', TransferExecutionAPIView.as_view(), name='transfer-execute'),
    path('vault/', BranchVaultAPIView.as_view(), name='branch-vault'),
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/register/', RegisterAPIView.as_view(), name='register'),
    path('auth/logout/', LogoutAPIView.as_view(), name='logout'),
    path('auth/session/', SessionAPIView.as_view(), name='session'),
]
