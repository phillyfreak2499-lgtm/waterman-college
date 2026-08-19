import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listProgress, type ProgressRow } from "@/lib/progress";

type ProgressContextValue = {
  rows: ProgressRow[];
  ready: boolean;
  refresh: () => Promise<void>;
  replace: (rows: ProgressRow[]) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const userId = user?.id ?? null;
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setRows(await listProgress());
    } catch {
      setRows([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!userId) {
      setRows([]);
      setReady(true);
      return;
    }
    void refresh();
  }, [userId, isPending, refresh]);

  const value = useMemo(
    () => ({
      rows,
      ready,
      refresh,
      replace: setRows,
    }),
    [rows, ready, refresh],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    return {
      rows: [] as ProgressRow[],
      ready: false,
      refresh: async () => undefined,
      replace: (_rows: ProgressRow[]) => undefined,
    };
  }
  return ctx;
}
