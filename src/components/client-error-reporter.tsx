import { useEffect } from "react";
import { installClientErrorReporter } from "@/lib/client-errors";

/** Installs the window error/rejection reporter once, on the client. */
export function ClientErrorReporter() {
  useEffect(() => {
    installClientErrorReporter();
  }, []);
  return null;
}
