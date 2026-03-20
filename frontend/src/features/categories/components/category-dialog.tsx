import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
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

type CategoryDialogValues = {
  name: string;
};

type CategoryDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  defaultName?: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
};

export function CategoryDialog({
  open,
  mode,
  defaultName,
  onOpenChange,
  onSubmit,
}: CategoryDialogProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<CategoryDialogValues>({
    defaultValues: {
      name: defaultName ?? "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (!open) return;
    form.reset({ name: defaultName ?? "" });
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [defaultName, form, open]);

  const title = useMemo(() => (mode === "create" ? "New category" : "Edit category"), [mode]);
  const submitLabel = useMemo(() => {
    if (mode === "create") return isSubmitting ? "Creating..." : "Create";
    return isSubmitting ? "Saving..." : "Save changes";
  }, [isSubmitting, mode]);

  async function handleSubmit(values: CategoryDialogValues) {
    const name = values.name.trim();
    if (!name) {
      form.setError("name", { message: "Name is required." });
      return;
    }
    await onSubmit(name);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a category to organize your products."
              : "Update the category name."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="name"
              rules={{
                validate: (value) => (value.trim().length > 0 ? true : "Name is required."),
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      ref={(el) => {
                        field.ref(el);
                        inputRef.current = el;
                      }}
                      autoComplete="off"
                      disabled={isSubmitting}
                      maxLength={100}
                      placeholder="e.g. Fresh produce"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
