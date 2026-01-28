import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InviteUserDialog } from "@/components/dashboard/invite-user-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanyDialog } from "@/components/dashboard/company-dialog"
import { Button } from "@/components/ui/button"
import { Power, PowerOff, UserMinus, UserCheck, ShieldCheck } from 'lucide-react'
import { toggleCompanyStatus, toggleUserStatus } from "./actions"

// Interfaces de Tipo para Respostas do Banco
interface CompanyWithDetails {
  id: string
  name: string
  plan_id: string
  is_active?: boolean
  created_at: string
  plans: { name: string } | { name: string }[] | null // Supabase pode retornar array ou obj
  profiles: { count: number }[] | null
}

interface ProfileWithDetails {
  id: string
  full_name: string
  email: string
  role: string
  is_active?: boolean
  companies: { name: string } | { name: string }[] | null
}

function RoleBadge({ role }: { role: string }) {
  const configs: Record<string, { label: string, className: string }> = {
    master_admin: {
      label: "Master",
      className: "bg-violet-500/10 text-violet-500 border-violet-500/20 hover:bg-violet-500/20"
    },
    tenant_admin: {
      label: "Admin",
      className: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
    },
    employee: {
      label: "Membro",
      className: "bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20"
    }
  }

  const config = configs[role] || { label: role, className: "" }

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}

/**
 * Página Principal de Administração.
 * Renderiza view diferente dependendo se é Master Admin ou Tenant Admin.
 */
export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Verificação de Segurança
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const isMaster = profile?.role === 'master_admin'

  // Se não for admin nenhum, chuta
  if (profile?.role !== 'master_admin' && profile?.role !== 'tenant_admin') {
    return redirect('/dashboard')
  }

  // --- VIEW PARA MASTER ADMIN (Gestão Global) ---
  if (isMaster) {
    const [{ data: companiesData }, { data: allUsersData }, { data: allPlans }] = await Promise.all([
      supabase.from('companies').select('*, plans(name), profiles(count)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*, companies(name)').order('created_at', { ascending: false }),
      supabase.from('plans').select('id, name').order('name')
    ])

    const companies = (companiesData || []) as unknown as CompanyWithDetails[]
    const allUsers = (allUsersData || []) as unknown as ProfileWithDetails[]
    const plans = allPlans || []

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de Empresas</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{companies.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Usuários Globais</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allUsers.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="companies" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tenants Ativos</CardTitle>
                <CardDescription>Gerencie todas as organizações cadastradas.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => {
                      // Safe Accessors
                      const planName = Array.isArray(company.plans) ? company.plans[0]?.name : company.plans?.name
                      const userCount = Array.isArray(company.profiles) ? company.profiles[0]?.count : 0

                      return (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {planName || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>{userCount || 0}</TableCell>
                          <TableCell>
                            <Badge variant={company.is_active !== false ? 'default' : 'destructive'} className={company.is_active !== false ? 'bg-green-500 hover:bg-green-600' : ''}>
                              {company.is_active !== false ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <CompanyDialog company={company} plans={plans} />
                            <form action={async () => {
                              'use server'
                              await toggleCompanyStatus(company.id, company.is_active !== false)
                            }}>
                              <Button variant="ghost" size="icon" title={company.is_active !== false ? "Inativar" : "Ativar"}>
                                {company.is_active !== false ? <PowerOff className="h-4 w-4 text-orange-500" /> : <Power className="h-4 w-4 text-green-500" />}
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Usuários</CardTitle>
                <CardDescription>Controle de acesso global de usuários.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((u) => {
                      const companyName = Array.isArray(u.companies) ? u.companies[0]?.name : u.companies?.name
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="font-medium">{u.full_name || 'Sem nome'}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </TableCell>
                          <TableCell>{companyName || 'N/A'}</TableCell>
                          <TableCell>
                            <RoleBadge role={u.role} />
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.is_active !== false ? 'default' : 'destructive'} className={u.is_active !== false ? 'bg-green-500 hover:bg-green-600' : ''}>
                              {u.is_active !== false ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right flex justify-end gap-2">
                            <form action={async () => {
                              'use server'
                              await toggleUserStatus(u.id, u.is_active !== false)
                            }}>
                              <Button variant="ghost" size="icon" title={u.is_active !== false ? "Bloquear" : "Desbloquear"}>
                                {u.is_active !== false ? <UserMinus className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                              </Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // --- VIEW PARA TENANT ADMIN (Sua Equipe) ---
  const { data: employees } = await supabase
    .from('profiles')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gerenciar Equipe</h2>
        <InviteUserDialog />
      </div>

      {/* Demo Access Card for Admin Convenience */}
      {profile.email === 'admin@control.ai' && (
        <Card className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border-blue-500/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-xl">🚀</span>
              <CardTitle className="text-lg text-blue-400">Dados de Acesso (Demo)</CardTitle>
            </div>
            <CardDescription>
              Compartilhe estes dados (ou o Magic Link) para demonstrações rápidas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-6">
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground font-bold">Email</p>
              <code className="text-sm bg-background/50 px-2 py-1 rounded select-all">demo@control.ai</code>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground font-bold">Senha</p>
              <code className="text-sm bg-background/50 px-2 py-1 rounded select-all">demo1234</code>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase text-muted-foreground font-bold">Magic Link</p>
              <code className="text-sm bg-background/50 px-2 py-1 rounded select-all text-blue-400">
                https://control-ai.vercel.app/login?demo=true
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>Gerencie quem tem acesso ao dashboard da sua empresa.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.full_name || 'Sem nome'}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={emp.role} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.is_active !== false ? 'default' : 'destructive'} className={emp.is_active !== false ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {emp.is_active !== false ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
