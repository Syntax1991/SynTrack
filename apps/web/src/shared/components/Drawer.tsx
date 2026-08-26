import type { ReactNode } from "react";

type DrawerProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/*
 * Generic right-side drawer for occasional/administrative interactions
 * (add/edit forms, run logging) that should not permanently occupy
 * page space next to a primary account-wide matrix.
 */
export function Drawer({
  title,
  onClose,
  children
}: DrawerProps) {
  return (
    <div
      className="app-drawer-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="app-drawer-panel"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="app-drawer-header">
          <h2>{title}</h2>

          <button
            aria-label="Close"
            className="text-button"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="app-drawer-body">
          {children}
        </div>
      </div>
    </div>
  );
}
