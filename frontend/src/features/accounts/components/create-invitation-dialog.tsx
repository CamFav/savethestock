import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Check, Copy, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Invitation } from "@/features/invitations/api/invitations.types";

type FormValues = {
  displayName: string;
  email: string;
};

type CreateInvitationDialogProps = {
  open: boolean;
  pending: boolean;
  invitation: Invitation | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { displayName: string; email: string; role: "MEMBER" }) => Promise<void> | void;
};

function getInvitationUrl(invitationPath: string): string {
  if (typeof window === "undefined") {
    return invitationPath;
  }

  return new URL(invitationPath, window.location.origin).toString();
}

export function CreateInvitationDialog({
  open,
  pending,
  invitation,
  onOpenChange,
  onSubmit,
}: CreateInvitationDialogProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      displayName: "",
      email: "",
    },
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      form.reset({ displayName: "", email: "" });
      setCopied(false);
    }
  }, [form, open]);

  async function handleCopyLink() {
    if (!invitation) return;

    const url = getInvitationUrl(invitation.invitationPath);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function handleSubmit(values: FormValues) {
    const displayName = values.displayName.trim();
    const email = values.email.trim();

    if (!displayName) {
      form.setError("displayName", { message: "Le nom est requis." });
      return;
    }

    if (!email) {
      form.setError("email", { message: "L’email est requis." });
      return;
    }

    await onSubmit({
      displayName,
      email,
      role: "MEMBER",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Générez un lien d’invitation à copier manuellement. Le nom affiché du futur compte sera fixé ici.
          </DialogDescription>
        </DialogHeader>

        {invitation ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Lien d’invitation généré</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{getInvitationUrl(invitation.invitationPath)}</p>
            </div>

            <div className="rounded-lg border border-border/70 p-4">
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Nom</dt>
                  <dd className="font-medium text-foreground">{invitation.displayName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium text-foreground">{invitation.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Rôle</dt>
                  <dd className="font-medium text-foreground">Membre</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Expire le</dt>
                  <dd className="font-medium text-foreground">
                    {new Date(invitation.expiresAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              </dl>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => void handleCopyLink()}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Lien copié" : "Copier le lien"}
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                <LinkIcon className="h-4 w-4" />
                Fermer
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du futur membre</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={pending} placeholder="Ex. Sarah Martin" maxLength={100} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" disabled={pending} placeholder="sarah@restaurant.fr" maxLength={255} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-sm text-muted-foreground">
                Role attribue pour cette invitation : <span className="font-medium text-foreground">Membre</span>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Génération..." : "Générer le lien d’invitation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
