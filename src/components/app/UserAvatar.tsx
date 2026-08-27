import { avatarUrlFor } from "@/data/avatarPool";

const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-20 w-20",
};

const SIZE_PX = {
  sm: 64,
  md: 96,
  lg: 160,
};

export function UserAvatar({
  name,
  photoUrl,
  size = "md",
  className = "",
}: {
  name: string;
  photoUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const sizeCls = SIZE_CLASSES[size];
  const src = photoUrl || avatarUrlFor(name, SIZE_PX[size]);

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeCls} shrink-0 rounded-full border border-border object-cover shadow-sm ${className}`}
    />
  );
}
