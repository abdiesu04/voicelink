interface VoztraLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function VoztraLogo({ className = "", width = 200, height = 60 }: VoztraLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* V */}
      <path
        d="M 10 10 L 25 50 L 32 50 L 47 10 L 39 10 L 28.5 40 L 18 10 Z"
        fill="currentColor"
      />
      
      {/* O as chat bubble */}
      <g transform="translate(50, 15)">
        {/* Main bubble circle */}
        <circle cx="15" cy="15" r="14" fill="currentColor" />
        {/* Chat bubble tail */}
        <path
          d="M 8 26 L 5 32 L 12 28 Z"
          fill="currentColor"
        />
        {/* Inner circle to make it hollow */}
        <circle cx="15" cy="15" r="10" fill="var(--background, #0f172a)" />
        {/* Chat lines inside */}
        <line x1="10" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="10" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </g>
      
      {/* Z */}
      <path
        d="M 85 10 L 110 10 L 110 16 L 93 44 L 111 44 L 111 50 L 85 50 L 85 44 L 102 16 L 85 16 Z"
        fill="currentColor"
      />
      
      {/* T */}
      <path
        d="M 115 10 L 145 10 L 145 16 L 133 16 L 133 50 L 127 50 L 127 16 L 115 16 Z"
        fill="currentColor"
      />
      
      {/* R */}
      <path
        d="M 150 10 L 156 10 L 156 27 L 170 27 L 170 10 L 176 10 L 176 50 L 170 50 L 170 33 L 156 33 L 156 50 L 150 50 Z"
        fill="currentColor"
      />
      <path
        d="M 156 10 L 172 10 Q 178 10 178 17 Q 178 24 172 24 L 156 24 Z"
        fill="currentColor"
      />
      
      {/* A */}
      <path
        d="M 180 50 L 186 30 L 198 30 L 204 50 L 198 50 L 196.5 44 L 187.5 44 L 186 50 Z M 188.5 39 L 195.5 39 L 192 25 Z"
        fill="currentColor"
      />
    </svg>
  );
}
