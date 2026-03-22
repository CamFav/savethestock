import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRegisterErrorPresentation } from "@/features/auth/auth.error-messages";
import { register } from "@/features/auth/auth.api";
import type { ApiError } from "@/shared/api/apiClient";
import { useSessionStore } from "@/shared/auth/sessionStore";

type RegisterFormValues = {
  companyName: string;
  ownerDisplayName: string;
  ownerEmail: string;
  password: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      companyName: "",
      ownerDisplayName: "",
      ownerEmail: "",
      password: "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: RegisterFormValues) {
    try {
      const auth = await register({
        companyName: values.companyName,
        ownerDisplayName: values.ownerDisplayName,
        ownerEmail: values.ownerEmail,
        password: values.password,
      });

      setSession({
        jwtToken: auth.jwtToken,
        accountId: auth.accountId,
        companyId: auth.companyId,
        companyName: auth.companyName,
        role: auth.role,
        displayName: auth.displayName,
      });

      navigate("/app", { replace: true });
    } catch (err) {
      const ae = err as ApiError;
      const presentation = getRegisterErrorPresentation(ae);

      if (presentation.fieldErrors?.companyName) {
        form.setError("companyName", { message: presentation.fieldErrors.companyName });
      }

      if (presentation.fieldErrors?.ownerDisplayName) {
        form.setError("ownerDisplayName", { message: presentation.fieldErrors.ownerDisplayName });
      }

      if (presentation.fieldErrors?.ownerEmail) {
        form.setError("ownerEmail", { message: presentation.fieldErrors.ownerEmail });
      }

      if (presentation.fieldErrors?.password) {
        form.setError("password", { message: presentation.fieldErrors.password });
      }

      toast.error(presentation.formMessage ?? ae.message ?? `Erreur (${ae.status})`);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Creer une societe</CardTitle>
          <CardDescription>Initialisez votre espace SaveTheStock.</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nom de société</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Logistics"
                  {...form.register("companyName", {
                    validate: (value) => value.trim().length > 0 || "Le nom de société est requis.",
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez le nom qui identifiera votre entreprise dans l'application.
                </p>
                {form.formState.errors.companyName ? (
                  <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerDisplayName">Nom</Label>
                <Input
                  id="ownerDisplayName"
                  placeholder="Jean Dupont"
                  {...form.register("ownerDisplayName", {
                    validate: (value) => value.trim().length > 0 || "Le nom est requis.",
                  })}
                />
                <p className="text-xs text-muted-foreground">Ce nom sera affiché dans votre espace.</p>
                {form.formState.errors.ownerDisplayName ? (
                  <p className="text-sm text-destructive">{form.formState.errors.ownerDisplayName.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@entreprise.com"
                  {...form.register("ownerEmail", {
                    validate: (value) => {
                      const trimmed = value.trim();
                      if (!trimmed) return "L'email est requis.";
                      return /\S+@\S+\.\S+/.test(trimmed) || "Renseignez un email valide.";
                    },
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Utilisez une adresse email accessible: elle servira à vous connecter.
                </p>
                {form.formState.errors.ownerEmail ? (
                  <p className="text-sm text-destructive">{form.formState.errors.ownerEmail.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register("password", {
                    validate: (value) => {
                      if (!value) return "Le mot de passe est requis.";
                      return value.length >= 8 || "Le mot de passe doit contenir au moins 8 caractères.";
                    },
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères. Choisissez un mot de passe unique et difficile à deviner.
                </p>
                {form.formState.errors.password ? (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Création..." : "Créer mon compte"}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/login">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
