import { createClient } from "@/utils/supabase/server"
import { PricingSection } from "@/components/pricing-section"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldCheck, CreditCard } from "lucide-react"
import { PlanDialog } from "@/components/dashboard/plan-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function SubscriptionPage() {
  const supabase = await createClient()

  // Busca dados do usuário para identificar a empresa e o plano atual
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, email, role, companies(plan_id, plans(name))')
    .eq('id', user?.id)
    .single()

  const isMaster = profile?.role === 'master_admin';
  const currentPlanId = (profile?.companies as any)?.plan_id;

  // Se for master, buscamos todos os planos para o gerenciamento
  let allPlans: any[] = []
  if (isMaster) {
    const { data } = await supabase.from('plans').select('*').order('name')
    allPlans = data || []
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {isMaster ? 'Gerenciamento de Planos' : 'Minha Assinatura'}
        </h2>
        <p className="text-muted-foreground">
          {isMaster
            ? 'Controle os produtos, preços e limites oferecidos pela plataforma.'
            : 'Escolha o plano ideal para a escala da sua empresa.'}
        </p>
      </div>


      {/* Se o plano for o Demo, tratamos como se não tivesse plano (para incentivar upgrade) */}
      {isMaster ? (
        <div className="space-y-6">
          <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-background to-background">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Licença Master AI</CardTitle>
                  <CardDescription>Acesso administrativo global e gestão de produtos.</CardDescription>
                </div>
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Planos Disponíveis</CardTitle>
                <CardDescription>Configure como seus clientes assinam a plataforma.</CardDescription>
              </div>
              <PlanDialog />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead>Stripe IDs</TableHead>
                    <TableHead>Usabilidade</TableHead>
                    <TableHead>Modelos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPlans.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.name}</TableCell>
                      <TableCell>
                        <div className="text-[10px] font-mono opacity-70">M: {p.price_id_stripe || 'n/a'}</div>
                        <div className="text-[10px] font-mono opacity-70">A: {p.price_id_annual || 'n/a'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">Usuários: {p.limits?.max_users === -1 ? '∞' : p.limits?.max_users}</div>
                        <div className="text-xs">Tokens: {p.limits?.max_tokens === -1 ? '∞' : (p.limits?.max_tokens / 1000) + 'k'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.limits?.allowed_models?.slice(0, 3).map((m: string) => (
                            <Badge key={m} variant="secondary" className="text-[9px] px-1 py-0 h-4">
                              {m.replace('gpt-', '').replace('claude-', '')}
                            </Badge>
                          ))}
                          {(p.limits?.allowed_models?.length || 0) > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{p.limits.allowed_models.length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <PlanDialog plan={p} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <PricingSection
          mode="dashboard"
          companyId={profile?.company_id}
          userEmail={profile?.email}
          // Se o nome do plano for 'Enterprise Demo', passamos null para forçar a UI de assinatura
          currentPlanId={(profile?.companies as any)?.plans?.name === 'Enterprise Demo' ? null : currentPlanId}
        />
      )}

      <div className="mt-8 p-4 bg-muted/20 rounded-lg border border-dashed text-sm text-center text-muted-foreground">
        <p>Precisa de um plano customizado para uma empresa específica? Use a aba de Empresas no painel Administrativo.</p>
      </div>
    </div>
  )
}
