import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  TrendingDown,
  TrendingUp,
  Search,
  Loader2,
  Calendar,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import NewTransactionDialog from "@/components/NewTransactionDialog";
import { useAuth } from "@/_core/hooks/useAuth";

const formatCurrency = (value: any) => {
  const num = typeof value === "string" ? parseFloat(value) : value || 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
};

type FilterType = "all" | "income" | "expense";
type FilterPerson = "all" | "Igor" | "Giovana";

export default function TransactionsPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterPerson, setFilterPerson] = useState<FilterPerson>("all");
  const [showNew, setShowNew] = useState(false);

  const currentMonth = format(currentDate, "yyyy-MM");
  const monthLabel = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });

  const transactionsQuery = trpc.transactions.listByMonth.useQuery({ month: currentMonth });
  const totalsQuery = trpc.transactions.getTotals.useQuery({ month: currentMonth });
  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => {
      transactionsQuery.refetch();
      totalsQuery.refetch();
    },
  });

  const allTransactions = (transactionsQuery.data || []) as any[];

  const filtered = allTransactions.filter((tx) => {
    const txType = tx.type || tx.kind;
    const matchType = filterType === "all" || txType === filterType;
    const matchPerson = filterPerson === "all" || tx.person === filterPerson;
    const matchSearch =
      !search ||
      tx.description?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchPerson && matchSearch;
  });

  // Agrupar por data
  const grouped: Record<string, any[]> = {};
  filtered.forEach((tx) => {
    const dateKey = tx.date || tx.transactionDate || "";
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(tx);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  const income = parseFloat(String(totalsQuery.data?.income || 0));
  const expense = parseFloat(String(totalsQuery.data?.expense || 0));

  return (
    <DashboardLayout>
      {/* Navegação de mês */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentDate((d) => subMonths(d, 1))}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white hover:bg-gray-100 transition-colors"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
        >
          <ArrowLeft size={16} style={{ color: "#6B7280" }} />
        </button>
        <p className="text-sm font-bold text-gray-700 capitalize">{monthLabel}</p>
        <button
          onClick={() => setCurrentDate((d) => addMonths(d, 1))}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-white hover:bg-gray-100 transition-colors"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
        >
          <ArrowRight size={16} style={{ color: "#6B7280" }} />
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 animate-fadeIn" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#DCFCE7" }}>
              <TrendingUp size={15} className="text-green-600" />
            </div>
            <p className="text-xs font-medium text-gray-400">Receitas</p>
          </div>
          <p className="text-lg font-bold text-green-600">{formatCurrency(income)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 animate-fadeIn stagger-1" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#FEE2E2" }}>
              <TrendingDown size={15} className="text-red-500" />
            </div>
            <p className="text-xs font-medium text-gray-400">Despesas</p>
          </div>
          <p className="text-lg font-bold text-red-500">{formatCurrency(expense)}</p>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="bg-white rounded-2xl p-3 mb-4 space-y-3 animate-fadeIn stagger-2" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
        {/* Busca */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#F3F4F6" }}>
          <Search size={15} style={{ color: "#9CA3AF" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar transação..."
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-300 outline-none border-none"
            style={{ boxShadow: "none" }}
          />
        </div>

        {/* Filtro tipo */}
        <div className="flex gap-1.5">
          {([
            { key: "all", label: "Todos" },
            { key: "income", label: "Receitas" },
            { key: "expense", label: "Despesas" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filterType === f.key ? "#FF6600" : "#F3F4F6",
                color: filterType === f.key ? "white" : "#6B7280",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtro pessoa */}
        <div className="flex gap-1.5">
          {([
            { key: "all", label: "Todos" },
            { key: "Igor", label: "Igor" },
            { key: "Giovana", label: "Giovana" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterPerson(f.key)}
              className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filterPerson === f.key ? "#2563EB" : "#F3F4F6",
                color: filterPerson === f.key ? "white" : "#6B7280",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de transações */}
      <div className="bg-white rounded-2xl overflow-hidden animate-fadeIn stagger-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
        {transactionsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin" style={{ color: "#FF6600" }} />
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "#FFF0E6" }}>
              <Calendar size={24} style={{ color: "#FF6600" }} />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Nenhuma transação encontrada</p>
            <p className="text-xs text-gray-400 mb-4">
              {search || filterType !== "all" || filterPerson !== "all"
                ? "Tente outros filtros"
                : "Registre seu primeiro lançamento"}
            </p>
            {!search && filterType === "all" && filterPerson === "all" && (
              <button
                onClick={() => setShowNew(true)}
                className="btn-inter text-sm"
                style={{ padding: "10px 20px", borderRadius: "12px" }}
              >
                <Plus size={15} />
                Novo lançamento
              </button>
            )}
          </div>
        ) : (
          <div className="px-4">
            {sortedDates.map((date, di) => (
              <div key={date}>
                {/* Header de data */}
                <div
                  className="flex items-center gap-2 py-3"
                  style={{ borderBottom: "1px solid #F3F4F6" }}
                >
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {(() => {
                      const d = new Date(date + "T00:00:00");
                      return d.toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "short",
                      });
                    })()}
                  </p>
                </div>

                {/* Transações do dia */}
                {grouped[date].map((tx: any, ti: number) => {
                  const txType = tx.type || tx.kind;
                  const isIncome = txType === "income";
                  return (
                    <div
                      key={tx.id || ti}
                      className="transaction-item"
                    >
                      <div
                        className="transaction-icon"
                        style={{ background: isIncome ? "#DCFCE7" : "#FEE2E2" }}
                      >
                        {isIncome ? (
                          <TrendingUp size={17} className="text-green-600" />
                        ) : (
                          <TrendingDown size={17} className="text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {tx.person && (
                            <span
                              className="chip"
                              style={{
                                background: tx.person === "Igor" ? "#DBEAFE" : "#FCE7F3",
                                color: tx.person === "Igor" ? "#1D4ED8" : "#9D174D",
                                padding: "2px 8px",
                                fontSize: "11px",
                              }}
                            >
                              {tx.person}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {tx.paymentMethod === "pix" ? "Pix" : "Cartão"}
                          </span>
                          {tx.isFixed && (
                            <span className="text-xs" style={{ color: "#D97706" }}>
                              Fixo
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p
                          className="text-sm font-bold"
                          style={{ color: isIncome ? "#16A34A" : "#DC2626" }}
                        >
                          {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                        </p>
                        <button
                          onClick={() => {
                            if (confirm("Remover este lançamento?")) {
                              deleteMutation.mutate({ id: Number(tx.id) });
                            }
                          }}
                          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                        >
                          remover
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowNew(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 transition-all hover:scale-105 active:scale-95"
        style={{
          background: "#FF6600",
          boxShadow: "0 4px 16px rgba(255,102,0,0.4)",
        }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {showNew && (
        <NewTransactionDialog
          open={showNew}
          onClose={() => setShowNew(false)}
          onSuccess={() => {
            setShowNew(false);
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
