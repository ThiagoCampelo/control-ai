import { createClient } from "@/utils/supabase/server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, AlertTriangle } from "lucide-react"

export default async function AuditPage() {
  const supabase = await createClient()

  // 1. Verifica Permissão (Apenas Admins)
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user?.id)
    .single()

  if (profile?.role === 'employee') {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        <AlertTriangle className="w-12 h-12 mb-4 text-yellow-500" />
        <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
        <p>Apenas administradores podem visualizar os logs de auditoria.</p>
      </div>
    )
  }

  // 2. Busca os Logs da Empresa
  // Graças ao RLS, não precisamos filtrar manualmente no WHERE, 
  // mas é boa prática garantir o company_id.
  const { data: logs } = await supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      created_at,
      details,
      profiles ( full_name, email )
    `)
    .eq('company_id', profile?.company_id)
    .order('created_at', { ascending: false })
    .limit(50) // Limita aos últimos 50 eventos para performance

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h2>
        <Badge variant="outline" className="gap-2 px-3 py-1">
          <ShieldCheck className="w-4 h-4 text-green-600" />
          Auditoria Ativa
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Atividades</CardTitle>
          <CardDescription>
            Rastreamento completo de uso de IA e ações administrativas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium text-foreground">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {/* @ts-ignore - Supabase join typing can be tricky */}
                        {log.profiles?.full_name || 'Usuário Desconhecido'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {/* @ts-ignore */}
                        {log.profiles?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {log.action.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {/* Exibe o modelo se estiver disponível nos detalhes */}
                    {/* @ts-ignore */}
                    {log.details?.model || '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {/* @ts-ignore */}
                    {log.details?.tokens_used || 0}
                  </TableCell>
                </TableRow>
              ))}

              {(!logs || logs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}