import { Star } from "lucide-react";
import { avatarUrlFor } from "@/data/avatarPool";
import { lawyers as MOCK_LAWYERS } from "@/data/mock";

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

type PlanTier = "bronze" | "silver" | "gold";

const BADGE_CONFIGS: Record<
  PlanTier,
  {
    label: string;
    ringCls: string;
    badgeCls: string;
    starCls: string;
  }
> = {
  bronze: {
    label: "Bronze Member",
    ringCls: "ring-2 ring-[#8B5E3C]",
    badgeCls: "bg-[#7A4B1B] text-white border-2 border-background shadow-xs",
    starCls: "fill-white text-white",
  },
  silver: {
    label: "Silver Member",
    ringCls: "ring-2 ring-slate-400 dark:ring-slate-500",
    badgeCls: "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-950 border-2 border-background shadow-xs",
    starCls: "fill-current text-white dark:text-slate-950",
  },
  gold: {
    label: "Gold VIP Member",
    ringCls: "ring-2 ring-amber-400 dark:ring-yellow-400",
    badgeCls: "bg-amber-400 text-slate-950 border-2 border-background shadow-xs shadow-amber-500/30",
    starCls: "fill-slate-950 text-slate-950",
  },
};

const BADGE_SIZE_CLASSES = {
  sm: { badge: "h-3.5 w-3.5 -bottom-0.5 -right-0.5", star: "h-2 w-2" },
  md: { badge: "h-4.5 w-4.5 -bottom-0.5 -right-0.5", star: "h-2.5 w-2.5" },
  lg: { badge: "h-6.5 w-6.5 -bottom-1 -right-1", star: "h-3.5 w-3.5" },
};

const KNOWN_LAWYER_NAMES = new Set([
  ...MOCK_LAWYERS.map((l) => l.name.toLowerCase().trim()),
  "swathi reddy",
  "srinivas chowdary",
  "sailaja naidu",
  "ananya sharma",
  "rajesh kumar",
  "meera nair",
  "vikram malhotra",
  "priya deshmukh",
  "karan mehta",
  "amitabh sen",
  "sneha roy",
  "suresh rao",
  "venkatesh rao",
  "haritha sarma",
  "krishna murthy",
  "rohan iyer",
  "priya subramaniam",
  "aditya deshmukh",
  "kavya reddy",
  "nikhil chandra",
  "ananya deshpande",
  "rajesh varma",
  "n. v. ramana rao",
  "sunitha reddy",
  "k. pattabhi ramaiah",
]);

const KNOWN_CITIZENS = new Set([
  "sai teja reddy",
  "lakshmi prasanna",
  "divya sri chowdary",
  "venkata ramana naidu",
  "padmavathi rao",
]);

function isLawyerOrAdminName(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (
    lower.includes("admin") ||
    lower.includes("adv") ||
    lower.includes("lawyer") ||
    lower.includes("counsel") ||
    lower.includes("attorney") ||
    KNOWN_LAWYER_NAMES.has(lower)
  ) {
    return true;
  }
  return false;
}

function resolvePlanTier(name: string, role?: string, explicitTier?: string): PlanTier | null {
  // STRICT RULE 1: Lawyers and Admins NEVER get a citizen plan badge
  if (role === "lawyer" || role === "admin") return null;

  // STRICT RULE 2: If the name is identified as a lawyer or admin, NEVER show a plan badge
  if (isLawyerOrAdminName(name)) return null;

  const lower = name.toLowerCase().trim();

  // STRICT RULE 3: Explicit plan tiers passed directly (e.g. from subscription cards)
  if (explicitTier) {
    const norm = explicitTier.toLowerCase();
    if (norm === "free" || norm === "bronze") return "bronze";
    if (norm === "monthly" || norm === "silver") return "silver";
    if (norm === "yearly" || norm === "gold") return "gold";
  }

  // STRICT RULE 4: ONLY Citizens have plan badges
  if (role === "citizen" || KNOWN_CITIZENS.has(lower) || lower.startsWith("u_") || lower.includes("citizen")) {
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    const mod = sum % 3;
    return mod === 0 ? "gold" : mod === 1 ? "silver" : "bronze";
  }

  // If role is omitted/unknown and user is not explicitly identified as citizen, DO NOT show badge
  return null;
}

export function UserAvatar({
  name,
  photoUrl,
  size = "md",
  role,
  planTier,
  className = "",
}: {
  name: string;
  photoUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  role?: "citizen" | "lawyer" | "admin";
  planTier?: "bronze" | "silver" | "gold" | "free" | "monthly" | "yearly";
  className?: string;
}) {
  const sizeCls = SIZE_CLASSES[size];
  const src = photoUrl || avatarUrlFor(name, SIZE_PX[size]);
  const tierKey = resolvePlanTier(name, role, planTier);
  const tier = tierKey ? BADGE_CONFIGS[tierKey] : null;
  const badgeSize = BADGE_SIZE_CLASSES[size];

  return (
    <div className={`relative inline-flex shrink-0 ${sizeCls}`}>
      <img
        src={src}
        alt={name}
        className={`h-full w-full rounded-full border border-border object-cover shadow-sm ${tier ? tier.ringCls : ""} ${className}`}
      />
      {tier && (
        <div
          className={`absolute rounded-full flex items-center justify-center ${tier.badgeCls} ${badgeSize.badge}`}
          title={`${tier.label}`}
        >
          <Star className={badgeSize.star} />
        </div>
      )}
    </div>
  );
}
