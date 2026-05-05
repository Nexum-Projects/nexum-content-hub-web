"use server";

import { cookies } from "next/headers";
import { isAxiosError } from "axios";
import { z } from "zod";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

const LoginSchema = z.object({
  email: z.string().email("Ingresa un correo valido"),
  password: z.string().min(1, "La contrasena es requerida"),
  remember: z.boolean().optional(),
});

const TokenResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});

type LoginInput = z.infer<typeof LoginSchema>;

export default async function login(input: LoginInput): ActionResponse<{
  accessToken: string;
  refreshToken: string;
}> {
  try {
    const payload = LoginSchema.parse(input);
    const response = await baseAxios.post("/auth/login", {
      email: payload.email,
      password: payload.password,
    });

    const { data } = TokenResponseSchema.parse(response.data);
    const cookieStore = await cookies();
    const sessionExpires = new Date(
      Date.now() + (payload.remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24 * 7),
    );
    const accessExpires = new Date(Date.now() + 1000 * 60 * 60 * 8);

    cookieStore.set("session", data.refreshToken, {
      expires: sessionExpires,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    cookieStore.set("accessToken", data.accessToken, {
      expires: accessExpires,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return {
      status: "success",
      data,
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
