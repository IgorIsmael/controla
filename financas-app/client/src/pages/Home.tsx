import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Loader2, Lock, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { loading, isAuthenticated, refresh } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const checkAccessQuery = trpc.auth.checkAccess.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      setFormError(null);
      await utils.auth.me.invalidate();
      await refresh();
    },
    onError: (err) => setFormError(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      setFormError(null);
      await utils.auth.me.invalidate();
      await refresh();
    },
    onError: (err) => setFormError(err.message),
  });

  const isSubmitting = loginMutation.isPending || registerMutation.isPending;

  useEffect(() => {
    if (checkAccessQuery.data?.authorized) {
      setLocation("/dashboard");
    }
  }, [checkAccessQuery.data, setLocation]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (mode === "login") {
      loginMutation.mutate({ email, password });
    } else {
      registerMutation.mutate({ name, email, password });
    }
  }

  // Loading state
  if (loading || (isAuthenticated && checkAccessQuery.isLoading)) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "#F3F4F6" }}
      >
        <div
          className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin mb-4"
          style={{ borderColor: "#FF6600", borderTopColor: "transparent" }}
        />
        <p className="text-sm font-medium text-gray-500">Carregando...</p>
      </div>
    );
  }

  // Acesso negado
  if (isAuthenticated && checkAccessQuery.data && !checkAccessQuery.data.authorized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#F3F4F6" }}
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center animate-scaleIn">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 bg-red-50">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-500 text-sm mb-1">
            {checkAccessQuery.data.message}
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Entre em contato com o administrador.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "#F3F4F6", color: "#374151" }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Redirecionando
  if (isAuthenticated && checkAccessQuery.data?.authorized) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F3F4F6" }}
      >
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: "#FF6600" }} />
          <p className="text-sm font-medium text-gray-500">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Tela principal de login / criar conta
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#F3F4F6" }}
    >
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full animate-scaleIn">
        {/* Logo */}
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#FF6600" }}
          >
            <Wallet size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Finanças</h1>
          <p className="text-gray-400 text-sm">Controle financeiro compartilhado</p>
        </div>

        <p className="text-gray-600 text-sm text-center mb-6 leading-relaxed">
          Acesso exclusivo para{" "}
          <strong className="text-gray-900">Igor</strong> e{" "}
          <strong className="text-gray-900">Giovana</strong>.
        </p>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "login" | "register");
            setFormError(null);
          }}
          className="mb-5"
        >
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Criar conta</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Igor ou Giovana"
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={mode === "register" ? 6 : undefined}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-inter w-full text-base disabled:opacity-60"
            style={{ borderRadius: "14px", padding: "15px" }}
          >
            {isSubmitting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Lock size={17} />
            )}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          {mode === "login"
            ? 'Ainda não tem conta? Use a aba "Criar conta".'
            : "Só e-mails autorizados podem criar conta."}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
        <Lock size={11} />
        <span>Conexão segura</span>
      </div>
    </div>
  );
}
