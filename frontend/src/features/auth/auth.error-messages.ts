import type { ApiError } from "@/shared/api/apiClient";

type AuthErrorPresentation = {
  formMessage?: string;
  fieldErrors?: Record<string, string>;
};

function getFirstFieldError(apiError: ApiError, ...candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const values = apiError.fieldErrors?.[candidate];
    if (Array.isArray(values) && values.length > 0) {
      return values[0];
    }
  }

  return undefined;
}

export function getLoginErrorPresentation(apiError: ApiError): AuthErrorPresentation {
  if (apiError.status === 404) {
    return {
      formMessage: "Impossible de se connecter.",
    };
  }

  if (apiError.status === 401) {
    return {
      formMessage: apiError.message ?? "Mot de passe incorrect.",
      fieldErrors: { password: apiError.message ?? "Mot de passe incorrect." },
    };
  }

  if (apiError.status === 429) {
    return {
      formMessage: apiError.message ?? "Trop de tentatives de connexion. Réessayez plus tard.",
    };
  }

  if (apiError.status === 400) {
    return {
      formMessage: apiError.message ?? "Veuillez vérifier les informations saisies.",
      fieldErrors: {
        email: getFirstFieldError(apiError, "Email", "email") ?? "",
        password: getFirstFieldError(apiError, "Password", "password") ?? "",
      },
    };
  }

  return {
    formMessage: apiError.message ?? "Impossible de se connecter pour le moment.",
  };
}

export function getRegisterErrorPresentation(apiError: ApiError): AuthErrorPresentation {
  if (apiError.status === 400) {
    const emailError =
      getFirstFieldError(apiError, "OwnerEmail", "ownerEmail") ??
      (apiError.message?.toLowerCase().includes("email") ? apiError.message : undefined);

    return {
      formMessage: apiError.message ?? "Veuillez vérifier les informations saisies.",
      fieldErrors: {
        companyName: getFirstFieldError(apiError, "CompanyName", "companyName") ?? "",
        ownerDisplayName: getFirstFieldError(apiError, "OwnerDisplayName", "ownerDisplayName") ?? "",
        ownerEmail: emailError ?? "",
        password: getFirstFieldError(apiError, "Password", "password") ?? "",
      },
    };
  }

  return {
    formMessage: apiError.message ?? "Impossible de créer le compte pour le moment.",
  };
}
