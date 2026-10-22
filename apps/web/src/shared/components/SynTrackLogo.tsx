import { useId } from "react";

type SynTrackMarkProps = {
  size?: number;
  className?: string;
  /* Decorative next to a visible "SynTrack" label; announced otherwise. */
  decorative?: boolean;
};

/*
 * SynTrack mark: one continuous "S" drawn as a track line, starting at
 * a progress point, on a violet tile. Same geometry as
 * /public/favicon.svg - keep both in sync.
 */
export function SynTrackMark({ size = 32, className, decorative = false }: SynTrackMarkProps) {
  const gradientId = useId();

  return (
    <svg
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "SynTrack"}
      className={className}
      height={size}
      role={decorative ? undefined : "img"}
      viewBox="0 0 32 32"
      width={size}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#8f81f5" />
          <stop offset="1" stopColor="#5f4fe0" />
        </linearGradient>
      </defs>
      <rect fill={`url(#${gradientId})`} height="32" rx="8.5" width="32" />
      <path
        d="M19.75 9.5H13a3.25 3.25 0 0 0 0 6.5h6a3.25 3.25 0 0 1 0 6.5H9.25"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.75"
      />
      <circle cx="23.6" cy="9.5" fill="#ffffff" r="1.9" />
    </svg>
  );
}

type SynTrackLogoProps = {
  markSize?: number;
  className?: string;
};

/* Mark + wordmark lockup. The wordmark is live Inter text, not an image. */
export function SynTrackLogo({ markSize = 30, className }: SynTrackLogoProps) {
  return (
    <span className={className ? `syntrack-logo ${className}` : "syntrack-logo"}>
      <SynTrackMark decorative size={markSize} />
      <span className="syntrack-logo-wordmark">SynTrack</span>
    </span>
  );
}
