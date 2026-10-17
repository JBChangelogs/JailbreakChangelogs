export const IMAGE_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 854 480">
    <defs>
      <linearGradient id="shimmer">
        <stop stop-color="#fff" stop-opacity="0" />
        <stop offset=".5" stop-color="#fff" stop-opacity=".2" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
    </defs>
    <style>
      rect { animation: shimmer 1s infinite; }
      @keyframes shimmer { from { transform: translateX(-854px); } to { transform: translateX(854px); } }
      @media (prefers-reduced-motion: reduce) { rect { animation: none; } }
    </style>
    <rect width="854" height="480" fill="url(#shimmer)" />
  </svg>
`)}` as const;
