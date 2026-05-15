"use server";

import { isAxiosError } from "axios";
import { z } from "zod";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(150, "Maximo 150 caracteres"),
  email: z.string().email("Ingresa un correo valido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

type RegisterInput = z.infer<typeof RegisterSchema>;

/** Registra usuario sin abrir sesión: debe verificar correo antes de iniciar sesión. */
export default async function register(input: RegisterInput): ActionResponse<null> {
  try {
    const payload = RegisterSchema.parse(input);
    await baseAxios.post("/auth/register", {
      name: payload.name,
      email: payload.email,
      password: payload.password,
    });

    return {
      status: "success",
      data: null,
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
