import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Fintr</h1>
        <p className="mt-2 text-muted-foreground">
          Your household finance tracker
        </p>
      </div>
    </div>
  );
}
