"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ChevronsUpDown, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { createProjectMember } from "@/app/actions/content";
import type { ProjectMemberRole, User } from "@/app/actions/content/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { cn } from "@/lib/utils";
import { humanizeProjectMemberRole } from "@/utils/helpers/humanize-enum";

type AssignProjectMemberDialogProps = {
  projectId: string;
  candidates: User[];
  usersLoaded: boolean;
};

function UserCombobox({
  disabled,
  onValueChange,
  users,
  value,
}: {
  disabled?: boolean;
  onValueChange: (userId: string) => void;
  users: User[];
  value: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = value ? users.find((u) => u.id === value) : undefined;
  const term = query.trim().toLowerCase();
  const filteredUsers = term
    ? users.filter((user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term))
    : users;

  function selectUser(user: User) {
    onValueChange(user.id);
    setQuery("");
    setOpen(false);
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className="h-10 w-full justify-between rounded-lg border-input bg-background px-3 font-normal text-foreground hover:bg-background"
          disabled={disabled}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className={cn("min-w-0 truncate", !selected && "text-muted-foreground")}>
            {selected ? `${selected.name} - ${selected.email}` : "Buscar y seleccionar usuario..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-0" sideOffset={6}>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o correo..."
            value={query}
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredUsers.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sin coincidencias con la busqueda.</p>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = user.id === value;
              return (
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                    isSelected && "bg-accent text-accent-foreground",
                  )}
                  key={user.id}
                  onClick={() => selectUser(user)}
                  type="button"
                >
                  <Check className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{user.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AssignProjectMemberDialog({ projectId, candidates, usersLoaded }: AssignProjectMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [role, setRole] = useState<ProjectMemberRole>("MARKETING");
  const [pending, setPending] = useState(false);

  const selected = selectedId ? candidates.find((u) => u.id === selectedId) : undefined;

  function resetForm() {
    setSelectedId(null);
    setRole("MARKETING");
  }

  async function handleAssign() {
    if (!selectedId) {
      toast.error("Selecciona un usuario", { description: "Elige una persona de la lista para asignarla al proyecto." });
      return;
    }

    setPending(true);
    const result = await createProjectMember({ projectId, userId: selectedId, role });
    setPending(false);

    if (result.status === "error") {
      const err = result.errors[0];
      toast.error(err?.title ?? "No se pudo asignar", { description: err?.message });
      return;
    }

    toast.success("Miembro asignado", {
      description: `${selected?.name ?? "Usuario"} ya tiene acceso a este proyecto.`,
    });
    setOpen(false);
    resetForm();
    router.refresh();
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetForm();
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button className="h-10 shrink-0 rounded-lg shadow-sm" type="button" variant="default">
          <UserPlus className="h-4 w-4" />
          Asignar miembro
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,560px)] gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="space-y-4 p-6 pb-4">
          <DialogHeader>
            <DialogTitle>Asignar miembro al proyecto</DialogTitle>
            <DialogDescription>
              Busca por nombre o correo entre los usuarios de la plataforma. Solo aparecen personas activas que aun no estan en
              este proyecto.
            </DialogDescription>
          </DialogHeader>

          {!usersLoaded ? (
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar los usuarios de la plataforma. Solo un super administrador puede listar usuarios.
            </p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay usuarios disponibles para asignar (todos ya son miembros o estan inactivos).</p>
          ) : (
            <>
              <div className="space-y-3">
                <Label className="block">Usuario</Label>
                <UserCombobox onValueChange={setSelectedId} users={candidates} value={selectedId} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assign-role">Rol en el proyecto</Label>
                <Select onValueChange={(v) => setRole(v as ProjectMemberRole)} value={role}>
                  <SelectTrigger className="h-10 w-full rounded-lg" id="assign-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">{humanizeProjectMemberRole("MARKETING")}</SelectItem>
                    <SelectItem value="ADMIN">{humanizeProjectMemberRole("ADMIN")}</SelectItem>
                    <SelectItem value="OWNER">{humanizeProjectMemberRole("OWNER")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4 sm:justify-between">
          <Button disabled={pending} onClick={() => setOpen(false)} type="button" variant="outline">
            Cancelar
          </Button>
          <Button
            disabled={pending || !usersLoaded || !selectedId || candidates.length === 0}
            onClick={() => void handleAssign()}
            type="button"
          >
            {pending ? "Asignando…" : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
