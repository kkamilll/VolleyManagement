'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSeasonArchive } from '@/lib/season-archive-context';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  CreditCard, 
  Plus, 
  CheckCircle, 
  Clock, 
  Receipt, 
  Smartphone, 
  Sparkles, 
  Trash2, 
  Crown,
  Printer,
  Coins,
  ShieldCheck,
  TrendingUp,
  Package,
  Layers,
  ArrowRight,
  Flame,
  X,
  Download,
  BellRing,
  Share2,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Check,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Fee, FeePayment, User, PaymentMethod, PaymentStatus, TreasuryExpense } from '@/lib/types';

function FeesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get('action');

  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [userPayments, setUserPayments] = useState<FeePayment[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [treasury, setTreasury] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Payment process state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BLIK');
  const [blikCode, setBlikCode] = useState('');
  const [customPayAmount, setCustomPayAmount] = useState<string>('');
  const [splitTarget, setSplitTarget] = useState<string>('FUNDUSZ_DRUZYNY');
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // New Fee form
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('120');
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10));
  const [newType, setNewType] = useState<'MIESIECZNA' | 'TURNIEJ' | 'SPRZET' | 'INNA'>('MIESIECZNA');
  const [newDescription, setNewDescription] = useState('');
  const [submittingFee, setSubmittingFee] = useState(false);

  // New Treasury Transaction (Expense / Income) form
  const [transactionType, setTransactionType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<string>('SPRZET');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseDesc, setExpenseDesc] = useState('');
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Reminder & Settlement management states
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderFeeId, setReminderFeeId] = useState<string>('ALL');
  const [customReminderText, setCustomReminderText] = useState('');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterFeeId, setFilterFeeId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchPlayer, setSearchPlayer] = useState('');

  // Transactions Filter & Pagination
  const [filterTransType, setFilterTransType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [filterTransCategory, setFilterTransCategory] = useState<string>('ALL');
  const [searchTransaction, setSearchTransaction] = useState<string>('');
  const [transPage, setTransPage] = useState<number>(1);
  const TRANS_PER_PAGE = 8;

  const activeFiltersCount = (filterFeeId !== 'ALL' ? 1 : 0) + (filterStatus !== 'ALL' ? 1 : 0) + (searchPlayer.trim() ? 1 : 0);

  const fetchFeesData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fees');
      if (res.ok) {
        const data = await res.json();
        setFees(data.fees || []);
        setPayments(data.payments || []);
        setUserPayments(data.userPayments || []);
        setSummary(data.summary);
        setTreasury(data.treasury);
      }
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setPlayers(uData.users.filter((u: User) => u.role === 'ZAWODNIK' || (u.role === 'KIEROWNIK' && Boolean(u.number))));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeesData();
    if (actionParam === 'new') {
      setShowCreateModal(true);
    }
  }, [actionParam, user]);

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFee(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          amount: Number(newAmount),
          dueDate: newDueDate,
          type: newType,
          description: newDescription
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Składka została przypisana!');
        setShowCreateModal(false);
        setNewTitle('');
        setNewDescription('');
        await fetchFeesData();
      } else {
        alert(data.error || 'Błąd');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingFee(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;
    setSubmittingExpense(true);
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_TRANSACTION',
          type: transactionType,
          title: expenseTitle,
          amount: Number(expenseAmount),
          category: expenseCategory,
          date: expenseDate,
          description: expenseDesc
        })
      });
      const data = await res.json();
      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseTitle('');
        setExpenseAmount('');
        setExpenseDesc('');
        setExpenseDate(new Date().toISOString().slice(0, 10));
        await fetchFeesData();
        alert(data.message || 'Transakcja została zapisana!');
      } else {
        alert(data.error || 'Błąd zapisu transakcji');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten wpis z tabeli wydatków i przychodów?')) return;
    try {
      const res = await fetch(`/api/fees?transactionId=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchFeesData();
      } else {
        const d = await res.json();
        alert(d.error || 'Błąd podczas usuwania wpisu');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateExpense = handleCreateTransaction;

  const handleOpenPaymentModal = (pay: FeePayment) => {
    setSelectedPayment(pay);
    setPaymentMethod('BLIK');
    setBlikCode('');
    setCustomPayAmount(String(pay.amount));
    setSplitTarget('FUNDUSZ_DRUZYNY');
    setPaymentSuccess(false);
    setPaymentModalOpen(true);
  };

  const executePayment = async () => {
    if (!selectedPayment) return;
    if (paymentMethod === 'BLIK' && blikCode.replace(/\s+/g, '').length !== 6) {
      alert('Podaj 6-cyfrowy kod BLIK');
      return;
    }

    const finalAmount = Number(customPayAmount) || selectedPayment.amount;

    setProcessing(true);
    try {
      await new Promise(r => setTimeout(r, 1000));

      const res = await fetch('/api/fees/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          method: paymentMethod,
          blikCode: blikCode.replace(/\s+/g, ''),
          customAmount: finalAmount,
          splitTarget: finalAmount > selectedPayment.amount ? splitTarget : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPaymentSuccess(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#38bdf8', '#fbbf24', '#ffffff']
        });
        await fetchFeesData();
      } else {
        alert(data.error || 'Błąd');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const openReceipt = (pay: FeePayment, fee?: Fee) => {
    const f = fee || fees.find(x => x.id === pay.feeId);
    setReceiptData({ payment: pay, fee: f });
    setReceiptModalOpen(true);
  };

  const { isArchiveMode } = useSeasonArchive();
  const isManager = !isArchiveMode && Boolean(user?.role === 'KIEROWNIK' || user?.isCaptain || user?.permissions?.canManageFees);
  const isPlayer = !isArchiveMode && Boolean(user?.role === 'ZAWODNIK' || (user?.role === 'KIEROWNIK' && user?.number));
  const canManageTreasury = !isArchiveMode && (isManager || user?.role === 'TRENER' || user?.isCaptain);

  const [feesTab, setFeesTab] = useState<'fees_table' | 'expenses_revenues' | 'my_fees'>('fees_table');

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (filterFeeId !== 'ALL' && p.feeId !== filterFeeId) return false;
      if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
      if (searchPlayer && !p.userName.toLowerCase().includes(searchPlayer.toLowerCase())) return false;
      return true;
    });
  }, [payments, filterFeeId, filterStatus, searchPlayer]);

  const [paymentsPage, setPaymentsPage] = useState(1);
  const PAYMENTS_PER_PAGE = 8;

  useEffect(() => {
    setPaymentsPage(1);
  }, [filterFeeId, filterStatus, searchPlayer]);

  const totalPaymentsPages = Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (paymentsPage - 1) * PAYMENTS_PER_PAGE;
    return filteredPayments.slice(start, start + PAYMENTS_PER_PAGE);
  }, [filteredPayments, paymentsPage]);

  // All transactions (Expenses and Incomes)
  const allTransactions: TreasuryExpense[] = useMemo(() => {
    return (treasury?.transactions || treasury?.expenses || []).map((t: any) => ({
      ...t,
      type: t.type || 'EXPENSE'
    }));
  }, [treasury]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      if (filterTransType !== 'ALL' && t.type !== filterTransType) return false;
      if (filterTransCategory !== 'ALL' && t.category !== filterTransCategory) return false;
      if (searchTransaction.trim()) {
        const query = searchTransaction.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = (t.description || '').toLowerCase().includes(query);
        const matchesCreator = (t.createdByName || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCreator) return false;
      }
      return true;
    });
  }, [allTransactions, filterTransType, filterTransCategory, searchTransaction]);

  useEffect(() => {
    setTransPage(1);
  }, [filterTransType, filterTransCategory, searchTransaction]);

  const totalTransPages = Math.ceil(filteredTransactions.length / TRANS_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (transPage - 1) * TRANS_PER_PAGE;
    return filteredTransactions.slice(start, start + TRANS_PER_PAGE);
  }, [filteredTransactions, transPage]);

  const unpaidUserPayments = useMemo(() => {
    return userPayments.filter(p => p.status !== 'OPLACONE');
  }, [userPayments]);

  const getCategoryBadge = (category: string, type: 'EXPENSE' | 'INCOME') => {
    switch (category) {
      case 'HALA':
        return { label: 'Hala sportowa', icon: '🏢', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'SEDZIOWIE':
        return { label: 'Sędziowie', icon: '⚖️', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'SPRZET':
        return { label: 'Sprzęt & Piłki', icon: '🏐', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'TURNIEJ':
        return { label: 'Wpisowe Turniej', icon: '🏆', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
      case 'WODA_ODZYWKI':
        return { label: 'Woda & Napoje', icon: '💧', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
      case 'SPONSOR':
        return { label: 'Sponsor', icon: '🤝', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'DAROWIZNA':
        return { label: 'Darowizna / Zbiórka', icon: '🎁', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' };
      case 'NAGRODA':
        return { label: 'Nagroda Pieniężna', icon: '🥇', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' };
      case 'SKLADKI':
        return { label: 'Wpływy ze Składek', icon: '💳', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'ZWROT':
        return { label: 'Zwrot / Refundacja', icon: '🔄', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
      default:
        return type === 'INCOME'
          ? { label: 'Inny Przychód', icon: '💵', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' }
          : { label: 'Inne Wydatki', icon: '📦', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const currentPayNum = Number(customPayAmount) || (selectedPayment?.amount || 0);
  const overpayDiff = selectedPayment ? Math.max(0, currentPayNum - selectedPayment.amount) : 0;

  // Excel (.xlsx) Export
  const handleExportExcel = async () => {
    if (payments.length === 0) {
      alert('Brak zarejestrowanych płatności do pobrania.');
      return;
    }

    try {
      const XLSX = await import('xlsx');

      // 1. Arkusz wpłat zawodników
      const paymentsData = payments.map(p => {
        const fee = fees.find(f => f.id === p.feeId);
        const statusLabel =
          p.status === 'OPLACONE'
            ? 'Opłacone'
            : p.status === 'ZALEGLE'
            ? 'Zaległe'
            : 'Oczekuje na wpłatę';

        return {
          'Tytuł składki': fee?.title || 'Składka klubowa',
          'Termin płatności': fee?.dueDate || '-',
          'Zawodnik': p.userName,
          'Kwota wymagana (zł)': fee?.amount || p.amount,
          'Wpłacono (zł)': p.amount,
          'Nadpłata do skarbca (zł)': p.overpayment || 0,
          'Status': statusLabel,
          'Metoda płatności': p.paymentMethod || '-',
          'ID transakcji': p.transactionId || '-',
          'Data wpłaty': p.paidAt ? new Date(p.paidAt).toLocaleDateString('pl-PL') : '-'
        };
      });

      const wb = XLSX.utils.book_new();
      const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
      wsPayments['!cols'] = [
        { wch: 25 },
        { wch: 16 },
        { wch: 24 },
        { wch: 20 },
        { wch: 16 },
        { wch: 22 },
        { wch: 20 },
        { wch: 18 },
        { wch: 20 },
        { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, wsPayments, 'Składki Zawodników');

      // 2. Arkusz Skarbca (Przychody i Wydatki)
      if (allTransactions && allTransactions.length > 0) {
        const transactionsData = allTransactions.map(t => ({
          'Data': t.date || '-',
          'Typ operacji': t.type === 'INCOME' ? 'Przychód' : 'Wydatek',
          'Tytuł': t.title,
          'Kategoria': t.category,
          'Kwota (zł)': t.amount,
          'Dodane przez': t.createdByName || '-',
          'Opis / Notatka': t.description || '-'
        }));
        const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
        wsTransactions['!cols'] = [
          { wch: 14 },
          { wch: 15 },
          { wch: 28 },
          { wch: 20 },
          { wch: 14 },
          { wch: 20 },
          { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, wsTransactions, 'Kasa Klubowa - Transakcje');
      }

      const fileName = `rozliczenie_skladki_angels_ztp_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Błąd eksportu do Excela:', err);
      alert('Nie udało się wyeksportować pliku Excel.');
    }
  };

  // Reminder Calculation
  const getPendingData = () => {
    const filtered = payments.filter(p => {
      if (reminderFeeId !== 'ALL' && p.feeId !== reminderFeeId) return false;
      return p.status !== 'OPLACONE';
    });
    const uniqueNames = Array.from(new Set(filtered.map(p => p.userName)));
    const totalDue = filtered.reduce((acc, p) => acc + p.amount, 0);
    const selectedFee = fees.find(f => f.id === reminderFeeId);
    const feeTitle = selectedFee ? selectedFee.title : 'składek klubowych';
    return { filtered, uniqueNames, totalDue, feeTitle };
  };

  const generateReminderMsg = () => {
    const { uniqueNames, totalDue, feeTitle } = getPendingData();
    return `📢 *PRZYPOMNIENIE O SKŁADCE - ANGELS ZTP*\n\nCześć Drużyno!\nPrzypominamy o uregulowaniu płatności za: *${feeTitle}*.\n\n⚠️ Osoby z zaległością (${uniqueNames.length}):\n${uniqueNames.map(n => `• ${n}`).join('\n')}\n\n💰 Suma do wpłaty: *${totalDue} zł*\n📲 Składkę można opłacić ekspresowo w aplikacji Angels ZTP (BLIK / Przelew) lub gotówką u Kierownika.\n\nDziękujemy za terminowość! 🏐🔥`;
  };

  const handleOpenReminderModal = () => {
    setShowReminderModal(true);
    setCopiedReminder(false);
    setCustomReminderText('');
  };

  const handlePublishReminderAnnouncement = async () => {
    setPostingAnnouncement(true);
    try {
      const textToPublish = customReminderText.trim() || generateReminderMsg();
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '📢 Ważne: Przypomnienie o rozliczeniu składek',
          content: textToPublish,
          priority: 'PILNY',
          category: 'SKLADKI',
          isPinned: true
        })
      });
      if (res.ok) {
        alert('Komunikat został pomyślnie opublikowany na tablicy drużyny!');
        setShowReminderModal(false);
      } else {
        const d = await res.json();
        alert(d.error || 'Błąd publikacji komunikatu');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleQuickCashPayment = async (pay: FeePayment) => {
    if (!confirm(`Czy potwierdzasz przyjęcie gotówki (${pay.amount} zł) od ${pay.userName}?`)) return;
    try {
      const res = await fetch('/api/fees/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: pay.id,
          method: 'GOTÓWKA',
          customAmount: pay.amount,
          note: 'Opłacone gotówką do rąk kierownika/trenera'
        })
      });
      if (res.ok) {
        await fetchFeesData();
      } else {
        const d = await res.json();
        alert(d.error || 'Błąd zatwierdzania wpłaty');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-8 pb-24 md:pb-16 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 glow-emerald">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-athletic text-gradient-cyan">
              Finanse & Składki
            </h1>
            <p className="text-xs text-slate-400">
              Skarbiec drużyny, składki członkowskie, opłaty BLIK oraz rejestr wydatków
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md transition"
            title="Pobierz oficjalny arkusz Excel (.xlsx) ze stanem wpłat"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Eksportuj do Excel (.xlsx)
          </button>

          {canManageTreasury && (
            <button
              onClick={handleOpenReminderModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow transition"
              title="Wyślij przypomnienie na WhatsApp lub tablicę drużyny"
            >
              <BellRing className="w-4 h-4 text-amber-400" />
              Przypomnij o składkach
            </button>
          )}

          {canManageTreasury && (
            <button
              onClick={() => {
                setTransactionType('EXPENSE');
                setExpenseCategory('SPRZET');
                setShowExpenseModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 shadow transition"
              title="Zarejestruj wydatek lub przychód kasy drużyny"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span>+ Wydatek / Przychód</span>
            </button>
          )}

          {isManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Nowa Składka
            </button>
          )}
        </div>
      </div>

      {/* Fees Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-px">
        <button
          onClick={() => setFeesTab('fees_table')}
          className={`pb-3.5 px-3 sm:px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 border-b-2 shrink-0 ${
            feesTab === 'fees_table'
              ? 'border-sky-400 text-sky-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Tabela Składek</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border border-slate-800 font-mono text-sky-400 font-bold">
            {filteredPayments.length}
          </span>
        </button>

        <button
          onClick={() => setFeesTab('expenses_revenues')}
          className={`pb-3.5 px-3 sm:px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 border-b-2 shrink-0 ${
            feesTab === 'expenses_revenues'
              ? 'border-amber-400 text-amber-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Tabela Wydatków i Przychodów</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border border-slate-800 font-mono text-amber-400 font-bold">
            {filteredTransactions.length}
          </span>
        </button>

        <button
          onClick={() => setFeesTab('my_fees')}
          className={`pb-3.5 px-3 sm:px-4 text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center gap-2 border-b-2 shrink-0 ${
            feesTab === 'my_fees'
              ? 'border-emerald-400 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Moje Składki (BLIK)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] bg-slate-900 border font-mono font-bold ${
            unpaidUserPayments.length > 0 ? 'border-amber-500/40 text-amber-400' : 'border-slate-800 text-emerald-400'
          }`}>
            {unpaidUserPayments.length > 0 ? `${unpaidUserPayments.length} do opłaty` : userPayments.length}
          </span>
        </button>
      </div>

      {/* 1. TABELA SKŁADEK */}
      {feesTab === 'fees_table' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="cyber-card rounded-3xl p-4 sm:p-5 border border-emerald-500/25 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Zebrano</span>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {summary?.totalCollected || 0} zł
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {summary?.paidCount || 0} opłaconych wpłat
              </span>
            </div>

            <div className="cyber-card rounded-3xl p-4 sm:p-5 border border-amber-500/25 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Oczekujące</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {summary?.totalPending || 0} zł
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Przed upływem terminu
              </span>
            </div>

            <div className="cyber-card rounded-3xl p-4 sm:p-5 border border-rose-500/25 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Zaległe</span>
                <AlertCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                {summary?.totalOverdue || 0} zł
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Po wyznaczonym terminie
              </span>
            </div>

            <div className="cyber-card rounded-3xl p-4 sm:p-5 border border-sky-500/25 relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Ściągalność</span>
                <TrendingUp className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
                {summary?.paymentsCount ? Math.round((summary.paidCount / summary.paymentsCount) * 100) : 0}%
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Łącznie: {summary?.totalExpected || 0} zł
              </span>
            </div>
          </div>

          {/* Quick Player Pending Banner */}
          {unpaidUserPayments.length > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-sky-500/15 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    Masz {unpaidUserPayments.length} nieopłaconą składkę ({unpaidUserPayments.reduce((a, c) => a + c.amount, 0)} zł)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Możesz uregulować ją natychmiast za pomocą 6-cyfrowego kodu BLIK lub tradycyjnego przelewu.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenPaymentModal(unpaidUserPayments[0])}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Zapłać teraz (BLIK)</span>
                </button>
                <button
                  onClick={() => setFeesTab('my_fees')}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition"
                >
                  Moje składki
                </button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 text-sky-400 text-xs font-black uppercase tracking-wider mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  Rejestr Składek Zawodników
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  Tabela Składek
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Szczegółowy rejestr wpłat każdego zawodnika, nadpłat oraz statusu księgowania.
                </p>
              </div>

              {/* Collapsible Filters Toggle */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    showFilters || activeFiltersCount > 0
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Filtry</span>
                  {activeFiltersCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                      {activeFiltersCount}
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => {
                      setFilterFeeId('ALL');
                      setFilterStatus('ALL');
                      setSearchPlayer('');
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-400 transition underline underline-offset-2 ml-1"
                  >
                    Wyczyść filtry
                  </button>
                )}
              </div>
            </div>

            {/* Collapsible Filters Panel */}
            {showFilters && (
              <div className="px-6 pb-4 pt-1 border-b border-slate-800/80 flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Szukaj zawodnika..."
                    value={searchPlayer}
                    onChange={e => setSearchPlayer(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <select
                  value={filterFeeId}
                  onChange={e => setFilterFeeId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">Wszystkie składki</option>
                  {fees.map(f => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="ALL">Wszystkie statusy</option>
                  <option value="OPLACONE">Tylko Opłacone</option>
                  <option value="OCZEKUJE">Tylko Oczekujące</option>
                  <option value="ZALEGLE">Tylko Zaległe</option>
                </select>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Zawodnik</th>
                    <th className="py-3 px-3">Tytuł Składki</th>
                    <th className="py-3 px-3">Termin</th>
                    <th className="py-3 px-3 text-right">Kwota</th>
                    <th className="py-3 px-3 text-right">Nadpłata</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3">Metoda / Transakcja</th>
                    <th className="py-3 px-3 text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-bold">
                        Brak składek spełniających wybrane kryteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map(pay => {
                      const fee = fees.find(f => f.id === pay.feeId);
                      const isPaid = pay.status === 'OPLACONE';
                      return (
                        <tr key={pay.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-sky-400 font-mono">
                              {pay.userName.charAt(0)}
                            </div>
                            {pay.userName}
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-medium">
                            {fee?.title || 'Składka'}
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono">
                            {fee?.dueDate || '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-white">
                            {pay.amount} zł
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-sky-400">
                            {pay.overpayment ? `+${pay.overpayment} zł` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isPaid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {pay.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {pay.paymentMethod ? `${pay.paymentMethod} • ${pay.transactionId || ''}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isPaid ? (
                              <button
                                onClick={() => openReceipt(pay, fee)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-sky-300"
                              >
                                <Receipt className="w-3.5 h-3.5" /> Druk
                              </button>
                            ) : canManageTreasury ? (
                              <button
                                onClick={() => handleQuickCashPayment(pay)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition"
                                title="Oznacz wpłatę gotówki do ręki"
                              >
                                <Check className="w-3 h-3" /> Gotówka
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {totalPaymentsPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">
                  Wyświetlanie <span className="text-white font-bold">{((paymentsPage - 1) * PAYMENTS_PER_PAGE) + 1}</span>–<span className="text-white font-bold">{Math.min(paymentsPage * PAYMENTS_PER_PAGE, filteredPayments.length)}</span> z <span className="text-white font-bold">{filteredPayments.length}</span> rozliczeń
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                    disabled={paymentsPage === 1}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Poprzednia strona"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPaymentsPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPaymentsPage(idx + 1)}
                        className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition ${
                          paymentsPage === idx + 1
                            ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setPaymentsPage(p => Math.min(totalPaymentsPages, p + 1))}
                    disabled={paymentsPage === totalPaymentsPages}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Następna strona"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TABELA WYDATKÓW I PRZYCHODÓW */}
      {feesTab === 'expenses_revenues' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Suma Przychodów</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                +{summary?.totalRevenues ?? summary?.totalCollected ?? 0} zł
              </div>
              <span className="text-[10px] text-slate-500 font-medium truncate block">
                Składki: {summary?.totalCollected || 0} zł • Inne: {summary?.totalIncomes || 0} zł
              </span>
            </div>

            <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Suma Wydatków</span>
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                -{summary?.totalExpenses || 0} zł
              </div>
              <span className="text-[10px] text-slate-500 font-medium truncate block">
                Hala, sprzęt, sędziowie, wpisowe
              </span>
            </div>

            <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Saldo Kasy Zespołu</span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <div className={`text-xl sm:text-2xl font-black font-mono ${
                ((summary?.totalRevenues || 0) - (summary?.totalExpenses || 0)) >= 0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {((summary?.totalRevenues || 0) - (summary?.totalExpenses || 0))} zł
              </div>
              <span className="text-[10px] text-slate-500 font-medium truncate block">
                Przychody minus wydatki
              </span>
            </div>

            <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Skarbiec (Nadpłaty)</span>
                <Coins className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
                {treasury?.balance || 0} zł
              </div>
              <span className="text-[10px] text-slate-500 font-medium truncate block">
                Fundusz celowy z nadpłat graczy
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
                  <Coins className="w-4 h-4" />
                  Księga Finansowa & Przepływy
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">
                  Tabela Wydatków i Przychodów
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ewidencja wszystkich kosztów (hala, sędziowie, sprzęt) oraz wpływów (sponsorzy, nagrody, darowizny).
                </p>
              </div>

              {canManageTreasury && (
                <button
                  onClick={() => {
                    setTransactionType('EXPENSE');
                    setExpenseCategory('SPRZET');
                    setShowExpenseModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj Wpis (Wydatek / Przychód)
                </button>
              )}
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Szukaj po tytule, opisie, autorze..."
                  value={searchTransaction}
                  onChange={e => setSearchTransaction(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <select
                value={filterTransType}
                onChange={e => setFilterTransType(e.target.value as any)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none font-bold"
              >
                <option value="ALL">Wszystkie operacje</option>
                <option value="EXPENSE">🔴 Tylko Wydatki</option>
                <option value="INCOME">🟢 Tylko Przychody</option>
              </select>

              <select
                value={filterTransCategory}
                onChange={e => setFilterTransCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="ALL">Wszystkie kategorie</option>
                <option value="HALA">🏢 Hala sportowa</option>
                <option value="SEDZIOWIE">⚖️ Sędziowie</option>
                <option value="SPRZET">🏐 Sprzęt & Piłki</option>
                <option value="TURNIEJ">🏆 Wpisowe turnieje</option>
                <option value="WODA_ODZYWKI">💧 Woda & Napoje</option>
                <option value="SPONSOR">🤝 Sponsor</option>
                <option value="DAROWIZNA">🎁 Darowizna / Zbiórka</option>
                <option value="NAGRODA">🥇 Nagroda turniejowa</option>
                <option value="SKLADKI">💳 Wpływy ze składek</option>
                <option value="ZWROT">🔄 Zwrot / Refundacja</option>
                <option value="INNE">📦 Inne</option>
              </select>

              {(filterTransType !== 'ALL' || filterTransCategory !== 'ALL' || searchTransaction.trim()) && (
                <button
                  onClick={() => {
                    setFilterTransType('ALL');
                    setFilterTransCategory('ALL');
                    setSearchTransaction('');
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-400 transition underline underline-offset-2 ml-1"
                >
                  Wyczyść filtry
                </button>
              )}
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Typ</th>
                    <th className="py-3 px-3">Kategoria</th>
                    <th className="py-3 px-3">Tytuł & Opis</th>
                    <th className="py-3 px-3">Zarejestrował</th>
                    <th className="py-3 px-3 text-right">Kwota</th>
                    {canManageTreasury && <th className="py-3 px-3 text-right">Akcja</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={canManageTreasury ? 7 : 6} className="py-8 text-center text-slate-500 font-bold">
                        Brak wpisów spełniających wybrane kryteria w tabeli wydatków i przychodów.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map(trans => {
                      const isIncome = trans.type === 'INCOME';
                      const badge = getCategoryBadge(trans.category, trans.type || 'EXPENSE');

                      return (
                        <tr key={trans.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {trans.date}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              isIncome
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}>
                              {isIncome ? (
                                <>
                                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                                  <span>Przychód</span>
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="w-3 h-3 text-rose-400" />
                                  <span>Wydatek</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badge.color}`}>
                              <span>{badge.icon}</span>
                              <span>{badge.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white text-xs">{trans.title}</div>
                            {trans.description && (
                              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{trans.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-[11px]">
                            {trans.createdByName}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-sm">
                            <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                              {isIncome ? `+${trans.amount} zł` : `-${trans.amount} zł`}
                            </span>
                          </td>
                          {canManageTreasury && (
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleDeleteTransaction(trans.id)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                                title="Usuń wpis"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalTransPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">
                  Wyświetlanie <span className="text-white font-bold">{((transPage - 1) * TRANS_PER_PAGE) + 1}</span>–<span className="text-white font-bold">{Math.min(transPage * TRANS_PER_PAGE, filteredTransactions.length)}</span> z <span className="text-white font-bold">{filteredTransactions.length}</span> transakcji
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTransPage(p => Math.max(1, p - 1))}
                    disabled={transPage === 1}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Poprzednia strona"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalTransPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTransPage(idx + 1)}
                        className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-black transition ${
                          transPage === idx + 1
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setTransPage(p => Math.min(totalTransPages, p + 1))}
                    disabled={transPage === totalTransPages}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Następna strona"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. DLA ZAWODNIKA: MOJE SKŁADKI */}
      {feesTab === 'my_fees' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Moje Składki ({user?.name})
              </h2>
            </div>
            {treasury?.userOverpayments > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Masz {treasury.userOverpayments} zł nadpłaty w skarbcu
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPayments.map(pay => {
              const fee = fees.find(f => f.id === pay.feeId);
              const isPaid = pay.status === 'OPLACONE';
              const isOverdue = pay.status === 'ZALEGLE';

              return (
                <div
                  key={pay.id}
                  className={`bg-[#0c1016] border rounded-3xl p-5 transition flex flex-col justify-between shadow-xl ${
                    isPaid ? 'border-emerald-500/40' : isOverdue ? 'border-rose-500/60 bg-rose-950/10' : 'border-amber-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {fee?.type || 'SKŁADKA'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                        isPaid ? 'bg-emerald-500/20 text-emerald-300' : isOverdue ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {pay.status}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white line-clamp-1">{fee?.title || 'Składka'}</h3>
                    {fee?.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{fee.description}</p>}

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Termin: {fee?.dueDate}</span>
                      <div className="text-right">
                        <span className="text-xl font-black text-white font-mono">{pay.amount} zł</span>
                        {pay.overpayment && pay.overpayment > 0 && (
                          <span className="block text-[10px] text-sky-400 font-bold">
                            (w tym +{pay.overpayment} zł do skarbca)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    {isPaid ? (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Opłacono: {pay.paymentMethod}</span>
                        <button
                          onClick={() => openReceipt(pay, fee)}
                          className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-bold"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Potwierdzenie
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenPaymentModal(pay)}
                        className="w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2"
                      >
                        <Smartphone className="w-4 h-4" />
                        Opłać składkę (BLIK / Przelew)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal with Flexible Amount */}
      {paymentModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setPaymentModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {!paymentSuccess ? (
              <div>
                <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black border border-sky-500/40">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase">Wpłata Składki</h3>
                    <p className="text-xs text-slate-400">{selectedPayment.userName}</p>
                  </div>
                </div>

                {/* Amount with Overpay options */}
                <div className="space-y-3 mb-5">
                  <label className="block text-xs font-black uppercase text-slate-300">
                    Kwota wpłaty (zł):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={customPayAmount}
                      onChange={e => setCustomPayAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-3 text-xl font-mono font-black text-amber-400 focus:outline-none focus:border-sky-400"
                    />
                    <span className="absolute right-4 top-3 text-slate-400 font-bold text-sm">PLN</span>
                  </div>

                  {/* Quick Overpayment Chips */}
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setCustomPayAmount(String(selectedPayment.amount))}
                      className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold transition"
                    >
                      Podstawowa: {selectedPayment.amount} zł
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomPayAmount(String(selectedPayment.amount + 30))}
                      className="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-[11px] font-bold transition"
                    >
                      +30 zł do skarbca
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomPayAmount(String(selectedPayment.amount + 80))}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition"
                    >
                      +80 zł (Sprzęt)
                    </button>
                  </div>

                  {overpayDiff > 0 && (
                    <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs space-y-2">
                      <div className="flex items-center gap-2 text-sky-300 font-bold">
                        <Sparkles className="w-4 h-4" />
                        Nadpłata: +{overpayDiff} zł trafi do skarbca!
                      </div>
                      <select
                        value={splitTarget}
                        onChange={e => setSplitTarget(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
                      >
                        <option value="FUNDUSZ_DRUZYNY">Wspólny skarbiec (piłki, woda, apteczka)</option>
                        <option value="ZALICZKA">Zaliczka na moje kolejne składki</option>
                        <option value="SPRZET">Dopłata do sprzętu meczowego</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* BLIK Code */}
                <div className="mb-5 space-y-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Wpisz 6-cyfrowy kod BLIK z aplikacji bankowej:
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123 456"
                    value={blikCode}
                    onChange={e => setBlikCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-center text-2xl font-mono tracking-widest font-black text-amber-400 focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[11px] text-slate-400 block text-center">
                    (Wpisz np. <strong>789123</strong>)
                  </span>
                </div>

                <button
                  onClick={executePayment}
                  disabled={processing}
                  className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-slate-950 shadow-xl shadow-sky-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processing ? 'Przetwarzanie w banku...' : `Zapłać ${currentPayNum} zł`}
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce border border-emerald-500/40">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white uppercase">Płatność Zakończona!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Wpłata na kwotę <strong className="text-emerald-400 font-mono">{currentPayNum} zł</strong> została zaksięgowana na koncie drużyny Angels ZTP.
                </p>

                {overpayDiff > 0 && (
                  <p className="text-xs text-sky-300 mt-2 p-2 bg-sky-500/10 rounded-xl border border-sky-500/30">
                    🎉 Nadpłata <strong>+{overpayDiff} zł</strong> zasiliła wspólny skarbiec drużyny!
                  </p>
                )}

                <div className="my-4 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-amber-400 font-bold">
                  Transakcja: {selectedPayment.transactionId || 'BLK-928174'}
                </div>

                <button
                  onClick={() => {
                    setPaymentModalOpen(false);
                    openReceipt(selectedPayment);
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white transition flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4 text-sky-400" />
                  Potwierdzenie Wpłaty
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Dodaj Wydatek / Przychód */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-base font-black text-white uppercase flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>Nowa Operacja Finansowa</span>
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
                  Typ operacji *
                </label>
                <div className="flex rounded-2xl bg-slate-900 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType('EXPENSE');
                      setExpenseCategory('SPRZET');
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 ${
                      transactionType === 'EXPENSE'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>🔴 Wydatek (Koszt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransactionType('INCOME');
                      setExpenseCategory('SPONSOR');
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition flex items-center justify-center gap-1.5 ${
                      transactionType === 'INCOME'
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>🟢 Przychód (Wpływ)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-1">
                  {transactionType === 'EXPENSE' ? 'Cel / Tytuł wydatku *' : 'Źródło / Tytuł przychodu *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={transactionType === 'EXPENSE' ? 'np. Wynajem hali Luboń, zakup piłek Mikasa...' : 'np. Wsparcie sponsora Dark Angel, zbiórka na turniej...'}
                  value={expenseTitle}
                  onChange={e => setExpenseTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-300 mb-1">Kwota (zł) *</label>
                  <input
                    type="number"
                    required
                    placeholder="np. 250"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono font-black focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-300 mb-1">Kategoria</label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {transactionType === 'EXPENSE' ? (
                      <>
                        <option value="HALA">🏢 Wynajem hali</option>
                        <option value="SEDZIOWIE">⚖️ Opłaty sędziowskie</option>
                        <option value="SPRZET">🏐 Sprzęt & Piłki</option>
                        <option value="TURNIEJ">🏆 Wpisowe turniejowe</option>
                        <option value="WODA_ODZYWKI">💧 Woda & Napoje</option>
                        <option value="INNE">📦 Inne klubowe</option>
                      </>
                    ) : (
                      <>
                        <option value="SPONSOR">🤝 Wsparcie sponsorskie</option>
                        <option value="DAROWIZNA">🎁 Darowizna / Zbiórka</option>
                        <option value="NAGRODA">🥇 Nagroda turniejowa</option>
                        <option value="SKLADKI">💳 Wpłaty ze składek</option>
                        <option value="ZWROT">🔄 Zwrot / Refundacja</option>
                        <option value="INNE">💵 Inny przychód</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-1">Data operacji</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-1">Opis / Szczegóły dokumentu</label>
                <textarea
                  rows={2}
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  placeholder="Numer paragonu/faktury, umowa sponsorska, specyfikacja..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                    transactionType === 'INCOME'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  {submittingExpense ? 'Zapisywanie...' : transactionType === 'INCOME' ? 'Zatwierdź Przychód' : 'Zatwierdź Wydatek'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nowa Składka */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-base font-black text-white uppercase">Nowa Składka Klubowa</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateFee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tytuł składki *</label>
                <input
                  type="text"
                  required
                  placeholder="np. Składka klubowa - Grudzień 2026"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kwota bazowa (zł) *</label>
                  <input
                    type="number"
                    required
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Termin *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingFee}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
                >
                  Utwórz składkę
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Potwierdzenie Wpłaty */}
      {receiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] text-slate-100 rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-slate-800">
            <button
              onClick={() => setReceiptModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>

            <div className="text-center pb-4 border-b border-slate-800">
              <span className="text-3xl">🏐</span>
              <h2 className="text-lg font-black text-white uppercase tracking-wider mt-1">ANGELS ZTP</h2>
              <p className="text-[10px] text-sky-400 uppercase tracking-widest font-bold">Oficjalne Potwierdzenie Wpłaty</p>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tytuł:</span>
                <strong className="text-right text-white">{receiptData.fee?.title || 'Składka klubowa'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Zawodnik:</span>
                <strong className="text-white">{receiptData.payment?.userName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kwota uregulowana:</span>
                <strong className="text-lg text-emerald-400 font-mono font-black">{receiptData.payment?.amount} PLN</strong>
              </div>
              {receiptData.payment?.overpayment > 0 && (
                <div className="flex justify-between text-sky-400">
                  <span>W tym nadpłata do skarbca:</span>
                  <strong className="font-mono">+{receiptData.payment.overpayment} PLN</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Metoda płatności:</span>
                <strong className="text-amber-400">{receiptData.payment?.paymentMethod || 'BLIK'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Numer transakcji:</span>
                <span className="font-mono text-slate-300">{receiptData.payment?.transactionId}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-3">
                <CheckCircle className="w-4 h-4" /> ROZLICZONE W SKARBCU
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
              >
                <Printer className="w-4 h-4" /> Drukuj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Przypomnienie o składkach */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setShowReminderModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black border border-amber-500/40">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase">Przypomnij o Składkach</h3>
                <p className="text-xs text-slate-400">Wyślij gotowy komunikat do zalegających graczy</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-1">
                  Wybierz składkę do rozliczenia:
                </label>
                <select
                  value={reminderFeeId}
                  onChange={e => setReminderFeeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                >
                  <option value="ALL">Wszystkie aktywne składki</option>
                  {fees.map(f => (
                    <option key={f.id} value={f.id}>{f.title} ({f.amount} zł)</option>
                  ))}
                </select>
              </div>

              {/* Summary Stats */}
              {(() => {
                const { uniqueNames, totalDue } = getPendingData();
                return (
                  <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Oczekujących zawodników:</span>
                      <strong className="block text-white font-mono text-sm">{uniqueNames.length} osób</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400">Łączna kwota zaległości:</span>
                      <strong className="block text-amber-400 font-mono text-base font-black">{totalDue} zł</strong>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-black uppercase text-slate-300 mb-1">
                  Treść powiadomienia (możesz edytować przed wysyłką):
                </label>
                <textarea
                  rows={6}
                  value={customReminderText || generateReminderMsg()}
                  onChange={e => setCustomReminderText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = customReminderText || generateReminderMsg();
                    navigator.clipboard.writeText(text);
                    setCopiedReminder(true);
                    setTimeout(() => setCopiedReminder(false), 2500);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  {copiedReminder ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-sky-400" />}
                  {copiedReminder ? 'Skopiowano!' : 'Kopiuj treść'}
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(customReminderText || generateReminderMsg())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition text-center"
                >
                  <ExternalLink className="w-4 h-4" /> WhatsApp
                </a>

                <button
                  type="button"
                  disabled={postingAnnouncement}
                  onClick={handlePublishReminderAnnouncement}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition"
                >
                  <BellRing className="w-4 h-4" />
                  {postingAnnouncement ? 'Publikowanie...' : 'Na Tablicę'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Ładowanie Skarbca...</div>}>
      <FeesContent />
    </Suspense>
  );
}
