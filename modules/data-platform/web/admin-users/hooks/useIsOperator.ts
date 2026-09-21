import { useEffect, useState } from "react";
import { getRaiderSessionStatus } from "../../raider-auth/api/raiderAuthApi";

export function useIsOperator(): {
  isChecking: boolean;
  isOperator: boolean;
} {
  const [isChecking, setIsChecking] = useState(true);
  const [isOperator, setIsOperator] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getRaiderSessionStatus()
      .then((status) => {
        if (!cancelled) {
          setIsOperator(status.isAdmin === true);
          setIsChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsOperator(false);
          setIsChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { isChecking, isOperator };
}
