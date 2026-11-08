import { useId } from 'react';

// The Zoya mark. Same geometry as the launcher icon, drawn inline so it stays
// crisp and can inherit a background-free variant for small sizes.
export default function ZoyaMark({ size = 32, withBackground = true }) {
  const id = useId().replace(/[:]/g, '');
  return (
    <svg
      viewBox="0 0 108 108"
      width={size}
      height={size}
      className="zoya-mark"
      aria-hidden="true"
      focusable="false"
    >
      {withBackground && (
        <>
          <defs>
            <linearGradient id={`zoya-bg-${id}`} x1="8" y1="2" x2="100" y2="106" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#2b56bc" />
              <stop offset="1" stopColor="#143b9f" />
            </linearGradient>
          </defs>
          <rect width="108" height="108" rx="26" fill={`url(#zoya-bg-${id})`} />
        </>
      )}
      <path d="M69.5 33 38.5 61" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      <rect x="31" y="25" width="46" height="10" rx="5" fill="#ffffff" />
      <rect x="31" y="59" width="46" height="10" rx="5" fill="#ffffff" />
      <rect x="38" y="77" width="32" height="5" rx="2.5" fill="#feb572" />
    </svg>
  );
}
