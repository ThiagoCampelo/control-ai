import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // 1. Verifica Autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/login')
    }

    // 2. Busca o Perfil
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, company_id, is_active')
        .eq('id', user.id)
        .single()

    // Se o usuário estiver inativo ou não existir
    if (!profile || profile.is_active === false) {
        await supabase.auth.signOut()
        redirect('/login?error=account_blocked')
    }

    // 3. Busca Empresa
    let companyName = 'Minha Empresa'
    let trialEndsAt: string | null = null
    let currentPlanId: string | null = null

    if (profile.company_id) {
        const { data: companyData, error: companyError } = await supabase
            .from('companies')
            .select('name, is_active, trial_ends_at, plan_id')
            .eq('id', profile.company_id)
            .single()

        if (companyData) {
            // Verifica bloqueio da empresa (exceto para master_admin)
            if (companyData.is_active === false && profile.role !== 'master_admin') {
                await supabase.auth.signOut()
                redirect('/login?error=company_blocked')
            }

            companyName = companyData.name || 'Minha Empresa'
            trialEndsAt = companyData.trial_ends_at
            currentPlanId = companyData.plan_id
        }
    }

    // Prioridade para o metadata da autenticação (que gravamos no banco)
    // Isso evita problemas se o RLS da tabela profiles falhar
    const userRole = user.user_metadata?.role || profile.role || 'employee'

    // Override visual do nome da empresa para Master Admin
    if (userRole === 'master_admin') {
        companyName = 'Control AI (Master)'
    }

    // Se tem plan_id, consideramos que tem um plano ativo (pago ou free legacy).
    // Se não tem plan_id e tem trial_ends_at, é trial.
    const hasActivePlan = !!currentPlanId

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Sidebar Fixa (Desktop) */}
            <aside className="hidden md:flex h-full sticky top-0">
                <Sidebar userRole={userRole} trialEndsAt={trialEndsAt} hasActivePlan={hasActivePlan} />
            </aside>

            {/* Área de Conteúdo Principal */}
            <main className="flex-1 flex flex-col min-w-0 h-full">

                {/* Header Fixo Desktop/Mobile */}
                <header className="flex h-16 items-center justify-between border-b px-4 md:px-6 bg-background/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-2">

                        {/* Mobile Sidebar (Restored) */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="mr-2">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 bg-sidebar w-64 border-r border-sidebar-border">
                                    <Sidebar userRole={userRole} trialEndsAt={trialEndsAt} hasActivePlan={hasActivePlan} className="border-none w-full" />
                                </SheetContent>
                            </Sheet>
                        </div>
                        <h1 className="font-semibold text-lg truncate pr-4">{companyName}</h1>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <ThemeToggle />
                        <div className="text-sm hidden sm:block text-muted-foreground font-medium">
                            Bem-vindo, {profile.full_name}
                        </div>
                    </div>
                </header>

                {/* Área de Conteúdo Rolável */}
                <div className="flex-1 overflow-y-auto bg-muted/40 custom-scrollbar">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}