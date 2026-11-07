"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import type { Patient } from "@medagenda/shared-types";
import { get, patch, post } from "@/lib/api";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ErrorAlert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";

const emptyForm = { name: "", birthDate: "", phone: "", email: "" };

export default function PacientesPage() {
  const [items, setItems] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (term?: string) => {
    try {
      const qs = term ? `?search=${encodeURIComponent(term)}` : "";
      setItems(await get<Patient[]>(`/patients${qs}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setOpen(true);
  }

  function openEdit(patient: Patient) {
    setEditing(patient);
    setForm({
      name: patient.name,
      birthDate: patient.birthDate.slice(0, 10),
      phone: patient.phone,
      email: patient.email,
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
        await patch(`/patients/${editing.id}`, form);
      } else {
        await post("/patients", form);
      }
      setOpen(false);
      await load(search);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Pacientes"
        description="Cadastro de pacientes (somente dados fictícios)"
        action={
          <Button onClick={openCreate}>
            <Plus size={16} /> Novo paciente
          </Button>
        }
      />
      <ErrorAlert>{error}</ErrorAlert>

      <form
        className="mb-4 flex max-w-sm gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load(search);
        }}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail…"
          aria-label="Buscar pacientes"
        />
        <Button type="submit" variant="secondary" size="icon" aria-label="Buscar">
          <Search size={16} />
        </Button>
      </form>

      <Table>
        <THead>
          <TR>
            <TH>Nome</TH>
            <TH>Nascimento</TH>
            <TH>Telefone</TH>
            <TH>E-mail</TH>
            <TH className="text-right">Ações</TH>
          </TR>
        </THead>
        <TBody>
          {items.map((p) => (
            <TR key={p.id}>
              <TD className="font-medium">{p.name}</TD>
              <TD>{formatDate(p.birthDate)}</TD>
              <TD>{p.phone}</TD>
              <TD className="text-muted-foreground">{p.email}</TD>
              <TD className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(p)}
                  aria-label={`Editar ${p.name}`}
                >
                  <Pencil size={15} />
                </Button>
              </TD>
            </TR>
          ))}
          {items.length === 0 && !error ? (
            <TR>
              <TD colSpan={5} className="text-center text-muted-foreground">
                Nenhum paciente encontrado.
              </TD>
            </TR>
          ) : null}
        </TBody>
      </Table>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Editar ${editing.name}` : "Novo paciente"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="p-name">Nome completo</Label>
            <Input
              id="p-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              minLength={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-birth">Data de nascimento</Label>
              <Input
                id="p-birth"
                type="date"
                value={form.birthDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, birthDate: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-phone">Telefone (fictício)</Label>
              <Input
                id="p-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="(11) 98888-0000"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-email">E-mail (fictício)</Label>
            <Input
              id="p-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
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
