interface FreshSipLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  variant?: "full" | "icon";
  className?: string;
  dark?: boolean; // Use on dark backgrounds
}

export default function FreshSipLogo({
  size = "md",
  showTagline = false,
  variant = "full",
  className = "",
  dark = false,
}: FreshSipLogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-base", tagline: "text-[8px]" },
    md: { icon: 36, text: "text-lg", tagline: "text-[9px]" },
    lg: { icon: 48, text: "text-2xl", tagline: "text-xs" },
    xl: { icon: 64, text: "text-3xl", tagline: "text-sm" },
  };

  const { icon: iconSize, text: textSize, tagline: taglineSize } = sizes[size];

  // Orange slice SVG icon
  const OrangeSlice = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      {/* Orange outer circle with gradient */}
      <defs>
        <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA726" />
          <stop offset="50%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#F57C00" />
        </linearGradient>
        <linearGradient id="pulpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFCC80" />
          <stop offset="100%" stopColor="#FFB74D" />
        </linearGradient>
      </defs>
      
      {/* Orange rind (outer) */}
      <circle cx="32" cy="32" r="30" fill="url(#orangeGradient)" />
      
      {/* Inner pulp circle */}
      <circle cx="32" cy="32" r="24" fill="url(#pulpGradient)" />
      
      {/* White center */}
      <circle cx="32" cy="32" r="6" fill="#FFFFFF" />
      
      {/* Segment lines - radiating from center */}
      <g stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
        <line x1="32" y1="32" x2="32" y2="8" />
        <line x1="32" y1="32" x2="52" y2="15" />
        <line x1="32" y1="32" x2="56" y2="32" />
        <line x1="32" y1="32" x2="52" y2="49" />
        <line x1="32" y1="32" x2="32" y2="56" />
        <line x1="32" y1="32" x2="12" y2="49" />
        <line x1="32" y1="32" x2="8" y2="32" />
        <line x1="32" y1="32" x2="12" y2="15" />
      </g>
      
      {/* Leaf at top */}
      <ellipse cx="32" cy="4" rx="6" ry="4" fill="#4CAF50" transform="rotate(-15 32 4)" />
      <ellipse cx="36" cy="5" rx="5" ry="3" fill="#66BB6A" transform="rotate(20 36 5)" />
    </svg>
  );

  if (variant === "icon") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <OrangeSlice />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <OrangeSlice />
      <div className="flex flex-col">
        <span className={`font-bold ${dark ? 'text-white' : 'text-gray-900'} ${textSize} leading-tight`}>
          Fresh<span className="text-orange-500">Sip</span>
        </span>
        {showTagline && (
          <span className={`${dark ? 'text-gray-400' : 'text-gray-500'} ${taglineSize} -mt-0.5 italic`}>
            Non Preservative Juice
          </span>
        )}
      </div>
    </div>
  );
}

// Header version - with cloud-like orange background
export function FreshSipLogoHeader({ size = "md" }: { size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? 32 : 40;
  
  return (
    <div className="flex items-center gap-2">
      {/* Orange cloud background with logo */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full blur-sm opacity-80" 
             style={{ width: iconSize + 8, height: iconSize + 8, top: -4, left: -4 }} />
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Orange slice design */}
          <defs>
            <linearGradient id="headerOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFCC80" />
              <stop offset="100%" stopColor="#FFB74D" />
            </linearGradient>
          </defs>
          
          <circle cx="32" cy="32" r="28" fill="url(#headerOrangeGrad)" />
          <circle cx="32" cy="32" r="5" fill="#FFFFFF" />
          
          <g stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round">
            <line x1="32" y1="32" x2="32" y2="6" />
            <line x1="32" y1="32" x2="50" y2="14" />
            <line x1="32" y1="32" x2="58" y2="32" />
            <line x1="32" y1="32" x2="50" y2="50" />
            <line x1="32" y1="32" x2="32" y2="58" />
            <line x1="32" y1="32" x2="14" y2="50" />
            <line x1="32" y1="32" x2="6" y2="32" />
            <line x1="32" y1="32" x2="14" y2="14" />
          </g>
        </svg>
      </div>
      
      <span className={`font-bold text-gray-900 ${size === "sm" ? "text-lg" : "text-xl"}`}>
        Fresh<span className="text-orange-500">Sip</span>
      </span>
    </div>
  );
}
