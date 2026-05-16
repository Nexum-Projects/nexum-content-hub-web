"use server";

import { isAxiosError } from "axios";
import { z } from "zod";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

const ConfirmPasswordResetSchema = z.object({
  token: z.string().trim().min(1, "El enlace de recuperacion no es valido"),
  newPassword: z.string().min(6, "Minimo 6 caracteres"),
});

type ConfirmPasswordResetInput = z.infer<typeof ConfirmPasswordResetSchema>;

const PasswordResetConfirmResponseSchema = z.object({
  message: z.string(),
  userId: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
});

/** Confirma restablecimiento con token del correo (no abre sesion automaticamente). */
export default async function confirmPasswordReset(
  input: ConfirmPasswordResetInput,
): ActionResponse<{ message: string }> {
  try {
    const payload = ConfirmPasswordResetSchema.parse(input);
    const response = await baseAxios.post("/auth/password-reset/confirm", {
      token: payload.token,
      newPassword: payload.newPassword,
    });

    const parsedRoot = PasswordResetConfirmResponseSchema.safeParse(response.data);
    const parsedWrapped = z
      .object({ data: PasswordResetConfirmResponseSchema })
      .safeParse(response.data);

    const body = parsedRoot.success
      ? parsedRoot.data
      : parsedWrapped.success
        ? parsedWrapped.data.data
        : null;

    if (!body) {
      throw new Error("Invalid password reset response shape");
    }

    return {
      status: "success",
      data: { message: body.message },
    };
  } catch (error) {
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
