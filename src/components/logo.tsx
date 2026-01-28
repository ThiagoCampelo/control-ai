
import { Hexagon } from "lucide-react"

/**
 * Componente de Logo da Aplicação.
 * Exibe o ícone e o nome "ControlAI".
 */
export function Logo({ className }: { className?: string }) {
    return (
        <div className={`flex items-center gap-2 font-bold text-xl ${className}`}>
            <div className="flex items-center justify-center p-1 rounded-lg bg-primary text-primary-foreground">
                <Hexagon className="h-6 w-6 fill-current" strokeWidth={1.5} />
            </div>
            <span className="tracking-tight">ControlAI</span>
        </div>
    )
}
