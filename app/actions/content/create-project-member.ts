"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";
import { z } from "zod";

import getSession from "@/app/actions/auth/getSession";
import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { ProjectMember, ProjectMemberRole } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

const CreateProjectMemberSchema = z.object({
  projectId: z.string().uuid("Identificador de proyecto invalido"),
  userId: z.string().uuid("Identificador de usuario invalido"),
  role: z.enum(["OWNER", "ADMIN", "MARKETING"]),
});

export async function createProjectMember(input: {
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
}): ActionResponse<ProjectMember> {
  const session = await getSession();
  if (session?.platformRole !== "SUPER_ADMIN") {
    return {
      status: "error",
      errors: [{ title: "No autorizado", message: "Solo un super administrador puede asignar miembros desde aqui." }],
    };
  }

  try {
    const payload = CreateProjectMemberSchema.parse(input);
    const response = await baseAxios.post<{ data: ProjectMember }>(`/admin/projects/${payload.projectId}/members`, {
      userId: payload.userId,
      role: payload.role,
      isActive: true,
    });

    const member = response.data?.data;
    if (!member?.id) {
      return {
        status: "error",
        errors: [{ title: "Respuesta invalida", message: "El servidor no devolvio el miembro creado." }],
      };
    }

    revalidatePath(`/dashboard/projects/${payload.projectId}/members`);
    return { status: "success", data: member };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const first = error.issues[0];
      return {
        status: "error",
        errors: [{ title: "Datos invalidos", message: first?.message ?? "Revisa los datos enviados." }],
      };
    }

    if (isAxiosError(error) && error.response) {
      const humanizedError = parseApiError(error.response.data);
      return {
        status: "error",
        errors: [
          {
            title: humanizedError.title,
            message: humanizedError.description,
            statusCode: error.response.status,
          },
        ],
      };
    }

    const humanizedError = parseApiError(error);
    return {
      status: "error",
      errors: [{ title: humanizedError.title, message: humanizedError.description }],
    };
  }
}
