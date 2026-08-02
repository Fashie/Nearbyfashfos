interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function Loading({
  message = 'Loading...',
  size = 'md',
  fullScreen = false
}: LoadingProps) {
  const spinnerSizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4'
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${spinnerSizes[size]} border-zinc-200 dark:border-zinc-800 border-t-[#0F8A5F] rounded-full animate-spin`}
      />
      {message && (
        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-[#111214] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="p-8 flex items-center justify-center">{content}</div>;
}
