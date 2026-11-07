"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import type { Specialty } from "@medagenda/shared-types";
import { get, post } from "@/lib/api";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ErrorAlert } from "@/components/ui/alert";

type SpecialtyRow = Specialty & { _count?: { doctors: number } };

export default function EspecialidadesPage() {
  const [items, setItems] = useState<SpecialtyRow[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setItems(await get<SpecialtyRow[]>("/specialties"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      await post("/specialties", {
        name,
        description: description || undefined,
      });
      setOpen(false);
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Especialidades"
        description="Especialidades médicas atendidas pela clínica"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Nova especialidade
          </Button>
        }
      />
      <ErrorAlert>{error}</ErrorAlert>

      <Table>
        <THead>
          <TR>
            <TH>Nome</TH>
            <TH>Descrição</TH>
            <TH className="text-right">Médicos</TH>
          </TR>
        </THead>
        <TBody>
          {items.map((s) => (
            <TR key={s.id}>
              <TD className="font-medium">{s.name}</TD>
              <TD className="text-muted-foreground">{s.description ?? "—"}</TD>
              <TD className="text-right">{s._count?.doctors ?? 0}</TD>
            </TR>
          ))}
          {items.length === 0 && !error ? (
            <TR>
              <TD colSpan={3} className="text-center text-muted-foreground">
                Nenhuma especialidade cadastrada.
              </TD>
            </TR>
          ) : null}
        </TBody>
      </Table>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nova especialidade"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sp-name">Nome</Label>
            <Input
              id="sp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Cardiologia"
              required
              minLength={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sp-desc">Descrição (opcional)</Label>
            <Input
              id="sp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição"
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
