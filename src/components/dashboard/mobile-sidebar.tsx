"use client"

import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Button } from "@/components/ui/button"

interface MobileSidebarProps {
    userRole: string;
}

export function MobileSidebar({ userRole }: MobileSidebarProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-0 w-72 bg-sidebar text-sidebar-foreground">
                {/* Hidden accessible title for screen readers */}
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                <SheetDescription className="sr-only">Navegação principal do sistema</SheetDescription>

                <Sidebar userRole={userRole} className="w-full h-full border-none" />
            </SheetContent>
        </Sheet>
    )
}
