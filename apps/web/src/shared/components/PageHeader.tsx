import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  summary?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  summary,
  actions
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>

        {description && (
          <p className="page-description">
            {description}
          </p>
        )}

        {summary && (
          <p className="page-summary">
            {summary}
          </p>
        )}
      </div>

      {actions && (
        <div className="page-actions">
          {actions}
        </div>
      )}
    </header>
  );
}