import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import NewTransactionDialog from "@/components/NewTransactionDialog";

const formatCurrency = (value: any, hideValue = false) => {
  if (hideValue) return "••••••";
  const num = typeof value === "string" ? parseFloat(value) : value || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hideBalance, setHideBalance] = useState(false);
  const [showNewTransaction, setShowNewTransaction] = useState(false);

  const currentMonth = format(currentDate, "yyyy-MM");
  const monthLabel = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });

  const totalsQuery = trpc.transactions.getTotals.useQuery({ month: currentMonth });
  const transactionsQuery = trpc.transactions.listByMonth.useQuery({ month: currentMonth });
  const creditCardsQuery = trpc.creditCards.list.useQuery();
  const byPersonQuery = trpc.transactions.getByPerson.useQuery({ month: currentMonth });

  const isLoading = totalsQuery.isLoading || transactionsQuery.isLoading;

  const income = parseFloat(String(totalsQuery.data?.income || 0));
  const expense = parseFloat(String(totalsQuery.data?.expense || 0));
  const balance = income - expense;
  const transactions = (transactionsQuery.data || []).slice(0, 5);
  const creditCards = creditCardsQuery.data || [];

  const previousMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const nextMonth = () => setCurrentDate((d) => addMonths(d, 1));

  return (
    <DashboardLayout>
      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-200"
          style={{ background: "#FFFFFF" }}
        >
          <ArrowLeft size={16} style={{ color: "#6B7280" }} />
        </button>
        <p className="text-sm font-semibold text-gray-700 capitalize">{monthLabel}</p>
        <button
          onClick={nextMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-gray-200"
          style={{ background: "#FFFFFF" }}
        >
          <ArrowRight size={16} style={{ color: "#6B7280" }} />
        </button>
      </div>

      {/* Card principal de saldo */}
      <div className="card-balance p-6 mb-4 animate-fadeIn" style={{ borderRadius: "20px" }}>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/80 text-sm font-medium">Saldo do mês</p>
            <button
              onClick={() => setHideBalance((h) => !h)}
              className="text-white/70 hover:text-white transition-colors"
            >
              {hideBalance ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-4xl font-bold text-white mb-4 tracking-tight">
            {isLoading ? (
              <span className="skeleton inline-block w-40 h-9 rounded-lg" />
            ) : (
              formatCurrency(balance, hideBalance)
            )}
          </p>
          <div className="flex gap-4">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <TrendingUp size={14} className="text-white/80" />
              <div>
                <p className="text-white/70 text-xs leading-tight">Receitas</p>
                <p className="text-white text-sm font-semibold leading-tight">
                  {isLoading ? "..." : formatCurrency(income, hideBalance)}
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <TrendingDown size={14} className="text-white/80" />
              <div>
                <p className="text-white/70 text-xs leading-tight">Despesas</p>
                <p className="text-white text-sm font-semibold leading-tight">
                  {isLoading ? "..." : formatCurrency(expense, hideBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div
        className="bg-white rounded-2xl p-4 mb-4 animate-fadeIn stagger-1"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
      >
        <div className="flex justify-around">
          <button
            onClick={() => setShowNewTransaction(true)}
            className="quick-action"
          >
            <div className="quick-action-icon">
              <Plus size={22} />
            </div>
            <span>Novo</span>
          </button>
          <button
            onClick={() => setLocation("/transacoes")}
            className="quick-action"
          >
            <div className="quick-action-icon">
              <TrendingDown size={22} />
            </div>
            <span>Transações</span>
          </button>
          <button
            onClick={() => setLocation("/cartoes")}
            className="quick-action"
          >
            <div className="quick-action-icon">
              <CreditCard size={22} />
            </div>
            <span>Cartões</span>
          </button>
          <button className="quick-action">
            <div className="quick-action-icon">
              <Wallet size={22} />
            </div>
            <span>Saldo</span>
          </button>
        </div>
      </div>

      {/* Gastos por pessoa */}
      {byPersonQuery.data && !isLoading && (
        <div
          className="bg-white rounded-2xl p-4 mb-4 animate-fadeIn stagger-2"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Por pessoa</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(byPersonQuery.data as Record<string, number>).map(
              ([person, value]) => (
                <div
                  key={person}
                  className="rounded-xl p-3"
                  style={{ background: "#F9FAFB" }}
                >
                  <p className="text-xs text-gray-400 mb-1">{person}</p>
                  <p className="text-base font-bold text-red-500">
                    {formatCurrency(value, hideBalance)}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Cartões de crédito resumo */}
      {creditCards.length > 0 && (
        <div
          className="bg-white rounded-2xl p-4 mb-4 animate-fadeIn stagger-3"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Cartões</h3>
            <button
              onClick={() => setLocation("/cartoes")}
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: "#FF6600" }}
            >
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {creditCards.slice(0, 2).map((card: any) => {
              const used = parseFloat(String(card.limitUsed || 0));
              const total = parseFloat(String(card.limitTotal || 1));
              const pct = Math.min(100, (used / total) * 100);
              return (
                <div
                  key={card.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "#F9FAFB" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#1F2937" }}
                  >
                    <CreditCard size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {card.name}
                    </p>
                    <div className="progress-bar mt-1.5" style={{ height: "4px" }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct > 80 ? "#DC2626" : "#FF6600",
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(total - used, hideBalance)}
                    </p>
                    <p className="text-xs text-gray-400">disponível</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Últimas transações */}
      <div
        className="bg-white rounded-2xl p-4 animate-fadeIn stagger-4"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Últimas transações
          </h3>
          <button
            onClick={() => setLocation("/transacoes")}
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: "#FF6600" }}
          >
            Ver todas <ChevronRight size={14} />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin" style={{ color: "#FF6600" }} />
          </div>
        )}

        {!isLoading && transactions.length === 0 && (
          <div className="text-center py-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "#FFF0E6" }}
            >
              <Wallet size={24} style={{ color: "#FF6600" }} />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">
              Nenhuma transação
            </p>
            <p className="text-xs text-gray-400">
              Registre seu primeiro lançamento
            </p>
            <button
              onClick={() => setShowNewTransaction(true)}
              className="mt-4 btn-inter text-sm"
              style={{ padding: "10px 20px", borderRadius: "10px" }}
            >
              <Plus size={15} />
              Novo lançamento
            </button>
          </div>
        )}

        {!isLoading &&
          transactions.map((tx: any, idx: number) => (
            <div key={tx.id} className="transaction-item" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div
                className="transaction-icon"
                style={{
                  background:
                    tx.type === "income" || tx.kind === "income"
                      ? "#DCFCE7"
                      : "#FEE2E2",
                }}
              >
                {tx.type === "income" || tx.kind === "income" ? (
                  <TrendingUp size={18} className="text-green-600" />
                ) : (
                  <TrendingDown size={18} className="text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {tx.description}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {tx.person || tx.responsibleUserId
                    ? `${tx.person || "Usuário"} • `
                    : ""}
                  {tx.paymentMethod === "pix" || tx.paymentMethod === "Pix"
                    ? "Pix"
                    : "Cartão"}
                  {" • "}
                  {tx.date || tx.transactionDate
                    ? new Date(
                        String(tx.date || tx.transactionDate)
                      ).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>
              <p
                className="text-sm font-bold ml-2"
                style={{
                  color:
                    tx.type === "income" || tx.kind === "income"
                      ? "#16A34A"
                      : "#DC2626",
                }}
              >
                {tx.type === "income" || tx.kind === "income" ? "+" : "-"}
                {formatCurrency(tx.amount, hideBalance)}
              </p>
            </div>
          ))}
      </div>

      {showNewTransaction && (
        <NewTransactionDialog
          open={showNewTransaction}
          onClose={() => setShowNewTransaction(false)}
          onSuccess={() => {
            setShowNewTransaction(false);
            transactionsQuery.refetch();
            totalsQuery.refetch();
          }}
          currentMonth={currentMonth}
          currentUser={user?.displayName || "Igor"}
        />
      )}
    </DashboardLayout>
  );
}
