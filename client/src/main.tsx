import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider data stale
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Don't retry on abort errors (navigation)
        if (error instanceof Error && error.name === 'AbortError') return false;
        if (error instanceof Error && error.message?.includes('Load failed')) return false;
        if (error instanceof Error && error.message?.includes('Failed to fetch')) return false;
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: 1000,
    },
  },
});

// Check if error should be ignored (navigation-related)
const isIgnorableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const msg = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';
    // Ignore abort/navigation errors
    if (name === 'aborterror') return true;
    if (msg.includes('load failed')) return true;
    if (msg.includes('failed to fetch')) return true;
    if (msg.includes('aborted')) return true;
    if (msg.includes('cancelled')) return true;
    if (msg.includes('network request failed')) return true;
  }
  return false;
};

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    // Ignore navigation-related errors (load failed, abort, etc.)
    if (isIgnorableError(error)) return;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    // Ignore navigation-related errors
    if (isIgnorableError(error)) return;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        // Get admin token from localStorage if available
        let headers: Record<string, string> = {};
        try {
          const auth = localStorage.getItem("adminAuth");
          if (auth) {
            const parsed = JSON.parse(auth);
            if (parsed.isAuthenticated) {
              const token = btoa(JSON.stringify({
                username: parsed.username,
                password: "sanjeet@sau405"
              }));
              headers["x-admin-token"] = token;
            }
          }
        } catch (e) {
          // ignore
        }
        
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
          headers: {
            ...(init?.headers ?? {}),
            ...headers,
          },
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
