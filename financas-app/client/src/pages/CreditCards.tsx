import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  CreditCard,
  Plus,
  Loader2,
  ChevronRight,
  X,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useIsMobile } from "@/hooks/useMobile";

const cardSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  brand: z.string().min(1, "Bandeira obrigatória"),
  limitTotal: z.string().min(1, "Limite obrigatório"),
});

type CardForm = z.infer<typeof cardSchema>;

const formatCurrency = (value: any) => {
  const num = typeof value === "string" ? parseFloat(value) : value || 0;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
};

const brandColors: Record<string, string> = {
  Visa: "linear-gradient(135deg, #1a1aff 0%, #003087 100%)",
  Mastercard: "linear-gradient(135deg, #eb001b 0%, #f79e1b 100%)",
  Elo: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
  Amex: "linear-gradient(135deg, #007B5E 0%, #00A693 100%)",
  Outros: "linear-gradient(135deg, #374151 0%, #6B7280 100%)",
};

export default function CreditCardsPage() {
  const isMobile = useIsMobile();
  const [showNew, setShowNew] = useState(false);
  const creditCardsQuery = trpc.creditCards.list.useQuery();
  const totalsQuery = trpc.creditCards.totals.useQuery();

  const createMutation = trpc.creditCards.create.useMutation({
    onSuccess: () => {
      creditCardsQuery.refetch();
      totalsQuery.refetch();
      setShowNew(false);
      reset();
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CardForm>({
    resolver: zodResolver(cardSchema),
    defaultValues: { brand: "Visa" },
  });

  const onSubmit = async (data: CardForm) => {
    const raw = data.limitTotal.replace(",", ".");
    const parsed = parseFloat(raw);
    if (isNaN(parsed)) return;
    await createMutation.mutateAsync({
      name: data.name,
      brand: data.brand,
      limitTotal: parsed.toFixed(2),
    });
  };

  const cards = (creditCardsQuery.data || []) as any[];
  const totals = totalsQuery.data;

  // Modal de novo cartão
  const newCardModal = showNew && (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={() => setShowNew(false)}
    >
      <div
        className="bg-white w-full md:max-w-sm md:rounded-2xl animate-slideUp md:animate-scaleIn"
        style={{ borderRadius: isMobile ? "20px 20px 0 0" : "20px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: "#D1D5DB" }} />
          </div>
        )}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "#E5E7EB" }}>
          <h2 className="text-base font-bold text-gray-900">Novo cartão</h2>
          <button
            onClick={() => setShowNew(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X size={18} style={{ color: "#6B7280" }} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Nome do cartão
            </label>
            <input
              {...register("name")}
              placeholder="Ex: Nubank, C6, Itaú..."
              className="w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900"
              style={{ borderColor: errors.name ? "#DC2626" : "#E5E7EB", background: "#FAFAFA" }}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Bandeira
            </label>
            <select
              {...register("brand")}
              className="w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900"
              style={{ borderColor: "#E5E7EB", background: "#FAFAFA" }}
            >
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="Elo">Elo</option>
              <option value="Amex">American Express</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
              Limite total (R$)
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: "#9CA3AF" }}
              >
                R$
              </span>
              <input
                {...register("limitTotal")}
                placeholder="0,00"
                inputMode="decimal"
                className="w-full rounded-xl border pl-10 pr-4 py-3 text-sm font-medium text-gray-900"
                style={{ borderColor: errors.limitTotal ? "#DC2626" : "#E5E7EB", background: "#FAFAFA" }}
              />
            </div>
            {errors.limitTotal && (
              <p className="text-red-500 text-xs mt-1">{errors.limitTotal.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn-inter w-full"
            style={{ borderRadius: "14px", padding: "15px" }}
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              "Adicionar cartão"
            )}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cartões de Crédito</h1>
          <p className="text-xs text-gray-400 mt-0.5">Gerencie seus cartões e limites</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          style={{ background: "#FF6600", color: "white" }}
        >
          <Plus size={16} />
          Novo
        </button>
      </div>

      {/* Resumo geral */}
      {totals && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "Limite total", value: totals.totalLimit, color: "#2563EB" },
            { label: "Utilizado", value: totals.totalUsed, color: "#DC2626" },
            { label: "Disponível", value: totals.totalAvailable, color: "#16A34A" },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-3 text-center animate-fadeIn"
              style={{
                boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className="text-sm font-bold" style={{ color: item.color }}>
                {formatCurrency(item.value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {creditCardsQuery.isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: "#FF6600" }} />
        </div>
      )}

      {/* Empty state */}
      {!creditCardsQuery.isLoading && cards.length === 0 && (
        <div
          className="bg-white rounded-2xl p-10 text-center animate-fadeIn"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#FFF0E6" }}
          >
            <CreditCard size={28} style={{ color: "#FF6600" }} />
          </div>
          <p className="text-base font-bold text-gray-700 mb-1">Nenhum cartão cadastrado</p>
          <p className="text-sm text-gray-400 mb-5">
            Adicione seus cartões para controlar os limites
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="btn-inter text-sm"
            style={{ padding: "11px 24px", borderRadius: "12px" }}
          >
            <Plus size={15} />
            Adicionar cartão
          </button>
        </div>
      )}

      {/* Lista de cartões */}
      <div className="space-y-4">
        {cards.map((card: any, idx: number) => {
          const used = parseFloat(String(card.limitUsed || 0));
          const total = parseFloat(String(card.limitTotal || 1));
          const available = total - used;
          const pct = Math.min(100, (used / total) * 100);
          const gradient = brandColors[card.brand] || brandColors["Outros"];

          return (
            <div
              key={card.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              {/* Cartão visual */}
              <div
                className="credit-card-visual p-5 mb-3"
                style={{ background: gradient }}
              >
                <div className="relative z-10 flex flex-col h-full justify-between" style={{ minHeight: "140px" }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white/60 text-xs font-medium">{card.brand}</p>
                      <p className="text-white text-lg font-bold mt-0.5">{card.name}</p>
                    </div>
                    <CreditCard size={28} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs mb-1">Limite disponível</p>
                    <p className="text-white text-2xl font-bold">{formatCurrency(available)}</p>
                  </div>
                </div>
              </div>

              {/* Detalhes */}
              <div
                className="bg-white rounded-2xl p-4"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}
              >
                {/* Barra de progresso */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-gray-400">Utilizado</span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: pct > 80 ? "#DC2626" : "#FF6600" }}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct > 80
                            ? "linear-gradient(90deg, #DC2626, #B91C1C)"
                            : "linear-gradient(90deg, #FF6600, #FF8533)",
                      }}
                    />
                  </div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl" style={{ background: "#F9FAFB" }}>
                    <p className="text-xs text-gray-400 mb-1">Limite</p>
                    <p className="text-sm font-bold text-gray-800">{formatCurrency(total)}</p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: "#FEE2E2" }}>
                    <p className="text-xs text-red-400 mb-1">Usado</p>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(used)}</p>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: "#DCFCE7" }}>
                    <p className="text-xs text-green-500 mb-1">Livre</p>
                    <p className="text-sm font-bold text-green-700">{formatCurrency(available)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowNew(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full flex items-center justify-center z-30 transition-all hover:scale-105 active:scale-95"
        style={{ background: "#FF6600", boxShadow: "0 4px 16px rgba(255,102,0,0.4)" }}
      >
        <Plus size={24} className="text-white" />
      </button>

      {newCardModal}
    </DashboardLayout>
  );
}
