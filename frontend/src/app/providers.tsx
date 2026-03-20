import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { queryClient } from "@/app/queryClient";
import { Toaster } from "@/components/ui/sonner";

/// Provides context providers for the app
export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouterProvider router={router} />
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
