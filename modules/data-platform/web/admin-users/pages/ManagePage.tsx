import { Navigate } from "react-router-dom";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { AdminUsersPanel } from "../components/AdminUsersPanel";
import { useIsOperator } from "../hooks/useIsOperator";

export function ManagePage() {
  const { isChecking, isOperator } = useIsOperator();

  if (isChecking) {
    return <LoadingPanel label="Checking operator access…" />;
  }

  if (!isOperator) {
    return <Navigate replace to="/" />;
  }

  return (
    <div className="guild-page guild-page-narrow">
      <PageHeader
        description="Approve registrations, disable access, stop public crafter sharing, or delete an account and its owned characters."
        eyebrow="CONTROL"
        title="Manage"
      />
      <AdminUsersPanel />
    </div>
  );
}
