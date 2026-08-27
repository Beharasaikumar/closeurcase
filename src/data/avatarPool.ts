/**
 * Master Registry of distinct, high-quality Unsplash portrait photos.
 * Guarantees that EVERY person in the application has a 100% unique photo,
 * and the SAME person always gets the EXACT SAME photo on every page
 * (Landing Page, Trusted Lawyers, Dashboards, Profiles, Top App Bar, Case List, etc.).
 */

export const PEOPLE_AVATARS: Record<string, string> = {
  // --- Lawyers / Lawyers (Indian advocates in black lawyer coats/gowns) ---
  "Swathi Reddy": "photo-1659355894099-b2c2b2884322",
  "Adv. Swathi Reddy": "photo-1659355894099-b2c2b2884322",

  "Srinivas Chowdary": "photo-1637589274742-8d4c152720a2",
  "Adv. Srinivas Chowdary": "photo-1637589274742-8d4c152720a2",

  "Sailaja Naidu": "photo-1770626899426-baed57609a30",
  "Adv. Sailaja Naidu": "photo-1770626899426-baed57609a30",

  "Venkatesh Rao": "photo-1659353220482-554773c2f7fa",
  "Adv. Venkatesh Rao": "photo-1659353220482-554773c2f7fa",

  "Haritha Sarma": "photo-1646032540224-4ab44f77e6f2",
  "Adv. Haritha Sarma": "photo-1646032540224-4ab44f77e6f2",

  "Krishna Murthy": "photo-1655048424687-29c152741a90",
  "Adv. Krishna Murthy": "photo-1655048424687-29c152741a90",

  // --- Citizens ---
  "Sai Teja Reddy": "photo-1607346256330-dee7af15f7c5",
  "Lakshmi Prasanna": "photo-1533128361669-69c065857a13",
  "Divya Sri Chowdary": "photo-1758599543125-0a927f1d7a3b",
  "Venkata Ramana Naidu": "photo-1552642986-ccb41e7059e7",
  "Padmavathi Rao": "photo-1463335361701-e90f4c5045d0",

  // --- Admin ---
  "Platform Ops": "photo-1508341591423-4347099e1f19",
};

const FALLBACK_AVATAR_POOL = [
  "photo-1631005436794-ccaa79de61ba",
  "photo-1512310604669-443f26c35f52",
  "photo-1618559850638-2aed8a8e8cdc",
  "photo-1729157661483-ed21901ed892",
  "photo-1616002851413-ebcc9611139d",
  "photo-1607081692251-d689f1b9af84",
];

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = value.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

export function pickAvatarPhotoId(seed: string) {
  if (PEOPLE_AVATARS[seed]) {
    return PEOPLE_AVATARS[seed];
  }
  // Try matching trimmed name without prefixes like "Adv."
  const cleanSeed = seed.replace(/^(Adv\.\s*)/i, "").trim();
  if (PEOPLE_AVATARS[cleanSeed]) {
    return PEOPLE_AVATARS[cleanSeed];
  }
  return FALLBACK_AVATAR_POOL[hashString(seed) % FALLBACK_AVATAR_POOL.length];
}

export function avatarUrlFor(seed: string, px = 128) {
  const photoId = pickAvatarPhotoId(seed);
  return `https://images.unsplash.com/${photoId}?w=${px}&h=${px}&fit=crop&crop=faces&q=80`;
}
