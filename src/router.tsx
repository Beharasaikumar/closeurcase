import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/** Shown while a lazily code-split route chunk is still downloading. Routes
 * are split per-file (see `autoCodeSplitting` in vite.config.ts), so the
 * first visit to any route fetches its JS on demand — this keeps that gap
 * from rendering as a frozen screen. */
// eslint-disable-next-line react-refresh/only-export-components
function RoutePending() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    scrollToTopSelectors: ["main", "#dashboard-main", "[data-scroll-container]"],
    defaultPreloadStaleTime: 0,
    // Warm the code-split chunk (and loader data) for a route as soon as the
    // user hovers/touches a link to it, so the lazy load is usually finished
    // before they click.
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    // Fallback UI while a route chunk downloads. `defaultPendingMs` avoids a
    // flash of the spinner for chunks that resolve near-instantly (cached).
    defaultPendingComponent: RoutePending,
    defaultPendingMs: 150,
    defaultPendingMinMs: 300,
  });

  return router;
};
