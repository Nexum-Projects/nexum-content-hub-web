"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronDown, Loader2, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createUser, updateUser } from "@/app/actions/content";
import type { Project, ProjectMemberRole, User } from "@/app/actions/content/types";
import { ContentImageUpload, FieldError } from "@/components/content/content-form-controls";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select as RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/radix-select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { humanizePlatformRole, humanizeProjectMemberRole } from "@/utils/helpers/humanize-enum";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const optionalAvatarFileSchema = z
  .custom<File | undefined>((v) => v === undefined || v instanceof File)
  .optional()
  .superRefine((file, ctx) => {
    if (!file) {
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      ctx.addIssue({ code: "custom", message: "Usa JPG, PNG o WEBP" });
    }
    if (file.size > MAX_FILE_SIZE) {
      ctx.addIssue({ code: "custom", message: "La imagen no debe superar 5MB" });
    }
  });

const projectMemberRoleSchema = z.enum(["OWNER", "ADMIN", "MARKETING"]);
const projectMembershipSchema = z.object({
  projectId: z.string().min(1, "Selecciona un proyecto"),
  role: projectMemberRoleSchema,
});

function uniqueProjectMemberships<T extends { projectMemberships?: Array<{ projectId?: string }> }>(data: T, ctx: z.RefinementCtx) {
  const seen = new Set<string>();
  (data.projectMemberships ?? []).forEach((membership, index) => {
    if (!membership.projectId) {
      return;
    }
    if (seen.has(membership.projectId)) {
      ctx.addIssue({
        code: "custom",
        message: "Este proyecto ya fue agregado.",
        path: ["projectMemberships", index, "projectId"],
      });
    }
    seen.add(membership.projectId);
  });
}

const createUserFormSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    email: z.string().email("Correo no valido"),
    password: z.string().min(6, "Minimo 6 caracteres"),
    platformRole: z.enum(["USER", "SUPER_ADMIN"]),
    avatarFile: optionalAvatarFileSchema,
    projectMemberships: z.array(projectMembershipSchema).optional(),
  })
  .superRefine(uniqueProjectMemberships);

type CreateUserFormValues = z.infer<typeof createUserFormSchema>;
type ProjectMembershipFormValue = z.infer<typeof projectMembershipSchema>;
type ProjectMembershipFormModel = {
  projectMemberships: ProjectMembershipFormValue[];
};
type ExistingUserProjectMembership = {
  memberId: string;
  projectId: string;
  role: ProjectMemberRole;
};

const PROJECT_MEMBER_ROLES: ProjectMemberRole[] = ["OWNER", "ADMIN", "MARKETING"];

const ROLE_META: Record<ProjectMemberRole, { description: string; permissions: string[] }> = {
  OWNER: {
    description: "Puede gestionar todo el contenido, configuracion y miembros del proyecto.",
    permissions: ["Contenido", "Publicacion", "Configuracion", "Miembros"],
  },
  ADMIN: {
    description: "Puede gestionar contenido, publicar cambios y administrar la configuracion operativa.",
    permissions: ["Contenido", "Publicacion", "Configuracion"],
  },
  MARKETING: {
    description: "Puede gestionar banners, menu, eventos, logros, paginas y medios.",
    permissions: ["Banners", "Menu", "Eventos", "Medios"],
  },
};

function membershipPayload(memberships?: ProjectMembershipFormValue[]) {
  return JSON.stringify(
    (memberships ?? [])
      .filter((membership) => membership.projectId && membership.role)
      .map((membership) => ({
        projectId: membership.projectId,
        role: membership.role,
      })),
  );
}

function existingMembershipPayload(memberships?: ExistingUserProjectMembership[]) {
  return JSON.stringify(
    (memberships ?? []).map((membership) => ({
      memberId: membership.memberId,
      projectId: membership.projectId,
    })),
  );
}

function findProject(projects: Project[], projectId?: string) {
  return projects.find((project) => project.id === projectId);
}

