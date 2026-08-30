import { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { setRaiderSessionToken } from "../../../../../apps/web/src/shared/api/raiderSession";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { isSafeInternalPath } from "../utils/internalPath";

function extractTokenFromHash(
  hash: string
): string | null {
  const match =
    /token=([^&]+)/u.exec(hash);

  return match
    ? decodeURIComponent(match[1])
    : null;
}

export function RaiderLoginCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] =
    useSearchParams();

  const [error, setError] =
    useState<string | null>(null);

  // Captured once, during render, before anything has a chance to clear
  // it - React 18/19 StrictMode double-invokes effects (and this same
  // lazy initializer) in development, and re-reading the live
  // window.location.hash from inside the effect would see it already
  // stripped by the first invocation's replaceState, misreading a real
  // token as "missing" on the second pass.
  const [initialHash] = useState(
    () => window.location.hash
  );

  useEffect(() => {
    const token = extractTokenFromHash(
      initialHash
    );

    if (token) {
      setRaiderSessionToken(token);

      const rawReturnTo =
        searchParams.get("returnTo");

      const destination =
        isSafeInternalPath(
          rawReturnTo
        )
          ? rawReturnTo
          : "/";

      window.history.replaceState(
        null,
        "",
        window.location.pathname
      );

      navigate(destination, {
        replace: true
      });

      return;
    }

    setError(
      searchParams.get("error") ??
        "Battle.net-Login fehlgeschlagen."
    );
  }, [initialHash, navigate, searchParams]);

  return (
    <>
      <PageHeader
        description="Connecting your Battle.net account."
        eyebrow="LOGIN"
        title="Battle.net Login"
      />

      {error ? (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      ) : (
        <LoadingPanel />
      )}
    </>
  );
}
