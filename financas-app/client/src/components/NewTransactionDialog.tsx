import { trpc } from "@/lib/trpc";
import { useIsMobile } from "@/hooks/useMobile";
import { X, TrendingUp, TrendingDown, CreditCard, Smartphone } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

const schema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.string().min(1, "Valor obrigatório"),
  type: z.enum(["income", "expense"]),
  paymentMethod: z.enum(["pix", "creditCard"]),
  creditCardId: z.number().optional(),
  categoryId: z.number().optional(),
  person: z.enum(["Igor", "Giovana"]),
  isFixed: z.boolean(),
  date: z.string(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentMonth: string;
  currentUser: string;
}

export default function NewTransactionDialog({
  open,
  onClose,
  onSuccess,
  currentMonth,
  currentUser,
}: Props) {
  const isMobile = useIsMobile();
  const creditCardsQuery = trpc.creditCards.list.useQuery();
  const createMutation = trpc.transactions.create.useMutation({
    onSuccess,
  });

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        type: "expense",
        paymentMethod: "pix",
        person: (currentUser === "Igor" || currentUser === "Giovana")
          ? currentUser
          : "Igor",
        isFixed: false,
        date: new Date().toISOString().split("T")[0],
      },
    });

  const type = watch("type");
  const paymentMethod = watch("paymentMethod");
  const creditCards = creditCardsQuery.data || [];

  useEffect(() => {
    if (open) reset({
      type: "expense",
      paymentMethod: "pix",
      person: (currentUser === "Igor" || currentUser === "Giovana")
        ? currentUser as "Igor" | "Giovana"
        : "Igor",
      isFixed: false,
      date: new Date().toISOString().split("T")[0],
    });
  }, [open, currentUser, reset]);

  const onSubmit = async (data: FormData) => {
    const rawAmount = data.amount.replace(",", ".");
    const parsed = parseFloat(rawAmount);
    if (isNaN(parsed)) return;

    await createMutation.mutateAsync({
      description: data.description,
      amount: parsed.toFixed(2),
      type: data.type,
      paymentMethod: data.paymentMethod,
      creditCardId: data.creditCardId,
      categoryId: data.categoryId,
      person: data.person,
      isFixed: data.isFixed,
      date: data.date,
      month: data.date.slice(0, 7),
    });
  };

  if (!open) return null;

  const dialogContent = (
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full"
      style={{
        borderRadius: isMobile ? "20px 20px 0 0" : "20px",
        maxWidth: isMobile ? "100%" : "440px",
        maxHeight: isMobile ? "90vh" : "auto",
        overflowY: "auto",
      }}
    >
      {/* Drag handle no mobile */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "#D1D5DB" }} />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#E5E7EB" }}>
        <h2 className="text-base font-bold text-gray-900">Novo lançamento</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X size={18} style={{ color: "#6B7280" }} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
        {/* Tipo */}
        <div className="grid grid-cols-2 gap-2">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue("type", t)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all"
              style={{
                borderColor: type === t
                  ? (t === "income" ? "#16A34A" : "#DC2626")
                  : "#E5E7EB",
                background: type === t
                  ? (t === "income" ? "#DCFCE7" : "#FEE2E2")
                  : "transparent",
                color: type === t
                  ? (t === "income" ? "#15803D" : "#B91C1C")
                  : "#9CA3AF",
              }}
            >
              {t === "income" ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {t === "income" ? "Receita" : "Despesa"}
            </button>
          ))}
        </div>

        {/* Descrição */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">
            Descrição
          </label>
          <input
            {...register("description")}
            placeholder="Ex: Supermercado, Salário..."
            className="w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-300"
            style={{
              borderColor: errors.description ? "#DC2626" : "#E5E7EB",
              background: "#FAFAFA",
            }}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Valor */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">
            Valor (R$)
          </label>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold"
              style={{ color: "#9CA3AF" }}
            >
              R$
            </span>
            <input
              {...register("amount")}
              placeholder="0,00"
              inputMode="decimal"
              className="w-full rounded-xl border pl-10 pr-4 py-3 text-sm font-medium text-gray-900"
              style={{
                borderColor: errors.amount ? "#DC2626" : "#E5E7EB",
                background: "#FAFAFA",
              }}
            />
          </div>
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Método de pagamento */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">
            Forma de pagamento
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["pix", "creditCard"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setValue("paymentMethod", m)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                style={{
                  borderColor: paymentMethod === m ? "#FF6600" : "#E5E7EB",
                  background: paymentMethod === m ? "#FFF0E6" : "transparent",
                  color: paymentMethod === m ? "#FF6600" : "#9CA3AF",
                }}
              >
                {m === "pix" ? <Smartphone size={15} /> : <CreditCard size={15} />}
                {m === "pix" ? "Pix" : "Cartão"}
              </button>
            ))}
          </div>
        </div>

        {/* Seleção de cartão */}
        {paymentMethod === "creditCard" && creditCards.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">
              Cartão
            </label>
            <select
              {...register("creditCardId", { valueAsNumber: true })}
              className="w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900"
              style={{ borderColor: "#E5E7EB", background: "#FAFAFA" }}
            >
              <option value="">Selecione um cartão</option>
              {creditCards.map((card: any) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Pessoa */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">
            Responsável
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["Igor", "Giovana"] as const).map((p) => {
              const person = watch("person");
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue("person", p)}
                  className="py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                  style={{
                    borderColor: person === p ? "#2563EB" : "#E5E7EB",
                    background: person === p ? "#DBEAFE" : "transparent",
                    color: person === p ? "#1D4ED8" : "#9CA3AF",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block uppercase tracking-wide">
            Data
          </label>
          <input
            {...register("date")}
            type="date"
            className="w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900"
            style={{ borderColor: "#E5E7EB", background: "#FAFAFA" }}
          />
        </div>

        {/* Fixo */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              {...register("isFixed")}
              className="sr-only peer"
            />
            <div
              className="w-10 h-6 rounded-full transition-all peer-checked:bg-orange-500"
              style={{ background: "#E5E7EB" }}
            />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-all peer-checked:translate-x-4" />
          </div>
          <span className="text-sm font-medium text-gray-700">Lançamento fixo (recorrente)</span>
        </label>

        {/* Botão submit */}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="btn-inter w-full mt-2"
          style={{ borderRadius: "14px", padding: "15px" }}
        >
          {createMutation.isPending ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando...
            </span>
          ) : (
            "Registrar lançamento"
          )}
        </button>

        {createMutation.isError && (
          <p className="text-red-500 text-sm text-center">
            Erro ao salvar. Tente novamente.
          </p>
        )}
      </form>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      >
        <div className="w-full animate-slideUp">{dialogContent}</div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div className="w-full max-w-sm animate-scaleIn">{dialogContent}</div>
    </div>
  );
}
