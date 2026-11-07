"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import type {
  AvailabilityBlock,
  AvailabilityRule,
  Doctor,
} from "@medagenda/shared-types";
import { del, get, post } from "@/lib/api";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ErrorAlert } from "@/components/ui/alert";
import { formatDateTime, WEEKDAYS_PT } from "@/lib/utils";

const emptyRule = {
  weekday: "1",
  startTime: "09:00",
  endTime: "12:00",
  slotDurationMin: "30",
  bufferMin: "0",
};

const emptyBlock = { startsAt: "", endsAt: "", reason: "" };

export default function DisponibilidadePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [error, setError] = useState("");

  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState(emptyRule);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockForm, setBlockForm] = useState(emptyBlock);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    get<Doctor[]>("/doctors?status=ACTIVE")
      .then((docs) => {
        setDoctors(docs);
        if (docs.length > 0) setDoctorId((id) => id || docs[0].id);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Erro ao carregar"),
      );
  }, []);

  const load = useCallback(async () => {
    if (!doctorId) return;
    try {
      const [r, b] = await Promise.all([
        get<AvailabilityRule[]>(`/availability/rules?doctorId=${doctorId}`),
        get<AvailabilityBlock[]>(`/availability/blocks?doctorId=${doctorId}`),
      ]);
      setRules(r);
      setBlocks(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, [doctorId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitRule(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await post("/availability/rules", {
        doctorId,
        weekday: Number(ruleForm.weekday),
        startTime: ruleForm.startTime,
        endTime: ruleForm.endTime,
        slotDurationMin: Number(ruleForm.slotDurationMin),
        bufferMin: Number(ruleForm.bufferMin),
      });
      setRuleOpen(false);
      setRuleForm(emptyRule);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function submitBlock(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await post("/availability/blocks", {
        doctorId,
        startsAt: new Date(blockForm.startsAt).toISOString(),
        endsAt: new Date(blockForm.endsAt).toISOString(),
        reason: blockForm.reason || undefined,
      });
      setBlockOpen(false);
      setBlockForm(emptyBlock);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function removeRule(id: string) {
    if (!window.confirm("Remover esta regra de atendimento?")) return;
    try {
      await del(`/availability/rules/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    }
  }

  async function removeBlock(id: string) {
    if (!window.confirm("Remover este bloqueio de agenda?")) return;
    try {
      await del(`/availability/blocks/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    }
  }

  return (
    <div>
      <PageHeader
        title="Disponibilidade"
        description="Dias de atendimento, horários, duração das consultas e bloqueios"
      />
      <ErrorAlert>{error}</ErrorAlert>

      <div className="mb-6 max-w-sm space-y-1.5">
        <Label htmlFor="doc-select">Médico</Label>
        <Select
          id="doc-select"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
        >
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.specialty?.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Horários de atendimento</CardTitle>
            <Button size="sm" onClick={() => { setFormError(""); setRuleOpen(true); }}>
              <Plus size={14} /> Nova regra
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Dia</TH>
                  <TH>Período</TH>
                  <TH>Consulta</TH>
                  <TH>Intervalo</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {rules.map((r) => (
                  <TR key={r.id}>
                    <TD>{WEEKDAYS_PT[r.weekday]}</TD>
                    <TD>
                      {r.startTime}–{r.endTime}
                    </TD>
                    <TD>{r.slotDurationMin} min</TD>
                    <TD>{r.bufferMin} min</TD>
                    <TD className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRule(r.id)}
                        aria-label="Remover regra"
                      >
                        <Trash2 size={15} className="text-destructive" />
                      </Button>
                    </TD>
                  </TR>
                ))}
                {rules.length === 0 ? (
                  <TR>
                    <TD colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma regra cadastrada para este médico.
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Bloqueios de agenda</CardTitle>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => { setFormError(""); setBlockOpen(true); }}
            >
              <CalendarOff size={14} /> Novo bloqueio
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Início</TH>
                  <TH>Fim</TH>
                  <TH>Motivo</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {blocks.map((b) => (
                  <TR key={b.id}>
                    <TD>{formatDateTime(b.startsAt)}</TD>
                    <TD>{formatDateTime(b.endsAt)}</TD>
                    <TD className="text-muted-foreground">{b.reason ?? "—"}</TD>
                    <TD className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBlock(b.id)}
                        aria-label="Remover bloqueio"
                      >
                        <Trash2 size={15} className="text-destructive" />
                      </Button>
                    </TD>
                  </TR>
                ))}
                {blocks.length === 0 ? (
                  <TR>
                    <TD colSpan={4} className="text-center text-muted-foreground">
                      Nenhum bloqueio futuro.
                    </TD>
                  </TR>
                ) : null}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={ruleOpen}
        onClose={() => setRuleOpen(false)}
        title="Nova regra de atendimento"
      >
        <form onSubmit={submitRule} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="r-weekday">Dia da semana</Label>
            <Select
              id="r-weekday"
              value={ruleForm.weekday}
              onChange={(e) =>
                setRuleForm((f) => ({ ...f, weekday: e.target.value }))
              }
            >
              {WEEKDAYS_PT.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-start">Início</Label>
              <Input
                id="r-start"
                type="time"
                value={ruleForm.startTime}
                onChange={(e) =>
                  setRuleForm((f) => ({ ...f, startTime: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-end">Fim</Label>
              <Input
                id="r-end"
                type="time"
                value={ruleForm.endTime}
                onChange={(e) =>
                  setRuleForm((f) => ({ ...f, endTime: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-dur">Duração da consulta (min)</Label>
              <Input
                id="r-dur"
                type="number"
                min={10}
                max={240}
                value={ruleForm.slotDurationMin}
                onChange={(e) =>
                  setRuleForm((f) => ({ ...f, slotDurationMin: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-buf">Intervalo entre consultas (min)</Label>
              <Input
                id="r-buf"
                type="number"
                min={0}
                max={60}
                value={ruleForm.bufferMin}
                onChange={(e) =>
                  setRuleForm((f) => ({ ...f, bufferMin: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <ErrorAlert>{formError}</ErrorAlert>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRuleOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title="Novo bloqueio de agenda"
      >
        <form onSubmit={submitBlock} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-start">Início</Label>
              <Input
                id="b-start"
                type="datetime-local"
                value={blockForm.startsAt}
                onChange={(e) =>
                  setBlockForm((f) => ({ ...f, startsAt: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-end">Fim</Label>
              <Input
                id="b-end"
                type="datetime-local"
                value={blockForm.endsAt}
                onChange={(e) =>
                  setBlockForm((f) => ({ ...f, endsAt: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="b-reason">Motivo (opcional)</Label>
            <Input
              id="b-reason"
              value={blockForm.reason}
              onChange={(e) =>
                setBlockForm((f) => ({ ...f, reason: e.target.value }))
              }
              placeholder="Ex.: Congresso, férias"
            />
          </div>
          <ErrorAlert>{formError}</ErrorAlert>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setBlockOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
