import type { ReactNode } from "react";

type SettingsTrustDetailListProps = {
  children: ReactNode;
};

export function SettingsTrustDetailList({
  children
}: SettingsTrustDetailListProps) {
  return (
    <dl className="integration-details settings-trust-details">
      {children}
    </dl>
  );
}

type SettingsTrustDetailRowProps = {
  label: string;
  value: ReactNode;
  title?: string | null;
};

export function SettingsTrustDetailRow({
  label,
  value,
  title
}: SettingsTrustDetailRowProps) {
  return (
    <div>
      <dt>{label}</dt>
      <dd title={title ?? undefined}>
        {value}
      </dd>
    </div>
  );
}
