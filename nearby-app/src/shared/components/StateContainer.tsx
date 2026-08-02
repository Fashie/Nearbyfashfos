import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, WifiOff, RefreshCw, Archive } from 'lucide-react';

interface StateContainerProps {
  isLoading: boolean;
  isEmpty: boolean;
  isOffline: boolean;
  error: string | null;
  onRetry?: () => void;
  loadingSkeleton?: React.ReactNode;
  emptyLabel?: string;
  emptyIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const StateContainer: React.FC<StateContainerProps> = ({
  isLoading,
  isEmpty,
  isOffline,
  error,
  onRetry,
  loadingSkeleton,
  emptyLabel = "No items to display.",
  emptyIcon,
  children
}) => {
  // 1. Offline State (highest priority if we have no loaded data)
  if (isOffline && isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-8 text-center space-y-4 my-auto h-full min-h-[300px]"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 flex items-center justify-center text-amber-500">
          <WifiOff className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">You are offline</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
            Please check your internet connection. Some features may be unavailable in offline mode.
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-4 h-10 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-medium text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        )}
      </motion.div>
    );
  }

  // 2. Error State
  if (error && isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-8 text-center space-y-4 my-auto h-full min-h-[300px]"
      >
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 animate-bounce">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Something went wrong</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs font-mono text-center">
            {error}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 px-4 h-10 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-medium text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
      </motion.div>
    );
  }

  // 3. Loading State
  if (isLoading) {
    return loadingSkeleton ? (
      <div className="w-full">{loadingSkeleton}</div>
    ) : (
      <div className="p-6 space-y-4 w-full">
        <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4 animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="p-4 bg-neutral-100 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 rounded-2xl animate-pulse flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. Empty State
  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 text-center space-y-4 my-auto h-full min-h-[300px]"
      >
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
          {emptyIcon || <Archive className="w-8 h-8" />}
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">Empty List</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
            {emptyLabel}
          </p>
        </div>
      </motion.div>
    );
  }

  // 5. Success State
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full"
    >
      {/* Dynamic Network Status Ribbon */}
      {isOffline && (
        <div className="bg-amber-500 text-white text-[11px] font-bold py-1.5 px-4 text-center select-none flex items-center justify-center space-x-1 w-full shrink-0 z-50">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Mode — showing cached data locally</span>
        </div>
      )}
      {children}
    </motion.div>
  );
};

export default StateContainer;
