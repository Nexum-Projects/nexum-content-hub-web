import { cookies } from "next/headers";
import axios, { isAxiosError } from "axios";
import { redirect } from "next/navigation";

import { env } from "@/utils/env";
import { isJwtExpired } from "@/utils/auth-token";

const baseAxios = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

baseAxios.interceptors.request.use(async (config) => {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (session && !isJwtExpired(session)) {
    config.headers.Authorization = `Bearer ${session}`;
  }

  return config;
});

baseAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Sesión rechazada por el API (firma inválida, usuario desactivado, secreto rotado): /logout borra las cookies
    // y lleva al login. No se borran aquí porque durante el render de una página Next.js no lo permite.
    // parseApiError deja pasar el redirect por los catch de las acciones (unstable_rethrow).
    if (isAxiosError(error) && error.response?.status === 401) {
      redirect("/logout");
    }

    return Promise.reject(error);
  },
);

export default baseAxios;
