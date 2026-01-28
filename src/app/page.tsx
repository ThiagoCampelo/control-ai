"use client"

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { FeatureItem } from "@/components/feature-item";
import { PricingSection } from "@/components/pricing-section";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors duration-300">
      {/* HEADER / NAV */}
      <header className="px-6 h-16 flex items-center justify-between border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Logo />
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Funcionalidades</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Preços</Link>
          <Link href="#security" className="hover:text-foreground transition-colors">Segurança</Link>
        </nav>
        <div className="flex gap-2 items-center">
          <div className="hidden md:flex gap-2 items-center">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Criar Conta Grátis</Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-6 mt-6">
                  <nav className="flex flex-col gap-4 text-base font-medium text-muted-foreground">
                    <Link href="#features" className="hover:text-foreground transition-colors">Funcionalidades</Link>
                    <Link href="#pricing" className="hover:text-foreground transition-colors">Preços</Link>
                    <Link href="#security" className="hover:text-foreground transition-colors">Segurança</Link>
                  </nav>
                  <div className="flex flex-col gap-2">
                    <Link href="/login" className="w-full">
                      <Button variant="ghost" className="w-full justify-start">Entrar</Button>
                    </Link>
                    <Link href="/register" className="w-full">
                      <Button className="w-full">Criar Conta Grátis</Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="py-24 md:py-32 px-6 text-center max-w-5xl mx-auto space-y-8">
          <div className="space-y-4">
            <Badge variant="outline" className="px-4 py-1 border-primary/20 text-primary bg-primary/5 rounded-full text-sm font-medium uppercase tracking-wider mb-4 animate-in fade-in zoom-in duration-500">
              Disponível para Empresas
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Domine a IA Corporativa com <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-indigo-500">Privacidade Absoluta</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Elimine o risco de vazamento de dados. Ofereça aos seus colaboradores o poder do GPT-4 e Claude em um ambiente 100% monitorado, criptografado e auditável.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all rounded-full">
                Começar Gratuitamente
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-muted-foreground/20 hover:bg-muted/50 rounded-full">
                Ver Funcionalidades
              </Button>
            </Link>
          </div>

          {/* Demo Access Button */}
          <div className="pt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/login?demo=true">
              <Button size="lg" variant="secondary" className="group h-12 px-8 text-base shadow-lg hover:shadow-primary/20 transition-all rounded-full border border-primary/10">
                <span className="mr-2">🚀</span>
                Acessar Demonstração Ao Vivo
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </Link>
            <p className="text-[10px] text-muted-foreground mt-3 uppercase tracking-widest font-medium opacity-70">
              Sem cadastro • Acesso Imediato
            </p>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="py-24 bg-muted/30 px-6 border-y border-border/40">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight">Segurança de Nível Bancário</h2>
              <p className="text-lg text-muted-foreground">
                Projetado para CTOs e CISOs que exigem controle total. Sua infraestrutura de IA, suas regras.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="bg-background/60 backdrop-blur-sm border-muted-foreground/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center text-2xl mb-4">🔒</div>
                  <CardTitle className="text-2xl">Isolamento Multi-tenant</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Seus dados nunca tocam o ambiente de outras empresas. Implementação rigorosa de RLS (Row Level Security) garante que cada bit de informação permaneça exclusivamente seu.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="bg-background/60 backdrop-blur-sm border-muted-foreground/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-14 h-14 bg-violet-500/10 text-violet-500 rounded-2xl flex items-center justify-center text-2xl mb-4">🔑</div>
                  <CardTitle className="text-2xl">Modelo BYOK Real</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    "Bring Your Own Key". Conecte diretamente suas chaves da OpenAI ou Anthropic. Não atuamos como intermediários opacos; você paga apenas pelo gerenciamento e segurança.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="bg-background/60 backdrop-blur-sm border-muted-foreground/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center text-2xl mb-4">👁️</div>
                  <CardTitle className="text-2xl">Observabilidade Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Saiba exatamente quem está usando a IA, para quê e quanto está custando. Logs de auditoria imutáveis e painéis de controle granulares para conformidade e governança.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="py-24 px-6">
          <div className="max-w-5xl mx-auto text-center space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">Investimento Transparente</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Escalável do startup ao enterprise. Sem custos ocultos, sem fidelidade forçada.
              </p>
            </div>

            <PricingSection mode="landing" />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-8 border-t text-center text-muted-foreground text-sm transition-colors duration-300">
        <p>&copy; {new Date().getFullYear()} ControlAI. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
