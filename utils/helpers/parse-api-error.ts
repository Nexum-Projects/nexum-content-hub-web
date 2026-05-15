export type HumanizedError = {
  title: string;
  description: string;
};

type ApiErrorResponse = {
  code?: string;
  message?: string;
  statusCode?: number;
  type?: string;
  details?: Record<string, unknown>;
};

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
};

export function parseApiError(error: unknown): HumanizedError {
  if (typeof error === "string") {
    return knownMessages[error] ?? { title: "Error", description: error };
  }

  if (error && typeof error === "object") {
    const apiError = error as ApiErrorResponse;
    const message = apiError.message ?? apiError.code;

    if (message && knownMessages[message]) {
      return knownMessages[message];
    }

    if (message) {
      if (message.startsWith("Email already exists")) {
        return knownMessages["Email already exists"];
      }

      return {
        title: apiError.statusCode === 401 ? "No autorizado" : "No se pudo completar la accion",
        description: message,
      };
    }
  }

  return {
    title: "Error inesperado",
    description: "Intenta nuevamente en unos segundos.",
  };
}
