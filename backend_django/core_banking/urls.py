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
)

router = DefaultRouter()
router.register(r'accounts', BankAccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'loans', LoanApplicationViewSet, basename='loan')
router.register(r'cards', BankCardViewSet, basename='card')
router.register(r'aml-alerts', AMLAlertViewSet, basename='aml-alert')
router.register(r'exchange-rates', ExchangeRateViewSet, basename='exchange-rate')

urlpatterns = [
    path('', include(router.urls)),
    path('transfers/execute/', TransferExecutionAPIView.as_view(), name='transfer-execute'),
    path('vault/', BranchVaultAPIView.as_view(), name='branch-vault'),
]
