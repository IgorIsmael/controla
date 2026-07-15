import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { redirectToLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  CreditCard,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Settings,
} from "lucide-react";
import { useLocation } from "wouter";

const navItems = [
  { icon: LayoutDashboard, label: "Início", path: "/dashboard" },
  { icon: ListOrdered, label: "Transações", path: "/transacoes" },
  { icon: CreditCard, label: "Cartões", path: "/cartoes" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [location, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#FF6600", borderTopColor: "transparent" }}
          />
          <p className="text-sm font-medium" style={{ color: "#6B7280" }}>
            Carregando...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full mx-4 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "#FFF0E6" }}
          >
            <LayoutDashboard size={28} style={{ color: "#FF6600" }} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
          <p className="text-gray-500 text-sm mb-6">
            Faça login para acessar o controle financeiro.
          </p>
          <button onClick={() => redirectToLogin()} className="btn-inter w-full">
            Entrar
          </button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen pb-safe" style={{ background: "#F3F4F6" }}>
        {/* Header mobile */}
        <header
          className="sticky top-0 z-40 bg-white border-b"
          style={{ borderColor: "#E5E7EB" }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
                Olá, {user.displayName?.split(" ")[0] || "usuário"} 👋
              </p>
              <p className="text-base font-bold text-gray-900">
                Finanças
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: "#F3F4F6", color: "#6B7280" }}
            >
              <LogOut size={13} />
              Sair
            </button>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="px-4 py-4">{children}</main>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`bottom-nav-item ${isActive ? "active" : ""}`}
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? "#FF6600" : "#9CA3AF" }}
                />
                <span style={{ color: isActive ? "#FF6600" : "#9CA3AF" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // Desktop layout com sidebar
  return (
    <div className="flex min-h-screen" style={{ background: "#F3F4F6" }}>
      {/* Sidebar */}
      <aside className="sidebar-inter flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "#FF6600" }}
            >
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-tight">Finanças</p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Controle financeiro
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`sidebar-nav-item w-full ${isActive ? "active" : ""}`}
              >
                <item.icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer com avatar */}
        <div className="p-3 border-t" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <Avatar className="h-9 w-9 border-2" style={{ borderColor: "#FF6600" }}>
              <AvatarFallback
                className="text-xs font-bold text-white"
                style={{ background: "#FF6600" }}
              >
                {user.displayName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {user.displayName || "-"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email || "-"}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              title="Sair"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 ml-60 min-h-screen">
        <main className="p-6 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}