function ProjectCombobox({
  disabledProjectIds,
  onChange,
  projects,
  value,
}: {
  disabledProjectIds: string[];
  onChange: (value: string) => void;
  projects: Project[];
  value?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedProject = findProject(projects, value);
  const hiddenSet = useMemo(() => new Set(disabledProjectIds.filter((projectId) => projectId !== value)), [disabledProjectIds, value]);
  const filteredProjects = projects.filter((project) => {
    const matches = project.name.toLowerCase().includes(query.trim().toLowerCase());
    return matches && !hiddenSet.has(project.id);
  });

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn("h-10 w-full justify-between px-3 font-normal", !selectedProject && "text-muted-foreground")}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className="truncate">{selectedProject?.name ?? "Seleccionar proyecto..."}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(420px,calc(100vw-2rem))] p-0">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar proyecto..."
            value={query}
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {filteredProjects.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No se encontraron proyectos.</p>
          ) : (
            filteredProjects.map((project) => {
              const selected = project.id === value;
              return (
                <button
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    selected && "bg-primary/10 text-primary",
                    !selected && "hover:bg-accent hover:text-accent-foreground",
                  )}
                  key={project.id}
                  onClick={() => {
                    onChange(project.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  type="button"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {project.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{project.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{project.domain || project.slug}</span>
                  </span>
                  {selected ? <Check className="h-4 w-4" /> : null}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RoleSelect({ onChange, value }: { onChange: (value: ProjectMemberRole) => void; value: ProjectMemberRole }) {
  return (
    <RadixSelect onValueChange={(next) => onChange(next as ProjectMemberRole)} value={value}>
      <SelectTrigger>
        <SelectValue placeholder="Seleccionar rol" />
      </SelectTrigger>
      <SelectContent>
        {PROJECT_MEMBER_ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {humanizeProjectMemberRole(role)}
          </SelectItem>
        ))}
      </SelectContent>
    </RadixSelect>
  );
}

function projectMembershipFieldError(errors: unknown, index: number, key: "projectId" | "role") {
  const root = errors as {
    projectMemberships?: Array<{
      projectId?: { message?: unknown };
      role?: { message?: unknown };
    }>;
  };
  const message = root.projectMemberships?.[index]?.[key]?.message;
  return typeof message === "string" ? message : undefined;
}

function ProjectMembershipsSection({
  control,
  errors,
  projects,
}: {
  control: Control<ProjectMembershipFormModel>;
  errors: unknown;
  projects: Project[];
}) {
  const { append, fields, remove } = useFieldArray({
    control,
    name: "projectMemberships",
  });
  const memberships = useWatch({ control, name: "projectMemberships" }) ?? [];
  const selectedProjectIds = memberships.map((membership) => membership.projectId).filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asignacion de proyectos</CardTitle>
        <CardDescription>Define a que proyectos tendra acceso este usuario y que rol tendra dentro de cada uno.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-primary/20 bg-primary/5">
          <ShieldCheck className="mr-2 inline h-4 w-4 text-primary" />
          <AlertDescription className="inline">Los roles aqui aplican solo dentro de cada proyecto.</AlertDescription>
        </Alert>

        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center">
            <p className="text-sm font-medium">Este usuario aun no tiene acceso a ningun proyecto.</p>
            <p className="mt-1 text-sm text-muted-foreground">Agrega una membresia cuando quieras darle acceso puntual.</p>
            <Button className="mt-4" onClick={() => append({ projectId: "", role: "MARKETING" })} type="button">
              <Plus className="h-4 w-4" />
              Agregar proyecto
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => {
              const role = memberships[index]?.role ?? "MARKETING";
              const meta = ROLE_META[role];
              const selectedProject = findProject(projects, memberships[index]?.projectId);
              return (
                <Card className="rounded-xl border bg-card shadow-none" key={field.id}>
                  <CardHeader className="relative space-y-0 p-4 pr-14">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="truncate text-base">{selectedProject?.name ?? "Proyecto sin seleccionar"}</CardTitle>
                        <Badge variant="outline">{humanizeProjectMemberRole(role)}</Badge>
                      </div>
                      <CardDescription>{meta.description}</CardDescription>
                    </div>
                    <Button className="absolute right-3 top-3" onClick={() => remove(index)} size="icon" type="button" variant="ghost">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <Separator />
                  <CardContent className="grid gap-4 p-4 md:grid-cols-2">
                    <Controller
                      control={control}
                      name={`projectMemberships.${index}.projectId`}
                      render={({ field: projectField }) => (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Proyecto</label>
                          <ProjectCombobox
                            disabledProjectIds={selectedProjectIds}
                            onChange={projectField.onChange}
                            projects={projects}
                            value={projectField.value}
                          />
                          <FieldError message={projectMembershipFieldError(errors, index, "projectId")} />
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name={`projectMemberships.${index}.role`}
                      render={({ field: roleField }) => (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Rol</label>
                          <RoleSelect onChange={roleField.onChange} value={roleField.value ?? "MARKETING"} />
                          <FieldError message={projectMembershipFieldError(errors, index, "role")} />
                        </div>
                      )}
                    />
                    <div className="md:col-span-2">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Permisos incluidos</p>
                      <div className="flex flex-wrap gap-2">
                        {meta.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary">
                            <Check className="h-3 w-3" />
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminUserCreateForm({
  projects = [],
  showProjectAssignment = false,
}: {
  projects?: Project[];
  showProjectAssignment?: boolean;
}) {
  const router = useRouter();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      platformRole: "USER",
      avatarFile: undefined,
      projectMemberships: [],
    },
  });

  async function onSubmit(data: CreateUserFormValues) {
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("email", data.email);
    fd.append("password", data.password);
    fd.append("platformRole", data.platformRole);
    if (data.avatarFile) {
      fd.append("avatarFile", data.avatarFile);
    }
    fd.append("projectMembershipsJson", membershipPayload(data.projectMemberships));
    const result = await createUser(fd);
    if (result.status === "error") {
      toast.error(result.errors[0]?.message ?? "No se pudo crear el usuario.");
      return;
    }
    if (result.data.assignmentErrors?.length) {
      toast.warning(
        `Usuario creado. No se pudo asignar a todos los proyectos: ${result.data.assignmentErrors.join(" · ")}`,
      );
    } else {
      toast.success("Usuario creado correctamente.");
    }
    router.push(`/dashboard/admin/users/${result.data.userId}`);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Información principal</CardTitle>
          <CardDescription>
            Nombre, correo, contraseña y rol con los que la persona iniciará sesión en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="user-name">
                Nombre completo <span className="text-destructive">*</span>
              </label>
              <Input autoComplete="name" id="user-name" placeholder="Ej. María López" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="user-email">
                Correo electrónico <span className="text-destructive">*</span>
              </label>
              <Input
                autoComplete="email"
                id="user-email"
                placeholder="correo@empresa.com"
                type="email"
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="user-password">
                Contraseña <span className="text-destructive">*</span>
              </label>
              <Input
                autoComplete="new-password"
                className="h-9"
                id="user-password"
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                type="password"
                {...register("password")}
              />
              <FieldError message={errors.password?.message} />
            </div>
            <Field className="space-y-2" label="Rol de plataforma">
              <Select className="h-9" {...register("platformRole")}>
                <option value="USER">{humanizePlatformRole("USER")}</option>
                <option value="SUPER_ADMIN">{humanizePlatformRole("SUPER_ADMIN")}</option>
              </Select>
              <FieldError message={errors.platformRole?.message} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
          <CardDescription>JPG, PNG o WEBP · Máx. 5MB. Opcional.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="avatarFile"
            render={({ field }) => (
              <ContentImageUpload
                emptyLabel="Sin imagen seleccionada"
                error={errors.avatarFile?.message as string | undefined}
                file={field.value}
                onChange={field.onChange}
                onPreviewUrlChange={() => {}}
              />
            )}
          />
        </CardContent>
      </Card>

      {showProjectAssignment && projects.length > 0 ? (
        <ProjectMembershipsSection
          control={control as unknown as Control<ProjectMembershipFormModel>}
          errors={errors}
          projects={projects}
        />
      ) : null}

      <Card>
        <CardFooter className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Tras crear el usuario verás su ficha de detalle.</p>
          <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            <Button asChild variant="outline">
              <Link href="/dashboard/admin/users">Cancelar</Link>
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear usuario
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}

const editUserFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo no valido"),
  password: z.string().refine((val) => !val || val.length >= 6, "Minimo 6 caracteres si cambias la contraseña"),
  platformRole: z.enum(["USER", "SUPER_ADMIN"]),
  avatarFile: optionalAvatarFileSchema,
  isActive: z.boolean(),
  projectMemberships: z.array(projectMembershipSchema).optional(),
}).superRefine(uniqueProjectMemberships);

type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export function AdminUserEditForm({
  user,
  existingAvatarUrl,
  initialProjectMemberships = [],
  projects = [],
  showProjectAssignment = false,
}: {
  user: User;
  existingAvatarUrl: string | null;
  initialProjectMemberships?: ExistingUserProjectMembership[];
  projects?: Project[];
  showProjectAssignment?: boolean;
}) {
  const router = useRouter();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      name: user.name ?? "",
      email: user.email ?? "",
      password: "",
      platformRole: user.platformRole ?? "USER",
      avatarFile: undefined,
      isActive: user.isActive !== false,
      projectMemberships: initialProjectMemberships.map((membership) => ({
        projectId: membership.projectId,
        role: membership.role,
      })),
    },
  });

  async function onSubmit(data: EditUserFormValues) {
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("email", data.email);
    if (data.password?.trim()) {
      fd.append("password", data.password);
    }
    fd.append("platformRole", data.platformRole);
    if (data.avatarFile) {
      fd.append("avatarFile", data.avatarFile);
    } else if (existingAvatarUrl) {
      fd.append("existingAvatarUrl", existingAvatarUrl);
    }
    if (data.isActive) {
      fd.append("isActive", "on");
    }
    fd.append("projectMembershipsJson", membershipPayload(data.projectMemberships));
    fd.append("existingProjectMembershipsJson", existingMembershipPayload(initialProjectMemberships));
    const result = await updateUser(user.id, fd);
    if (result.status === "error") {
      toast.error(result.errors[0]?.message ?? "No se pudo actualizar el usuario.");
      return;
    }
    if (result.data.assignmentErrors?.length) {
      toast.warning(
        `Cambios guardados. Algunos proyectos no se pudieron asignar: ${result.data.assignmentErrors.join(" · ")}`,
      );
    } else {
      toast.success("Usuario actualizado correctamente.");
    }
    router.push(`/dashboard/admin/users/${user.id}`);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Información principal</CardTitle>
          <CardDescription>
            Nombre, correo, contraseña opcional, rol y si la cuenta puede iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-name">
                Nombre completo <span className="text-destructive">*</span>
              </label>
              <Input autoComplete="name" id="edit-name" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-email">
                Correo electrónico <span className="text-destructive">*</span>
              </label>
              <Input autoComplete="email" id="edit-email" type="email" {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="edit-password">
                Nueva contraseña
              </label>
              <Input
                autoComplete="new-password"
                className="h-9"
                id="edit-password"
                minLength={6}
                placeholder="Dejar vacío para mantener la actual"
                type="password"
                {...register("password")}
              />
              <FieldError message={errors.password?.message} />
            </div>
            <Field className="space-y-2" label="Rol de plataforma">
              <Select className="h-9" {...register("platformRole")}>
                <option value="USER">{humanizePlatformRole("USER")}</option>
                <option value="SUPER_ADMIN">{humanizePlatformRole("SUPER_ADMIN")}</option>
              </Select>
              <FieldError message={errors.platformRole?.message} />
            </Field>
          </div>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4">
                <div className="min-w-0">
                  <p className="font-medium">Usuario activo</p>
                  <p className="text-sm text-muted-foreground">
                    Si está desactivado, no podrá iniciar sesión en el panel.
                  </p>
                </div>
                <Switch
                  checked={field.value}
                  disabled={isSubmitting}
                  onClick={() => field.onChange(!field.value)}
                  type="button"
                />
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
          <CardDescription>JPG, PNG o WEBP · Máx. 5MB. Deja la imagen actual o sube una nueva.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="avatarFile"
            render={({ field }) => (
              <ContentImageUpload
                emptyLabel="Sin imagen en el perfil"
                error={errors.avatarFile?.message as string | undefined}
                file={field.value}
                onChange={field.onChange}
                onPreviewUrlChange={() => {}}
                remotePreviewUrl={existingAvatarUrl}
              />
            )}
          />
        </CardContent>
      </Card>

      {showProjectAssignment && projects.length > 0 ? (
        <ProjectMembershipsSection
          control={control as unknown as Control<ProjectMembershipFormModel>}
          errors={errors}
          projects={projects}
        />
      ) : null}

      <Card>
        <CardFooter className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Al guardar se actualiza el detalle del usuario.</p>
          <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            <Button asChild variant="outline">
              <Link href={`/dashboard/admin/users/${user.id}`}>Cancelar</Link>
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
