import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar"
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

    // 2. Busca o Perfil e Empresa para verificar Status
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, company_id, is_active')
        .eq('id', user.id)
        .single()

    // Se o usuário estiver inativo, bloqueia acesso
    if (profile?.is_active === false) {
        await supabase.auth.signOut()
        redirect('/login?error=account_blocked')
    }

    // Busca dados da empresa e verifica status
    let companyName = 'Minha Empresa'
    if (profile?.company_id) {
        const { data: company } = await supabase
            .from('companies')
            .select('name, is_active')
            .eq('id', profile.company_id)
            .single()

        if (company?.is_active === false && profile.role !== 'master_admin') {
            await supabase.auth.signOut()
            redirect('/login?error=company_blocked')
        }

        if (company?.name) {
            companyName = company.name
        }
    }

    const userRole = profile?.role || 'employee'

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Sidebar Fixa (Desktop) */}
            <aside className="hidden md:flex h-full sticky top-0">
                <Sidebar userRole={userRole} />
            </aside>

            {/* Área de Conteúdo Principal */}
            <main className="flex-1 flex flex-col min-w-0 h-full">
                {/* Header Fixo Desktop/Mobile */}
                <header className="flex h-16 items-center justify-between border-b px-4 md:px-6 bg-background/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-2">
                        <MobileSidebar userRole={userRole} />
                        <h1 className="font-semibold text-lg truncate pr-4">{companyName}</h1>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                        <ThemeToggle />
                        <div className="text-sm hidden sm:block text-muted-foreground font-medium">
                            Bem-vindo, {profile?.full_name}
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