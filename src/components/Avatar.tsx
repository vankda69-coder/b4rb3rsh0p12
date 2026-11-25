import { useState } from 'react';
import { getInitials } from '../utils/formatters';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        aria-hidden="true"
        className={`${SIZE_CLASSES[size]} shrink-0 rounded-full bg-zinc-200/80 text-zinc-700 font-medium flex items-center justify-center select-none border border-zinc-300/60`}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${SIZE_CLASSES[size]} shrink-0 rounded-full object-cover border border-zinc-200 bg-zinc-100`}
    />
  );
}
