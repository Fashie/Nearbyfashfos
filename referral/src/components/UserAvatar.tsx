import React, { useState } from 'react';

interface UserAvatarProps {
  name: string;
  avatar?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatar,
  className = '',
  size = 'md'
}) => {
  const [imgError, setImgError] = useState(false);

  const getInitials = (str: string) => {
    if (!str) return 'NB';
    const parts = str.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const isMockUrl = avatar?.includes('unsplash.com');
  const showImage = avatar && !isMockUrl && !imgError;

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-lg'
  }[size];

  if (showImage) {
    return (
      <img
        src={avatar}
        alt={name}
        onError={() => setImgError(true)}
        className={`${sizeClasses} rounded-full object-cover border border-[#E5E7EB] dark:border-slate-700 ${className}`}
      />
    );
  }

  const colors = [
    'bg-gradient-to-br from-emerald-500 to-teal-700 text-white',
    'bg-gradient-to-br from-amber-500 to-orange-700 text-white',
    'bg-gradient-to-br from-sky-500 to-blue-700 text-white',
    'bg-gradient-to-br from-purple-500 to-indigo-700 text-white',
    'bg-gradient-to-br from-rose-500 to-red-700 text-white'
  ];
  let charSum = 0;
  for (let i = 0; i < (name || 'Nearby').length; i++) {
    charSum += (name || 'Nearby').charCodeAt(i);
  }
  const colorClass = colors[charSum % colors.length];

  return (
    <div
      className={`${sizeClasses} rounded-full ${colorClass} font-extrabold flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20 select-none ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
