import { Check, X } from "lucide-react";

interface FeatureItemProps {
    children: React.ReactNode;
    active?: boolean;
}

export function FeatureItem({ children, active = false }: FeatureItemProps) {
    return (
        <li className={`flex items-center gap-2 ${active ? "text-foreground" : "text-muted-foreground/50"}`}>
            {active ? (
                <Check className="w-4 h-4 text-primary shrink-0" />
            ) : (
                <X className="w-4 h-4 shrink-0" />
            )}
            {children}
        </li>
    );
}
