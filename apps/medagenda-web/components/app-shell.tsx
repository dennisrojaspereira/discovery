"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  CalendarClock,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
} from "lucide-react";
import { type ReactNode } from "react";
import { RequireAuth, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agendamentos", label: "Agendamentos", icon: CalendarCheck },
  { href: "/medicos", label: "Médicos", icon: Stethoscope },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/especialidades", label: "Especialidades", icon: HeartPulse },
  { href: "/disponibilidade", label: "Disponibilidade", icon: CalendarClock },
] as const;

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administração",
  RECEPCAO: "Recepção",
  MEDICO: "Médico(a)",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="flex items-center gap-2 px-5 py-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartPulse size={20} />
            </span>
            <div>
              <div className="font-semibold leading-tight">MedAgenda</div>
              <div className="text-xs text-muted-foreground">
                Rede Clínicas Vida+
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4">
            <div className="mb-2 text-sm font-medium">{user?.name}</div>
            <div className="mb-3 text-xs text-muted-foreground">
              {user ? (ROLE_LABEL[user.role] ?? user.role) : ""}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive"
            >
              <LogOut size={15} /> Sair
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barra móvel */}
          <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
            <div className="flex items-center gap-2 font-semibold">
              <HeartPulse size={18} className="text-primary" /> MedAgenda
            </div>
            <button onClick={logout} aria-label="Sair">
              <LogOut size={17} className="text-muted-foreground" />
            </button>
          </header>
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-1 md:hidden">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium",
                  (href === "/" ? pathname === "/" : pathname.startsWith(href))
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <main className="flex-1 p-4 md:p-8">{children}</main>
          <footer className="px-8 pb-4 text-xs text-muted-foreground">
            Ambiente de demonstração — todos os dados são fictícios.
          </footer>
        </div>
      </div>
    </RequireAuth>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
