import { QueryClient } from "@tanstack/react-query";

/// Query client used to manage the caching and fetching of data from the API.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        const status = error?.status;
        if ([400, 401, 403, 404, 409].includes(status)) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});