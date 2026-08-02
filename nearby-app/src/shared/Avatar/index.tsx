interface AvatarProps {
  src?: string | null;
  name?: string;
  emoji?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  src,
  name,
  emoji,
  color = '#A3A3A3',
  size = 'md',
  className = ''
}: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-3xl'
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-lg'
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        referrerPolicy="no-referrer"
        className={`${sizes[size]} rounded-full object-cover border border-zinc-200 dark:border-zinc-800 ${className}`}
      />
    );
  }

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div
      style={{ backgroundColor: color }}
      className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-semibold font-sans ${className}`}
    >
      {emoji ? (
        <span className="select-none">{emoji}</span>
      ) : (
        <span className={textSizes[size]}>{initials}</span>
      )}
    </div>
  );
}
