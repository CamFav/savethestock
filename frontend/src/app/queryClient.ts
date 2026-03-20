import { QueryClient } from "@tanstack/react-query";

type RetriableError = {
  status?: number;
};

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return undefined;
  }

  const status = (error as RetriableError).status;
  return typeof status === "number" ? status : undefined;
}

/// Query client used to manage the caching and fetching of data from the API.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = getErrorStatus(error);
        if (status !== undefined && [400, 401, 403, 404, 409].includes(status)) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
