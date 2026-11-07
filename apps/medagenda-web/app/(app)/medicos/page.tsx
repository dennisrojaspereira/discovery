"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, UserX } from "lucide-react";
import type { Doctor, Specialty } from "@medagenda/shared-types";
import { del, get, patch, post } from "@/lib/api";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ErrorAlert } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const emptyForm = {
  name: "",
  crm: "",
  crmUf: "SP",
  specialtyId: "",
  phone: "",
  email: "",
};

export default function MedicosPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [docs, specs] = await Promise.all([
        get<Doctor[]>("/doctors"),
        get<Specialty[]>("/specialties"),
      ]);
      setItems(docs);
      setSpecialties(specs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, specialtyId: specialties[0]?.id ?? "" });
    setFormError("");
    setOpen(true);
  }

  function openEdit(doctor: Doctor) {
    setEditing(doctor);
    setForm({
      name: doctor.name,
      crm: doctor.crm,
      crmUf: doctor.crmUf,
      specialtyId: doctor.specialtyId,
      phone: doctor.phone,
      email: doctor.email,
    });
    setFormError("");
    setOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      if (editing) {
        await patch(`/doctors/${editing.id}`, form);
      } else {
        await post("/doctors", form);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(doctor: Doctor) {
    if (
      !window.confirm(
        `Desativar ${doctor.name}? O médico deixa de receber novos agendamentos.`,
      )
    )
      return;
    try {
      await del(`/doctors/${doctor.id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desativar");
    }
  }

  const set = (field: keyof typeof emptyForm) => (value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div>
      <PageHeader
        title="Médicos"
        description="Corpo clínico da rede (dados fictícios)"
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Novo médico
          </Button>
        }
      />
      <ErrorAlert>{error}</ErrorAlert>

      <Table>
        <THead>
          <TR>
            <TH>Nome</TH>
            <TH>CRM</TH>
            <TH>Especialidade</TH>
            <TH>Contato</TH>
            <TH>Status</TH>
            <TH className="text-right">Ações</TH>
          </TR>
        </THead>
        <TBody>
          {items.map((d) => (
            <TR key={d.id}>
              <TD className="font-medium">{d.name}</TD>
              <TD>
                {d.crm}/{d.crmUf}
              </TD>
              <TD>{d.specialty?.name}</TD>
              <TD className="text-muted-foreground">
                <div>{d.phone}</div>
                <div className="text-xs">{d.email}</div>
              </TD>
              <TD>
                {d.status === "ACTIVE" ? (
                  <Badge variant="success">Ativo</Badge>
                ) : (
                  <Badge variant="muted">Inativo</Badge>
                )}
              </TD>
              <TD className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(d)}
                    aria-label={`Editar ${d.name}`}
                  >
                    <Pencil size={15} />
                  </Button>
                  {d.status === "ACTIVE" && user?.role === "ADMIN" ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeactivate(d)}
                      aria-label={`Desativar ${d.name}`}
                    >
                      <UserX size={15} className="text-destructive" />
                    </Button>
                  ) : null}
                </div>
              </TD>
            </TR>
          ))}
          {items.length === 0 && !error ? (
            <TR>
              <TD colSpan={6} className="text-center text-muted-foreground">
                Nenhum médico cadastrado.
              </TD>
            </TR>
          ) : null}
        </TBody>
      </Table>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Editar ${editing.name}` : "Novo médico"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="d-name">Nome completo</Label>
            <Input
              id="d-name"
              value={form.name}
              onChange={(e) => set("name")(e.target.value)}
              required
              minLength={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-crm">CRM (fictício)</Label>
              <Input
                id="d-crm"
                value={form.crm}
                onChange={(e) => set("crm")(e.target.value)}
                pattern="\d{4,7}"
                title="4 a 7 dígitos"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-uf">UF do registro</Label>
              <Select
                id="d-uf"
                value={form.crmUf}
                onChange={(e) => set("crmUf")(e.target.value)}
              >
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-spec">Especialidade</Label>
            <Select
              id="d-spec"
              value={form.specialtyId}
              onChange={(e) => set("specialtyId")(e.target.value)}
              required
            >
              <option value="" disabled>
                Selecione…
              </option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-phone">Telefone (fictício)</Label>
              <Input
                id="d-phone"
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
                placeholder="(11) 99999-0000"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-email">E-mail (fictício)</Label>
              <Input
                id="d-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
                required
              />
            </div>
          </div>
          <ErrorAlert>{formError}</ErrorAlert>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
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
