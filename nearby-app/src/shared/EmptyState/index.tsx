import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto font-sans">
      {icon && <div className="text-zinc-300 dark:text-zinc-700 mb-4">{icon}</div>}
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
          {description}
        </p>
      )}
      {action && <div className="w-full flex justify-center">{action}</div>}
    </div>
  );
}
