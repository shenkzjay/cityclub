interface JerseyProps {
  primary: string;
  secondary: string;
  badge?: string;
  className?: string;
}

export function Jersey({ primary, secondary, badge, className }: JerseyProps) {
  return (
    <svg
      viewBox="0 0 200 180"
      className={className}
      role="img"
      aria-label={badge ? `${badge} team jersey` : "team jersey"}
    >
      <path
        d="M100 32 L110 32 L124 44 L176 58 L176 88 L142 82 L160 150 L144 166 L56 166 L40 150 L58 82 L24 88 L24 58 L76 44 L90 32 Z"
        fill={primary}
      />
      <path d="M100 36 L112 46 L100 58 L88 46 Z" fill={secondary} />
      <rect x="170" y="60" width="6" height="26" rx="2" fill={secondary} />
      <rect x="24" y="60" width="6" height="26" rx="2" fill={secondary} />
      {badge ? (
        <g>
          <circle cx="100" cy="94" r="15" fill={secondary} />
          <text
            x="100"
            y="99"
            textAnchor="middle"
            fontSize="17"
            fontWeight="700"
            fill={primary}
          >
            {badge.slice(0, 2).toUpperCase()}
          </text>
        </g>
      ) : null}
    </svg>
  );
}