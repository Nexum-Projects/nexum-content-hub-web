import { cookies } from "next/headers";
import axios, { isAxiosError } from "axios";

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
    if (isAxiosError(error) && error.response?.status === 401) {
      const cookieStore = await cookies();
      cookieStore.delete("session");
      cookieStore.delete("accessToken");
    }

    return Promise.reject(error);
  },
);

export default baseAxios;
