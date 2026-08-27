import { useState } from "react";
import { approveDeviceLink } from "../api/deviceAuthApi";

export type DeviceApprovalState = {
  userCode: string;
  setUserCode: (value: string) => void;
  isApproving: boolean;
  approvedUserCode: string | null;
  error: string | null;
  approve: () => Promise<void>;
};

export function useDeviceApproval(
  initialUserCode = ""
): DeviceApprovalState {
  const [userCode, setUserCodeState] =
    useState(initialUserCode);

  const [isApproving, setIsApproving] =
    useState(false);

  const [
    approvedUserCode,
    setApprovedUserCode
  ] = useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  function setUserCode(value: string) {
    setApprovedUserCode(null);
    setError(null);
    setUserCodeState(value);
  }

  async function approve() {
    const normalized = userCode
      .trim()
      .toUpperCase();

    if (normalized.length === 0) {
      return;
    }

    setIsApproving(true);
    setError(null);

    try {
      await approveDeviceLink(
        normalized
      );

      setApprovedUserCode(normalized);
    }
    catch (approveError) {
      setError(
        approveError instanceof Error
          ? approveError.message
          : "This device could not be approved."
      );
    }
    finally {
      setIsApproving(false);
    }
  }

  return {
    userCode,
    setUserCode,
    isApproving,
    approvedUserCode,
    error,
    approve
  };
}
