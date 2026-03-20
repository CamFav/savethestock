import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
};

export function FeaturePlaceholder({ title, description }: FeaturePlaceholderProps) {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">SaveTheStock</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{description}</p>
      </header>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Work In Progress</CardTitle>
          <CardDescription>This module is scaffolded and ready for integration.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Next step: connect this page to queries, mutations, and domain actions.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
