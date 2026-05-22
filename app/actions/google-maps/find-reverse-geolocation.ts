"use server";

import axios, { isAxiosError } from "axios";

import type { ActionResponse } from "@/app/actions/types";
import { env } from "@/utils/env";
import type { GoogleMapsGeocodingResponse } from "./types";

export async function findReverseGeolocation(params: {
  lat: number;
  lng: number;
}): ActionResponse<GoogleMapsGeocodingResponse> {
  if (!env.GOOGLE_MAPS_KEY || !env.GOOGLE_MAPS_API_URL) {
    return {
      status: "error",
      errors: [
        {
          title: "Google Maps no configurado",
          message: "Faltan GOOGLE_MAPS_KEY o GOOGLE_MAPS_API_URL.",
        },
      ],
    };
  }

  try {
    const response = await axios.get<GoogleMapsGeocodingResponse>(env.GOOGLE_MAPS_API_URL, {
      params: {
        latlng: `${params.lat},${params.lng}`,
        language: "es",
        key: env.GOOGLE_MAPS_KEY,
      },
    });

    return {
      status: "success",
      data: response.data,
    };
  } catch (error) {
    const message =
      isAxiosError(error) && error.response?.data?.error_message
        ? error.response.data.error_message
        : "No se pudo resolver la ubicacion seleccionada.";

    return {
      status: "error",
      errors: [{ title: "Error de Google Maps", message }],
    };
  }
}
