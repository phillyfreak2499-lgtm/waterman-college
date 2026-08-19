import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_PAGES, DEFAULT_SITE, getCatalog, getPublicCatalog, type Catalog } from "@/lib/cms";
import { roles as defaultRoles } from "@/lib/content";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

const fallback: Catalog = {
  site: DEFAULT_SITE,
  roles: defaultRoles,
  tracks: [],
  news: [],
  pages: DEFAULT_PAGES,
};

type CatalogContextValue = {
  catalog: Catalog;
  ready: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  replace: (next: Catalog) => void;
};

const CatalogContext = createContext<CatalogContextValue>({
  catalog: fallback,
  ready: false,
  error: null,
  refresh: async () => undefined,
  replace: () => undefined,
});

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id ?? null;
  const [catalog, setCatalog] = useState<Catalog>(fallback);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCatalog(userId ? await getCatalog() : await getPublicCatalog());
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not load current college content.",
      );
    } finally {
      setReady(true);
    }
  }, [userId]);

  useEffect(() => {
    if (isPending) return;
    // Guard against a late resolve landing after unmount (or after the viewer
    // changed), which would otherwise setState on a dead component.
    let cancelled = false;
    void (async () => {
      try {
        const next = userId ? await getCatalog() : await getPublicCatalog();
        if (cancelled) return;
        setCatalog(next);
        setError(null);
      } catch (reason) {
        if (cancelled) return;
        setError(
          reason instanceof Error ? reason.message : "Could not load current college content.",
        );
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPending, userId]);

  const value = useMemo(
    () => ({ catalog, ready, error, refresh, replace: setCatalog }),
    [catalog, ready, error, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  return useContext(CatalogContext);
}
