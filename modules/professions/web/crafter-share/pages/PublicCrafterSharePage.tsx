import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { getPublicCrafterShareCard } from "../api/crafterShareApi";
import type { PublicCrafterShareCard } from "../types/crafterShare.types";
import { PublicCrafterShareBody } from "../components/PublicCrafterShareBody";

export function PublicCrafterSharePage() {
  const { token } = useParams();
  const [card, setCard] = useState<PublicCrafterShareCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError("This crafter card is not available.");
      setIsLoading(false);
      return;
    }

    const publicToken = token;
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getPublicCrafterShareCard(publicToken);

        if (!cancelled) {
          setCard(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setCard(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "This crafter card is not available."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="crafter-share-public">
      <div className="crafter-share-public-card">
        <span className="brand-mark">ST</span>
        <p className="crafter-share-eyebrow">CRAFTER CARD</p>

        {isLoading ? <LoadingPanel label="Loading crafts…" /> : null}

        {error ? (
          <>
            <h1>Not available</h1>
            <p>{error}</p>
          </>
        ) : null}

        {card ? <PublicCrafterShareBody card={card} /> : null}

        <Link className="crafter-share-home" to="/">
          SynTrack
        </Link>
      </div>
    </div>
  );
}
