"use client";

import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { z } from "zod";

import { createUser, updateUser } from "@/app/actions/content";
import type { User } from "@/app/actions/content/types";
import { ContentImageUpload, FieldError } from "@/components/content/content-form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { humanizePlatformRole } from "@/utils/helpers/humanize-enum";

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

const createUserFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Correo no valido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
  platformRole: z.enum(["USER", "SUPER_ADMIN"]),
  avatarFile: optionalAvatarFileSchema,
});

type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

export function AdminUserCreateForm() {
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
    await createUser(fd);
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
        <CardFooter className="flex flex-col gap-3 border-t border-border bg-muted/20 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Tras crear el usuario volverás al listado de cuentas.</p>
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
});

type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export function AdminUserEditForm({
  user,
  existingAvatarUrl,
}: {
  user: User;
  existingAvatarUrl: string | null;
}) {
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
    await updateUser(user.id, fd);
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
        <CardFooter className="flex flex-col gap-3 border-t border-border bg-muted/20 py-5 sm:flex-row sm:items-center sm:justify-between">
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
