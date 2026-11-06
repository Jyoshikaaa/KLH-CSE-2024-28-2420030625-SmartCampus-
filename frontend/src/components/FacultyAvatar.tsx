import React from 'react';

interface FacultyAvatarProps {
  photoPath?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'card' | 'profile';
  className?: string;
  showBadge?: boolean;
}

export const FacultyAvatar: React.FC<FacultyAvatarProps> = ({
  photoPath,
  name,
  size = 'md',
  className = '',
  showBadge = true,
}) => {
  const getInitials = (n: string) => {
    if (!n) return 'FL';
    const clean = n.replace(/^(Dr|Mr|Ms|Mrs|Prof)\.?\s*/i, '').trim();
    const parts = clean.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs rounded-xl',
    md: 'w-14 h-14 text-sm rounded-xl',
    lg: 'w-24 h-24 text-lg rounded-2xl',
    xl: 'w-32 h-32 text-xl rounded-2xl',
    '2xl': 'w-40 h-40 text-2xl rounded-3xl',
    card: 'w-full h-44 text-xl rounded-2xl',
    profile: 'w-44 h-52 sm:w-48 sm:h-56 text-2xl rounded-3xl',
  };

  const hasPhoto = Boolean(photoPath);

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} overflow-hidden border border-slate-200/90 bg-slate-100 flex items-center justify-center font-bold text-slate-600 transition-all duration-300 group-hover:scale-[1.01] shadow-xs`}
      >
        {hasPhoto ? (
          <img
            src={photoPath!}
            alt={name}
            className="w-full h-full object-cover object-top"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const span = document.createElement('span');
                span.innerText = getInitials(name);
                span.className = 'text-slate-800 font-bold text-lg';
                parent.appendChild(span);
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200/70 flex flex-col items-center justify-center p-2 text-center">
            <span className="text-slate-700 font-extrabold tracking-wider">{getInitials(name)}</span>
            {showBadge && size !== 'sm' && (
              <span className="text-[10px] text-slate-400 font-medium mt-1">Photo unavailable</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
