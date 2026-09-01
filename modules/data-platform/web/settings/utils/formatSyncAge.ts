export function formatSyncAge(
  iso: string | null
): {
  label: string;
  title: string | null;
} {
  if (!iso) {
    return {
      label: "Never",
      title: null
    };
  }

  const date = new Date(iso);
  const title = date.toLocaleString();
  const diffMs =
    Date.now() - date.getTime();

  if (diffMs < 60_000) {
    return {
      label: "Just now",
      title
    };
  }

  const diffMinutes = Math.round(
    diffMs / 60_000
  );

  if (diffMinutes < 60) {
    return {
      label: `${diffMinutes} min ago`,
      title
    };
  }

  const diffHours = Math.round(
    diffMs / 3_600_000
  );

  if (diffHours < 24) {
    return {
      label: `${diffHours}h ago`,
      title
    };
  }

  const today = new Date();

  if (
    date.toDateString() ===
    today.toDateString()
  ) {
    return {
      label: `Today, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })}`,
      title
    };
  }

  return {
    label: date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    title
  };
}
