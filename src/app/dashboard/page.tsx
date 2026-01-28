import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, Zap, Users, ShieldCheck, TrendingUp, DollarSign, CreditCard, Bot, Building2, ArrowUpRight } from "lucide-react"
import { stripe } from "@/utils/stripe"
import { formatCurrency, formatNumber } from "@/utils/format"

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  description: string;
  trend?: boolean;
  premium?: boolean;
}

function StatCard({ title, value, icon: Icon, description, trend, premium }: StatCardProps) {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${premium ? 'border-primary/20 bg-linear-to-br from-primary/5 to-transparent' : 'border-border'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${premium ? 'bg-primary/10' : 'bg-muted'}`}>
          <Icon className={`h-4 w-4 ${premium ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black tracking-tight">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend && <ArrowUpRight className="w-3 h-3 text-green-500" />}
          <p className="text-[10px] text-muted-foreground font-medium uppercase">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, companies(name, plan_id, plans(name))')
    .eq('id', user?.id)
    .single()

  const companyId = profile?.company_id
  const companyData = profile?.companies as any
  const planName = companyData?.plans?.name || 'Gratuito'
  // Fix: Prioritize auth metadata for robust role check
  const isMaster = user?.user_metadata?.role === 'master_admin' || profile?.role === 'master_admin'

  // Métras de Demonstração (Reais) - IDs fixos do ambiente
  const DEMO_PLAN_ID = '5f62631b-6ad0-464f-b708-58cf1620743a'
  const DEMO_USER_ID = '59f2c478-445d-452b-8078-4af6cde9c254'

  // Fetch metrics data
  const results = await Promise.all([
    isMaster
      ? supabase.from('chat_sessions').select('*', { count: 'exact', head: true })
      : supabase.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('company_id', companyId),

    isMaster
      ? supabase.from('profiles').select('*', { count: 'exact', head: true })
      : supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', companyId),

    isMaster
      ? supabase.rpc('get_total_tokens')
      : Promise.resolve({ data: 0 }), // TODO: Create get_company_tokens(id) for tenants later

    isMaster
      ? supabase.from('ai_agents').select('*', { count: 'exact', head: true })
      : Promise.resolve({ count: 0 }),

    isMaster
      ? supabase.from('companies').select('*, plans(name)').order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),

    isMaster
      ? stripe.subscriptions.list({ status: 'active', expand: ['data.plan.product'] })
      : Promise.resolve({ data: [] }),

    // Métricas extras para Master: Acessos Demo e Conversões
    isMaster
      ? supabase.from('audit_logs').select('*', { count: 'exact', head: true }).eq('user_id', DEMO_USER_ID)
      : Promise.resolve({ count: 0 }),
    isMaster
      ? supabase.from('companies').select('*', { count: 'exact', head: true }).not('plan_id', 'eq', DEMO_PLAN_ID)
      : Promise.resolve({ count: 0 })
  ])

  const statsResult = results[0] as any
  const usersResult = results[1] as any
  const tokensResult = results[2] as any // Was logsResult
  const agentsResult = results[3] as any
  const companiesResult = results[4] as any
  const subscriptionsResult = results[5] as any
  const demoLogsResult = results[6] as any
  const conversionsResult = results[7] as any

  const totalConversations = statsResult.count || 0
  const totalMembers = usersResult.count || 0
  const totalTokens = tokensResult.data || 0
  const demoCount = demoLogsResult?.count || 0
  const conversionCount = conversionsResult?.count || 0

  // Master only metrics logic
  let mrr = 0
  let arr = 0
  let totalAgents = 0
  let totalCompanies = 0
  let activeSubs = 0
  const planCounts: Record<string, number> = {}

  if (isMaster && subscriptionsResult && companiesResult) {
    totalAgents = agentsResult?.count || 0
    totalCompanies = (companiesResult as any).data?.length || 0
    activeSubs = (subscriptionsResult as any).data.length

      ; (subscriptionsResult as any).data.forEach((sub: any) => {
        const item = sub.items.data[0]
        const price = item.price
        const amount = (price.unit_amount || 0) / 100
        const quantity = item.quantity || 1

        if (price.recurring?.interval === 'month') {
          mrr += amount * quantity
        } else if (price.recurring?.interval === 'year') {
          mrr += (amount / 12) * quantity
        }
      })
    arr = mrr * 12

      ; (companiesResult as any).data?.forEach((c: any) => {
        const pName = (c.plans as any)?.name || 'Sem Plano'
        planCounts[pName] = (planCounts[pName] || 0) + 1
      })
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-primary/20 to-violet-500/20 blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex justify-between items-center p-6 bg-background/50 backdrop-blur-xl border border-primary/10 rounded-2xl">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {isMaster ? 'Global Analytics' : 'Visão Geral'}
            </h2>
            <p className="text-muted-foreground font-medium italic">
              {isMaster
                ? 'Consolidado da infraestrutura ControlAI'
                : `Performance do tenant ${companyData?.name}`}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            {isMaster ? 'Master Admin' : `Plano ${planName}`}
          </div>
        </div>
      </div>

      {isMaster ? (
        <div className="space-y-10">
          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-1 text-muted-foreground">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Financeiro
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="MRR"
                value={formatCurrency(mrr)}
                icon={DollarSign}
                description="Receita Mensal Recorrente"
                premium
              />
              <StatCard
                title="ARR Proj."
                value={formatCurrency(arr)}
                icon={TrendingUp}
                description="Previsão de Faturamento Anual"
                premium
              />
              <StatCard
                title="Assinantes"
                value={activeSubs}
                icon={CreditCard}
                description="Empresas com plano pago"
                premium
              />
              <StatCard
                title="Conversão"
                value={`${totalCompanies ? ((activeSubs / totalCompanies) * 100).toFixed(1) : 0}%`}
                icon={Zap}
                description="Assinantes vs Total"
                premium
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-1 text-muted-foreground">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              Ambiente de Demonstração
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-blue-950/20 border-blue-800/30">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-400">Acessos Demo</CardTitle>
                  <Users className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-bold">Total de Logs</span>
                      <div className="text-2xl font-bold font-mono text-blue-400">
                        {demoCount}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 font-medium">Interações do usuário demo</p>
                </CardContent>
              </Card>

              <StatCard
                title="Conversão Premium"
                value={String(conversionCount)}
                icon={TrendingUp}
                trend={conversionCount > 0}
                description="Empresas em planos pagos"
              />

              <div className="flex flex-col p-4 rounded-2xl border bg-blue-900/10 border-blue-500/20 shadow-sm justify-center">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Gestão Global</span>
                <div className="mt-2">
                  <Link href="/dashboard/admin" className="text-sm font-medium text-blue-300 hover:text-blue-200 flex items-center gap-1 group">
                    Ir para Administração <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-1 text-muted-foreground">
              <span className="w-1.5 h-6 bg-violet-500 rounded-full"></span>
              Operacional
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatCard
                title="Empresas"
                value={totalCompanies}
                icon={Building2}
                description="Total de Tenants"
              />
              <StatCard
                title="Usuários"
                value={totalMembers}
                icon={Users}
                description="Membros Ativos"
              />
              <StatCard
                title="Agentes"
                value={totalAgents}
                icon={Bot}
                description="IAs Configuradas"
              />
              <StatCard
                title="Mensagens"
                value={formatNumber(totalConversations)}
                icon={MessageSquare}
                description="Interações Totais"
              />
              <StatCard
                title="Tokens"
                value={formatNumber(totalTokens)}
                icon={Zap}
                description="Consumo Global"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-1 text-muted-foreground">
              <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
              Segmentação de Clientes
            </h3>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {Object.entries(planCounts).map(([name, count]) => (
                <div key={name} className="flex flex-col p-4 rounded-2xl border bg-card hover:bg-muted/50 transition-colors shadow-sm">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{name}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black">{count}</span>
                    <span className="text-[10px] text-muted-foreground">orgs</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total de Conversas"
            value={formatNumber(totalConversations)}
            icon={MessageSquare}
            description="Interações com agentes IA"
            trend={totalConversations > 0}
          />
          <StatCard
            title="Tokens Consumidos"
            value={formatNumber(totalTokens)}
            icon={Zap}
            description="Volume de processamento LLM"
            trend={totalTokens > 0}
          />
          <StatCard
            title="Equipe Ativa"
            value={totalMembers}
            icon={Users}
            description="Usuários cadastrados"
          />
        </div>
      )}

      {!isMaster && (
        <Card className="bg-linear-to-br from-primary/5 via-background to-background border-primary/20 overflow-hidden group">
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Bot className="w-32 h-32" />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-black tracking-tight">Potencialize seu time com IA</h3>
                <p className="text-sm text-balance text-muted-foreground font-medium max-w-md">
                  Automatize o atendimento, análise dados em segundos e escale sua operação com segurança total.
                </p>
              </div>
              <div className="flex gap-3 shrink-0">
                <a href="/dashboard/chat">
                  <button className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/25">
                    Abrir Chat IA
                  </button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
