import Link from "next/link"
import { Logo } from "@/components/logo"
import { LayoutDashboard, MessageSquare, Settings, ShieldAlert, LogOut, Users, CreditCard, Bot } from "lucide-react"
import { signout } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { DevBadge } from "@/components/dev-badge"

/**
 * Componente de Barra Lateral (Sidebar).
 * Exibe a navegação principal baseada no role do usuário.
 * 
 * @param userRole - Papel do usuário atual ('master_admin', 'tenant_admin' ou 'employee').
 */
import { cn } from "@/lib/utils"

/**
 * Componente de Barra Lateral (Sidebar).
 * Exibe a navegação principal baseada no role do usuário.
 * 
 * @param userRole - Papel do usuário atual ('master_admin', 'tenant_admin' ou 'employee').
 * @param className - Classes adicionais para estilização personalizada.
 */
export function Sidebar({ userRole, className }: { userRole: string; className?: string }) {
  return (
    <div className={cn("flex h-screen w-64 flex-col border-r bg-sidebar border-sidebar-border", className)}>
      <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
        <Logo />
        <DevBadge />
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        <p className="px-2 text-xs font-semibold text-muted-foreground mb-2">MENU</p>

        {/* Link Comum a Todos */}
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all">
          <LayoutDashboard className="h-5 w-5" />
          Visão Geral
        </Link>

        {/* Link de Chat (Para todos) */}
        <Link href="/dashboard/chat" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent transition-all">
          <MessageSquare className="h-5 w-5" />
          Chat IA
        </Link>

        {/* Links Apenas para Admins (Tenant ou Master) */}
        {(userRole === 'tenant_admin' || userRole === 'master_admin' || userRole === 'demo_user') && (
          <>
            <p className="px-2 text-xs font-semibold text-muted-foreground mt-6 mb-2">ADMINISTRAÇÃO</p>

            <Link href="/dashboard/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent transition-all">
              <Users className="h-5 w-5" />
              {userRole === 'master_admin' ? 'Gerenciar Empresas' : 'Gerenciar Equipe'}
            </Link>

            <Link href="/dashboard/agents" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent transition-all">
              <Bot className="h-5 w-5" />
              Agentes IA
            </Link>

            {userRole !== 'demo_user' && (
            <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent transition-all">
              <Settings className="h-5 w-5" />
              Configurações
            </Link>
            )}

            <Link href="/dashboard/subscription" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent transition-all">
              <CreditCard className="h-5 w-5" />
              Assinatura
            </Link>

            <Link href="/dashboard/audit" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/70 hover:bg-sidebar-accent transition-all">
              <ShieldAlert className="h-5 w-5" />
              Auditoria & Logs
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <form action={signout}>
          <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </form>
      </div>
    </div>
  )
}