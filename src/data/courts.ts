export interface CourtOption {
  id: string;
  name: string;
  level: "Supreme Court" | "High Court" | "District Court";
}

export const courts: CourtOption[] = [
  { id: "c_hc_ts", name: "High Court for the State of Telangana", level: "High Court" },
  {
    id: "c_hc_ap",
    name: "High Court of Andhra Pradesh (Visakhapatnam Bench)",
    level: "High Court",
  },
  {
    id: "c_dc_vizag",
    name: "City Civil Court, Visakhapatnam",
    level: "District Court",
  },
  {
    id: "c_dc_hyd",
    name: "City Civil Court, Banjara Hills, Hyderabad",
    level: "District Court",
  },
  {
    id: "c_dcdrc_vizag",
    name: "District Consumer Disputes Redressal Commission, Visakhapatnam",
    level: "District Court",
  },
];

export function searchCourts(query: string): CourtOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return courts;
  return courts.filter((c) => c.name.toLowerCase().includes(q));
}
