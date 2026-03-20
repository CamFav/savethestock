import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        role: auth.role,
        displayName: auth.displayName,
      });

      navigate("/app", { replace: true });
    } catch (err) {
      const ae = err as ApiError;
      toast.error(ae.message ?? `Erreur (${ae.status})`);
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
                <Input id="companyName" placeholder="Acme Logistics" {...form.register("companyName")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerDisplayName">Nom</Label>
                <Input id="ownerDisplayName" placeholder="Jean Dupont" {...form.register("ownerDisplayName")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@entreprise.com"
                  {...form.register("ownerEmail")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
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
