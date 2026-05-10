interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export const LoadingWave = ({ size = 'md', className = '' }: LoaderProps) => (
  <div
    className={`${sizeMap[size]} ${className} flex items-center justify-center gap-[3px]`}
    role="status"
    aria-label="Loading"
  >
    {[0, 0.15, 0.3, 0.45].map((delay, i) => (
      <span
        key={i}
        className="block w-1.5 rounded-full bg-wine"
        style={{
          height: '60%',
          animation: `loader-wave 1s ease-in-out ${delay}s infinite`,
        }}
      />
    ))}
  </div>
);

export const LoadingWine = ({ size = 'md', className = '' }: LoaderProps) => (
  <div
    className={`${sizeMap[size]} ${className} flex items-center justify-center`}
    role="status"
    aria-label="Loading"
  >
    <div className="w-3/4 h-3/4 rounded-full animate-spin border-4 border-muted border-t-wine" />
  </div>
);

export const LoadingNetworkError = ({ size = 'md', className = '' }: LoaderProps) => (
  <div
    className={`${sizeMap[size]} ${className} flex items-center justify-center text-destructive animate-pulse`}
    role="alert"
    aria-label="Network error"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  </div>
);

export const LoadingSpinner = ({ size = 'md', className = '' }: LoaderProps) => (
  <div
    className={`${sizeMap[size]} ${className} flex items-center justify-center`}
    role="status"
    aria-label="Loading"
  >
    <div className="w-3/4 h-3/4 rounded-full animate-spin border-4 border-muted border-t-primary" />
  </div>
);

// Backward-compatible aliases (no lottie-react dependency)
export const LottieLoader = LoadingSpinner;
export const LoadingDots = LoadingWave;
export const LoadingPulse = LoadingWine;
