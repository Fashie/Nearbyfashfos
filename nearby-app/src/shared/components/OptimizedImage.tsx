import React, { useState, useEffect } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  fallbackElement?: React.ReactNode;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = React.memo(({
  src,
  alt = '',
  className = '',
  fallbackElement,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }
    setLoaded(false);
    setError(false);

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setLoaded(true);
    };
    img.onerror = () => {
      setError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (error) {
    return fallbackElement ? (
      <div className={className}>{fallbackElement}</div>
    ) : (
      <div className={`bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs text-neutral-400 select-none ${className}`}>
        📷
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading Placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
      )}
      
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          {...props}
        />
      )}
    </div>
  );
});

export default OptimizedImage;
