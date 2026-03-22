import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/features/auth/auth.api";
import { getLoginErrorPresentation } from "@/features/auth/auth.error-messages";
import type { ApiError } from "@/shared/api/apiClient";
import { useSessionStore } from "@/shared/auth/sessionStore";

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useSessionStore((s) => s.setSession);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: LoginFormValues) {
    try {
      const auth = await login({ email: values.email, password: values.password });

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
      const presentation = getLoginErrorPresentation(ae);

      if (presentation.fieldErrors?.email) {
        form.setError("email", { message: presentation.fieldErrors.email });
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
          <CardTitle>SaveTheStock</CardTitle>
          <CardDescription>Connectez-vous pour retrouver votre stock et vos operations.</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@entreprise.com"
                  {...form.register("email")}
                />
                {form.formState.errors.email ? (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                {form.formState.errors.password ? (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/register">
              Créer une société
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
