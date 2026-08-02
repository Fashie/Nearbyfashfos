import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'flat' | 'outline';
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-2xl p-4 transition-all duration-200 overflow-hidden';
  
  const variants = {
    default: 'bg-white dark:bg-[#111214] border border-zinc-100 dark:border-zinc-800 shadow-sm',
    flat: 'bg-zinc-50 dark:bg-zinc-900',
    outline: 'bg-transparent border border-zinc-200 dark:border-zinc-800'
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
