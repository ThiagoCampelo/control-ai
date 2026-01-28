import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AgentDialog } from "@/components/dashboard/agent-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteAgent } from "@/app/dashboard/agents/actions"

export default async function AgentsPage() {
    const supabase = await createClient()

    // 1. Auth & Company
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', user.id)
        .single()

    const isMaster = profile?.role === 'master_admin'

    if (!profile?.company_id && !isMaster) redirect('/dashboard')

    // 2. Fetch Company Plan (for Allowed Models)
    let allowedModels: string[] = []

    if (isMaster) {
        // Master Admin has access to all metadata models
        allowedModels = [
            'openai:gpt-4o',
            'openai:gpt-4o-mini',
            'openai:gpt-4.1',
            'openai:gpt-4.1-mini',
            'anthropic:opus',
            'anthropic:sonnet',
            'anthropic:haiku'
        ]
    } else {
        const { data: company } = await supabase
            .from('companies')
            .select(`
            plan:plans (
                limits
            )
        `)
            .eq('id', profile?.company_id)
            .single()

        // @ts-ignore
        allowedModels = company?.plan?.limits?.allowed_models || []
    }

    // 3. Fetch Agents
    const { data: agents } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Agentes IA</h2>
                    <p className="text-muted-foreground">Crie e gerencie as personalidades da sua IA.</p>
                </div>

                <AgentDialog allowedModels={allowedModels} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Meus Agentes</CardTitle>
                    <CardDescription>Estes agentes estarão disponíveis para sua equipe no chat.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Modelo</TableHead>
                                <TableHead>Prompt de Sistema</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {agents?.map((agent) => (
                                <TableRow key={agent.id}>
                                    <TableCell className="font-medium">{agent.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{agent.model}</Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-muted-foreground text-sm" title={agent.prompt_system}>
                                        {agent.prompt_system}
                                    </TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        <AgentDialog agent={agent} allowedModels={allowedModels} />

                                        <form action={async () => {
                                            'use server'
                                            await deleteAgent(agent.id)
                                        }}>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!agents || agents.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                        Nenhum agente personalizado criado. Comece criando um!
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
