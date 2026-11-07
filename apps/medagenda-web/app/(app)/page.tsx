"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarX,
  Clock,
  Stethoscope,
} from "lucide-react";
import type { DashboardSummary } from "@medagenda/shared-types";
import { get } from "@/lib/api";
import { formatDateTime, formatTime } from "@/lib/utils";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/alert";

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number | string;
  icon: typeof Clock;
  tone: "primary" | "accent" | "warning" | "destructive";
}) {
  const tones = {
    primary: "bg-secondary text-primary",
    accent: "bg-accent-soft text-accent",
    warning: "bg-warning-soft text-warning",
    destructive: "bg-destructive-soft text-destructive",
  } as const;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${tones[tone]}`}
        >
          <Icon size={22} />
        </span>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-sm text-muted-foreground">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await get<DashboardSummary>("/dashboard/summary"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da clínica em tempo real"
      />
      <ErrorAlert>{error}</ErrorAlert>
      {!data && !error ? (
        <p className="text-muted-foreground">Carregando…</p>
      ) : null}
      {data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Consultas hoje"
              value={data.todayCount}
              icon={CalendarCheck}
              tone="primary"
            />
            <StatCard
              title="Médicos ativos"
              value={data.activeDoctors}
              icon={Stethoscope}
              tone="accent"
            />
            <StatCard
              title="Horários livres hoje"
              value={data.availableSlotsToday}
              icon={Clock}
              tone="warning"
            />
            <StatCard
              title="Cancelamentos na semana"
              value={data.cancelledThisWeek}
              icon={CalendarX}
              tone="destructive"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Consultas do dia</CardTitle>
              </CardHeader>
              <CardContent>
                {data.todayAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma consulta hoje.
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.todayAppointments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div>
                          <div className="font-medium">{a.patient?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.doctor?.name} ·{" "}
                            {a.doctor?.specialty?.name ?? ""}
                          </div>
                        </div>
                        <Badge>{formatTime(a.startsAt)}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximos agendamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {data.upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum agendamento futuro.{" "}
                    <Link href="/agendamentos" className="text-primary underline">
                      Agendar consulta
                    </Link>
                  </p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.upcomingAppointments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between py-2.5"
                      >
                        <div>
                          <div className="font-medium">{a.patient?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.doctor?.name}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(a.startsAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
