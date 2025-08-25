'use client';

import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number; // pixel size (width = height)
  className?: string;
  updatedAt?: string | Date | null;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function stringToColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 50%)`;
}

export default function Avatar({ src, name, size = 32, className = '', updatedAt }: AvatarProps) {
  const initials = getInitials(name);
  const bg = stringToColor(name || 'user');
  const version = updatedAt ? `?v=${new Date(updatedAt).getTime()}` : '';

  if (src) {
    return (
      <Image
        src={`${src}${version}`}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full text-white flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size, backgroundColor: bg, fontSize: Math.floor(size * 0.4) }}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
}


