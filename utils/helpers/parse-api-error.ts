export type HumanizedError = {
  title: string;
  description: string;
};

type ApiErrorResponse = {
  code?: string | { name?: string };
  message?: string;
  statusCode?: number;
  type?: string;
  details?: Record<string, unknown>;
};

function formatFieldErrors(details?: Record<string, unknown>): string | undefined {
  const fieldErrors = details?.fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") {
    return undefined;
  }

  return Object.entries(fieldErrors as Record<string, string>)
    .map(([field, msg]) => `${field}: ${msg}`)
    .join(" · ");
}

const knownMessages: Record<string, HumanizedError> = {
  "Invalid credentials": {
    title: "Credenciales invalidas",
    description: "El correo o la contrasena no coinciden.",
  },
  "User account is inactive": {
    title: "Cuenta inactiva",
    description: "Tu cuenta esta inactiva. Contacta al administrador.",
  },
  "User account is not verified": {
    title: "Cuenta no verificada",
    description: "Confirma tu correo antes de iniciar sesion.",
  },
  "Email already exists": {
    title: "Correo en uso",
    description: "Ya existe una cuenta con ese correo electronico.",
  },
  "Invalid or expired JWT token.": {
    title: "Sesion vencida",
    description: "Tu sesion expiro. Inicia sesion nuevamente.",
  },
  "Invalid or expired reset token": {
    title: "Enlace expirado",
    description: "El enlace de recuperacion no es valido o ya caduco. Solicita uno nuevo.",
  },
  "User not found": {
    title: "Usuario no encontrado",
    description: "No existe ningun usuario con ese identificador en la plataforma.",
  },
};

export function parseApiError(error: unknown): HumanizedError {
  if (typeof error === "string") {
    return knownMessages[error] ?? { title: "Error", description: error };
  }

  if (error instanceof Error && error.message) {
    return {
      title: "No se pudo completar la accion",
      description: error.message,
    };
  }

  if (error && typeof error === "object") {
    const apiError = error as ApiErrorResponse;
    const fieldErrorText = formatFieldErrors(apiError.details);
    const code =
      typeof apiError.code === "string"
        ? apiError.code
        : typeof apiError.code === "object" && apiError.code?.name
          ? apiError.code.name
          : undefined;
    const message = apiError.message ?? fieldErrorText ?? code;

    if (message && knownMessages[message]) {
      return knownMessages[message];
    }

    if (message) {
      if (message.startsWith("Email already exists")) {
        return knownMessages["Email already exists"];
      }

      if (message === "Data integrity violation" || code === "CONFLICT_DATA_INTEGRITY_VIOLATION") {
        return {
          title: "No se pudo guardar",
          description:
            "Los datos no cumplen las reglas de la base de datos. Si acabas de actualizar los tipos de producto, ejecuta las migraciones del API (V8) y reinicia el backend.",
        };
      }

      return {
        title: apiError.statusCode === 401 ? "No autorizado" : "No se pudo completar la accion",
        description: fieldErrorText ?? message,
      };
    }
  }

  return {
    title: "Error inesperado",
    description: "Intenta nuevamente en unos segundos.",
  };
}
