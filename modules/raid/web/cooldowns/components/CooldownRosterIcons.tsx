/**
 * Small local icon primitives, following the same convention as
 * ModuleIcon (apps/web/src/shared/components/ModuleIcon.tsx): plain
 * stroke-based SVG paths on a 24x24 viewBox, no icon-library
 * dependency. Scoped to this module since nothing outside the
 * Cooldown Planner needs an eye/settings glyph today.
 */

export function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="cooldown-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}

export function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      className="cooldown-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle
        cx="12"
        cy="12"
        r="3"
      />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export function SpellSettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="cooldown-icon"
      fill="none"
      viewBox="0 0 24 24"
    >
      <line
        x1="4"
        x2="20"
        y1="6"
        y2="6"
      />
      <circle
        cx="9"
        cy="6"
        r="2"
      />
      <line
        x1="4"
        x2="20"
        y1="12"
        y2="12"
      />
      <circle
        cx="15"
        cy="12"
        r="2"
      />
      <line
        x1="4"
        x2="20"
        y1="18"
        y2="18"
      />
      <circle
        cx="9"
        cy="18"
        r="2"
      />
    </svg>
  );
}
