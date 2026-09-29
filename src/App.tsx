import React, { useState } from 'react';
import { BankProvider, useBank } from './context/BankContext';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { AccountsManagement } from './components/AccountsManagement';
import { AccountDetailDrawer } from './components/AccountDetailDrawer';
import { TransactionsLedger } from './components/TransactionsLedger';
import { LoanManagement } from './components/LoanManagement';
import { RiskComplianceHub } from './components/RiskComplianceHub';
import { CardsManagement } from './components/CardsManagement';
import { BranchVaultFx } from './components/BranchVaultFx';
import { CustomerPortalView } from './components/CustomerPortalView';
import { DjangoArchitectureViewer } from './components/DjangoArchitectureViewer';

// Modals
import { TransferModal } from './components/modals/TransferModal';
import { NewAccountModal } from './components/modals/NewAccountModal';
import { DepositWithdrawModal } from './components/modals/DepositWithdrawModal';
import { TransactionReceiptModal } from './components/modals/TransactionReceiptModal';
import { NewCardModal } from './components/modals/NewCardModal';
import { BankAccount, Transaction } from './types/bank';

function BankPortalContent() {
  const { currentRole, setCurrentRole, accounts } = useBank();
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDefaultSource, setTransferDefaultSource] = useState<BankAccount | null>(null);

  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);

  const [depositModalAccount, setDepositModalAccount] = useState<BankAccount | null>(null);

  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);

  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [newCardDefaultAccountId, setNewCardDefaultAccountId] = useState<string | undefined>(undefined);

  const [drawerAccount, setDrawerAccount] = useState<BankAccount | null>(null);

  // Quick action openers
  const handleOpenTransfer = (source?: BankAccount | null) => {
    setTransferDefaultSource(source || null);
    setIsTransferModalOpen(true);
  };

  const handleOpenDeposit = (acc: BankAccount) => {
    setDepositModalAccount(acc);
  };

  const handleOpenNewCard = (accId?: string) => {
    setNewCardDefaultAccountId(accId);
    setIsNewCardModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Header Contract */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenTransferModal={() => handleOpenTransfer(null)}
        onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentRole === 'client' || currentTab === 'client_portal' ? (
          <CustomerPortalView
            onOpenTransferModal={() => handleOpenTransfer(null)}
            onOpenDepositModal={() => {
              const defaultAcc = accounts[0];
              if (defaultAcc) setDepositModalAccount(defaultAcc);
            }}
            onSelectTransaction={(tx) => setActiveReceiptTransaction(tx)}
            onSwitchToManager={() => {
              setCurrentRole('director');
              setCurrentTab('overview');
            }}
          />
        ) : (
          <>
            {currentTab === 'overview' && (
              <DashboardOverview
                onSelectTab={setCurrentTab}
                onOpenTransferModal={() => handleOpenTransfer(null)}
                onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)}
                onSelectTransaction={(tx) => setActiveReceiptTransaction(tx)}
              />
            )}

            {currentTab === 'accounts' && (
              <AccountsManagement
                onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)}
                onOpenDepositModal={handleOpenDeposit}
                onOpenTransferWithSource={(acc) => handleOpenTransfer(acc)}
                onSelectAccount={(acc) => setDrawerAccount(acc)}
              />
            )}

            {currentTab === 'transactions' && (
              <TransactionsLedger
                onOpenTransferModal={() => handleOpenTransfer(null)}
                onSelectTransaction={(tx) => setActiveReceiptTransaction(tx)}
              />
            )}

            {currentTab === 'loans' && <LoanManagement />}

            {currentTab === 'compliance' && <RiskComplianceHub />}

            {currentTab === 'cards' && (
              <CardsManagement onOpenNewCardModal={() => handleOpenNewCard()} />
            )}

            {currentTab === 'vault' && <BranchVaultFx />}

            {currentTab === 'django' && <DjangoArchitectureViewer />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Aegis Horizon Bank NA</span>
            <span aria-hidden="true">·</span>
            <span>Member Federal Reserve System</span>
            <span aria-hidden="true">·</span>
            <span>FDIC Insured #33812</span>
          </div>
          <div>
            <span>Routing ABA: 021000089 · SWIFT: AEGSHZUS33 · Equal Housing Lender</span>
          </div>
        </div>
      </footer>

      {/* Account Detail Drawer */}
      {drawerAccount && (
        <AccountDetailDrawer
          account={drawerAccount}
          onClose={() => setDrawerAccount(null)}
          onOpenDeposit={() => {
            handleOpenDeposit(drawerAccount);
          }}
          onOpenTransfer={() => {
            handleOpenTransfer(drawerAccount);
          }}
          onOpenNewCard={() => {
            handleOpenNewCard(drawerAccount.id);
          }}
          onSelectTransaction={(tx) => {
            setActiveReceiptTransaction(tx);
          }}
        />
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <TransferModal
          defaultSourceAccount={transferDefaultSource}
          onClose={() => {
            setIsTransferModalOpen(false);
            setTransferDefaultSource(null);
          }}
        />
      )}

      {/* New Account Modal */}
      {isNewAccountModalOpen && (
        <NewAccountModal
          onClose={() => setIsNewAccountModalOpen(false)}
          onSuccessCreated={(accId) => {
            const created = accounts.find(a => a.id === accId);
            if (created) setDrawerAccount(created);
          }}
        />
      )}

      {/* Deposit & Withdrawal Modal */}
      {depositModalAccount && (
        <DepositWithdrawModal
          account={depositModalAccount}
          defaultMode="deposit"
          onClose={() => setDepositModalAccount(null)}
        />
      )}

      {/* Transaction Clearance Receipt Voucher Modal */}
      {activeReceiptTransaction && (
        <TransactionReceiptModal
          transaction={activeReceiptTransaction}
          onClose={() => setActiveReceiptTransaction(null)}
        />
      )}

      {/* New Card Issuance Modal */}
      {isNewCardModalOpen && (
        <NewCardModal
          defaultAccountId={newCardDefaultAccountId}
          onClose={() => setIsNewCardModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BankProvider>
      <BankPortalContent />
    </BankProvider>
  );
}
