import type { Friend } from '@/data/friends';

const SIZES = {
  sm: 'h-9 w-9 text-[13px]',
  md: 'h-12 w-12 text-base',
  lg: 'h-20 w-20 text-3xl',
} as const;

export default function FriendAvatar({
  friend,
  size = 'md',
}: {
  friend: Friend;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm ${SIZES[size]}`}
      style={{ backgroundColor: friend.color }}
      aria-hidden
    >
      {friend.avatar}
    </span>
  );
}
