import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  icon?: ReactNode;
  description?: string;
  summary?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  icon,
  description,
  summary,
  actions
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <div className="page-header-title-row">
          {icon}
          <h1>{title}</h1>
        </div>

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
