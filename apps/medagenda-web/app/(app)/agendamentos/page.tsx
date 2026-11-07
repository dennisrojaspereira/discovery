"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CalendarPlus, XCircle } from "lucide-react";
import type {
  Appointment,
  Doctor,
  Patient,
  Specialty,
  TimeSlot,
} from "@medagenda/shared-types";
import { get, post } from "@/lib/api";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ErrorAlert, SuccessAlert } from "@/components/ui/alert";
import { cn, formatTime, formatDateTime, todayStr } from "@/lib/utils";

const STATUS_BADGE: Record<
  Appointment["status"],
  { label: string; variant: "success" | "muted" | "destructive" | "warning" }
> = {
  SCHEDULED: { label: "Agendada", variant: "success" },
  COMPLETED: { label: "Realizada", variant: "muted" },
  CANCELLED: { label: "Cancelada", variant: "destructive" },
  NO_SHOW: { label: "Não compareceu", variant: "warning" },
};

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterDate, setFilterDate] = useState(todayStr());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- novo agendamento ---
  const [open, setOpen] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [specialtyId, setSpecialtyId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(todayStr(1));
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [patientId, setPatientId] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // --- cancelamento ---
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    try {
      const from = new Date(`${filterDate}T00:00:00`);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      setAppointments(
        await get<Appointment[]>(
          `/appointments?from=${from.toISOString()}&to=${to.toISOString()}`,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, [filterDate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openNew() {
    setFormError("");
    setSelectedSlot("");
    setOpen(true);
    try {
      const [specs, pats] = await Promise.all([
        get<Specialty[]>("/specialties"),
        get<Patient[]>("/patients"),
      ]);
      setSpecialties(specs);
      setPatients(pats);
      if (specs.length > 0 && !specialtyId) setSpecialtyId(specs[0].id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }

  // Médicos da especialidade selecionada
  useEffect(() => {
    if (!specialtyId) return;
    get<Doctor[]>(`/doctors?specialtyId=${specialtyId}&status=ACTIVE`)
      .then((docs) => {
        setDoctors(docs);
        setDoctorId(docs[0]?.id ?? "");
      })
      .catch(() => setDoctors([]));
  }, [specialtyId]);

  // Slots do médico + data
  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    get<TimeSlot[]>(`/availability/slots?doctorId=${doctorId}&date=${date}`)
      .then((s) => {
        setSlots(s);
        setSelectedSlot("");
      })
      .catch(() => setSlots([]));
  }, [doctorId, date]);

  const futureSlots = useMemo(
    () => slots.filter((s) => new Date(s.startsAt) > new Date()),
    [slots],
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !patientId) {
      setFormError("Selecione horário e paciente");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      await post("/appointments", {
        doctorId,
        patientId,
        startsAt: selectedSlot,
        idempotencyKey:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : undefined,
      });
      setOpen(false);
      setSuccess("Consulta agendada com sucesso.");
      setFilterDate(date);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao agendar");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(e: FormEvent) {
    e.preventDefault();
    if (!cancelTarget) return;
    setSaving(true);
    try {
      await post(`/appointments/${cancelTarget.id}/cancel`, {
        reason: cancelReason,
      });
      setCancelTarget(null);
      setCancelReason("");
      setSuccess("Consulta cancelada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cancelar");
      setCancelTarget(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Agendamentos"
        description="Consultas agendadas, realizadas e canceladas"
        action={
          <Button onClick={openNew}>
            <CalendarPlus size={16} /> Agendar consulta
          </Button>
        }
      />
      <ErrorAlert>{error}</ErrorAlert>
      <SuccessAlert>{success}</SuccessAlert>

      <div className="mb-4 mt-2 flex max-w-xs items-center gap-2">
        <Label htmlFor="f-date" className="whitespace-nowrap">
          Dia:
        </Label>
        <Input
          id="f-date"
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Horário</TH>
            <TH>Paciente</TH>
            <TH>Médico</TH>
            <TH>Especialidade</TH>
            <TH>Status</TH>
            <TH className="text-right">Ações</TH>
          </TR>
        </THead>
        <TBody>
          {appointments.map((a) => (
            <TR key={a.id}>
              <TD className="font-medium">
                {formatTime(a.startsAt)}–{formatTime(a.endsAt)}
              </TD>
              <TD>{a.patient?.name}</TD>
              <TD>{a.doctor?.name}</TD>
              <TD className="text-muted-foreground">
                {a.doctor?.specialty?.name}
              </TD>
              <TD>
                <Badge variant={STATUS_BADGE[a.status].variant}>
                  {STATUS_BADGE[a.status].label}
                </Badge>
                {a.status === "CANCELLED" && a.cancelReason ? (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {a.cancelReason}
                  </div>
                ) : null}
              </TD>
              <TD className="text-right">
                {a.status === "SCHEDULED" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCancelReason("");
                      setCancelTarget(a);
                    }}
                  >
                    <XCircle size={14} className="text-destructive" /> Cancelar
                  </Button>
                ) : null}
              </TD>
            </TR>
          ))}
          {appointments.length === 0 && !error ? (
            <TR>
              <TD colSpan={6} className="text-center text-muted-foreground">
                Nenhuma consulta nesta data.
              </TD>
            </TR>
          ) : null}
        </TBody>
      </Table>

      {/* ---------- Novo agendamento ---------- */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Agendar consulta"
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="a-spec">Especialidade</Label>
              <Select
                id="a-spec"
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value)}
              >
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-doc">Médico</Label>
              <Select
                id="a-doc"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
              >
                {doctors.length === 0 ? (
                  <option value="">Nenhum médico ativo</option>
                ) : null}
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="a-date">Data</Label>
              <Input
                id="a-date"
                type="date"
                min={todayStr()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-patient">Paciente</Label>
              <Select
                id="a-patient"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Horários disponíveis</Label>
            {futureSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum horário para esta data — o médico pode não atender neste
                dia.
              </p>
            ) : (
              <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
                {futureSlots.map((s) => (
                  <button
                    key={s.startsAt}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setSelectedSlot(s.startsAt)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-sm transition-colors",
                      !s.available &&
                        "cursor-not-allowed border-border bg-muted text-muted-foreground line-through",
                      s.available &&
                        selectedSlot !== s.startsAt &&
                        "border-border bg-card hover:border-primary hover:text-primary",
                      selectedSlot === s.startsAt &&
                        "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {formatTime(s.startsAt)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ErrorAlert>{formError}</ErrorAlert>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !selectedSlot || !patientId}>
              {saving ? "Agendando…" : "Confirmar agendamento"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* ---------- Cancelamento ---------- */}
      <Dialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Cancelar consulta"
      >
        {cancelTarget ? (
          <form onSubmit={handleCancel} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {cancelTarget.patient?.name} com {cancelTarget.doctor?.name} em{" "}
              {formatDateTime(cancelTarget.startsAt)}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="c-reason">Motivo do cancelamento</Label>
              <Input
                id="c-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex.: paciente desmarcou por telefone"
                required
                minLength={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCancelTarget(null)}
              >
                Voltar
              </Button>
              <Button type="submit" variant="destructive" disabled={saving}>
                {saving ? "Cancelando…" : "Confirmar cancelamento"}
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}
