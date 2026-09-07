import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { CardPagination } from "@/components/app/CardPagination";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import {
  Card,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Switch,
} from "@/components/m3";
import {
  getCaseCategories,
  saveCaseCategory,
  deleteCaseCategory,
  getLanguages,
  saveLanguage,
  deleteLanguage,
  getCities,
  saveCity,
  deleteCity,
  getCourts,
  saveCourt,
  deleteCourt,
  subscribeToStore,
  resetDataManagementToDefaults,
} from "@/data/appStore";
import type {
  CaseCategoryItem,
  LanguageItem,
  CityItem,
  CourtItem,
} from "@/types";
import {
  Folder,
  Languages,
  Building2,
  Scale,
  Plus,
  Pencil,
  Trash2,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MapPin,
  FileText,
  ChevronDown,
  X,
  Tag,
} from "lucide-react";

export const Route = createFileRoute("/admin/data-management")({
  head: () => ({ meta: [{ title: "Data Management — CloseUrCase Admin" }] }),
  component: AdminDataManagementPage,
});

type TabType = "categories" | "languages" | "cities" | "courts";

const COURT_LEVEL_OPTIONS = [
  { value: "Supreme Court", label: "Supreme Court" },
  { value: "High Court", label: "High Court" },
  { value: "District Court", label: "District Court" },
  { value: "Tribunal", label: "Tribunal" },
];

const CITY_TIER_OPTIONS = [
  { value: "Tier 1", label: "Tier 1" },
  { value: "Tier 2", label: "Tier 2" },
  { value: "Tier 3", label: "Tier 3" },
];

export function AdminDataManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("categories");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [courtLevelFilter, setCourtLevelFilter] = useState<string>("all");

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Store data states
  const [categories, setCategories] = useState<CaseCategoryItem[]>(getCaseCategories);
  const [languages, setLanguages] = useState<LanguageItem[]>(getLanguages);
  const [cities, setCities] = useState<CityItem[]>(getCities);
  const [courts, setCourts] = useState<CourtItem[]>(getCourts);

  // Sync with store changes
  useEffect(() => {
    const sync = () => {
      setCategories(getCaseCategories());
      setLanguages(getLanguages());
      setCities(getCities());
      setCourts(getCourts());
    };
    return subscribeToStore(sync);
  }, []);

  // Reset page when tab, search, or filters change
  useEffect(() => {
    setPage(1);
  }, [activeTab, search, statusFilter, courtLevelFilter]);

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Category Form State
  const [catName, setCatName] = useState("");
  const [catCode, setCatCode] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catSubCategories, setCatSubCategories] = useState<string[]>([]);
  const [newSubCategoryInput, setNewSubCategoryInput] = useState("");
  const [catActive, setCatActive] = useState(true);

  // Sub-category handlers
  const handleAddSubCategory = (value?: string) => {
    const val = (value !== undefined ? value : newSubCategoryInput).trim();
    if (!val) return;
    if (!catSubCategories.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setCatSubCategories((prev) => [...prev, val]);
    }
    setNewSubCategoryInput("");
  };

  const handleRemoveSubCategory = (indexToRemove: number) => {
    setCatSubCategories((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Language Form State
  const [langName, setLangName] = useState("");
  const [langNative, setLangNative] = useState("");
  const [langCode, setLangCode] = useState("");
  const [langActive, setLangActive] = useState(true);

  // City Form State
  const [cityName, setCityName] = useState("");
  const [cityState, setCityState] = useState("");
  const [cityTier, setCityTier] = useState<"Tier 1" | "Tier 2" | "Tier 3">("Tier 1");
  const [cityActive, setCityActive] = useState(true);

  // Court Form State
  const [courtName, setCourtName] = useState("");
  const [courtLevel, setCourtLevel] = useState<"Supreme Court" | "High Court" | "District Court" | "Tribunal">("High Court");
  const [courtState, setCourtState] = useState("");
  const [courtCity, setCourtCity] = useState("");
  const [courtActive, setCourtActive] = useState(true);

  // Form error state
  const [formError, setFormError] = useState("");

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: TabType;
  } | null>(null);

  // Reset confirmation state
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Switch tab helper
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearch("");
    setStatusFilter("all");
    setCourtLevelFilter("all");
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormError("");
    if (activeTab === "categories") {
      setCatName("");
      setCatCode("");
      setCatDesc("");
      setCatSubCategories([]);
      setNewSubCategoryInput("");
      setCatActive(true);
    } else if (activeTab === "languages") {
      setLangName("");
      setLangNative("");
      setLangCode("");
      setLangActive(true);
    } else if (activeTab === "cities") {
      setCityName("");
      setCityState("");
      setCityTier("Tier 1");
      setCityActive(true);
    } else {
      setCourtName("");
      setCourtLevel("High Court");
      setCourtState("");
      setCourtCity("");
      setCourtActive(true);
    }
    setModalOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (id: string) => {
    setEditingId(id);
    setFormError("");
    if (activeTab === "categories") {
      const item = categories.find((c) => c.id === id);
      if (item) {
        setCatName(item.name);
        setCatCode(item.code);
        setCatDesc(item.description);
        setCatSubCategories(item.subCategories ? [...item.subCategories] : []);
        setNewSubCategoryInput("");
        setCatActive(item.active);
      }
    } else if (activeTab === "languages") {
      const item = languages.find((l) => l.id === id);
      if (item) {
        setLangName(item.name);
        setLangNative(item.nativeName);
        setLangCode(item.code);
        setLangActive(item.active);
      }
    } else if (activeTab === "cities") {
      const item = cities.find((c) => c.id === id);
      if (item) {
        setCityName(item.name);
        setCityState(item.state);
        setCityTier(item.tier);
        setCityActive(item.active);
      }
    } else {
      const item = courts.find((c) => c.id === id);
      if (item) {
        setCourtName(item.name);
        setCourtLevel(item.level);
        setCourtState(item.state);
        setCourtCity(item.city || "");
        setCourtActive(item.active);
      }
    }
    setModalOpen(true);
  };

  // Handle Form Submit
  const handleSaveItem = () => {
    if (activeTab === "categories") {
      if (!catName.trim()) {
        setFormError("Category name is required.");
        return;
      }
      if (!catCode.trim()) {
        setFormError("Category code is required.");
        return;
      }
      saveCaseCategory({
        id: editingId ?? undefined,
        name: catName.trim(),
        code: catCode.trim().toUpperCase(),
        description: catDesc.trim(),
        subCategories: catSubCategories,
        active: catActive,
      });
    } else if (activeTab === "languages") {
      if (!langName.trim()) {
        setFormError("Language name is required.");
        return;
      }
      if (!langCode.trim()) {
        setFormError("Language code is required.");
        return;
      }
      saveLanguage({
        id: editingId ?? undefined,
        name: langName.trim(),
        nativeName: langNative.trim() || langName.trim(),
        code: langCode.trim().toUpperCase(),
        active: langActive,
      });
    } else if (activeTab === "cities") {
      if (!cityName.trim()) {
        setFormError("City name is required.");
        return;
      }
      if (!cityState.trim()) {
        setFormError("State is required.");
        return;
      }
      saveCity({
        id: editingId ?? undefined,
        name: cityName.trim(),
        state: cityState.trim(),
        tier: cityTier,
        active: cityActive,
      });
    } else {
      if (!courtName.trim()) {
        setFormError("Court name is required.");
        return;
      }
      if (!courtState.trim()) {
        setFormError("State is required.");
        return;
      }
      saveCourt({
        id: editingId ?? undefined,
        name: courtName.trim(),
        level: courtLevel,
        state: courtState.trim(),
        city: courtCity.trim() || undefined,
        active: courtActive,
      });
    }
    setModalOpen(false);
  };

  // Handle Delete Confirm
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "categories") {
      deleteCaseCategory(deleteTarget.id);
    } else if (deleteTarget.type === "languages") {
      deleteLanguage(deleteTarget.id);
    } else if (deleteTarget.type === "cities") {
      deleteCity(deleteTarget.id);
    } else {
      deleteCourt(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  // Filtered rows
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((c) => {
      if (statusFilter === "active" && !c.active) return false;
      if (statusFilter === "inactive" && c.active) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.subCategories?.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [categories, search, statusFilter]);

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return languages.filter((l) => {
      if (statusFilter === "active" && !l.active) return false;
      if (statusFilter === "inactive" && l.active) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
      );
    });
  }, [languages, search, statusFilter]);

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cities.filter((c) => {
      if (statusFilter === "active" && !c.active) return false;
      if (statusFilter === "inactive" && c.active) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.tier.toLowerCase().includes(q)
      );
    });
  }, [cities, search, statusFilter]);

  const filteredCourts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courts.filter((c) => {
      if (statusFilter === "active" && !c.active) return false;
      if (statusFilter === "inactive" && c.active) return false;
      if (courtLevelFilter !== "all" && c.level !== courtLevelFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.level.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    });
  }, [courts, search, statusFilter, courtLevelFilter]);

  // Tab Item Label Helper
  const getTabTitle = () => {
    switch (activeTab) {
      case "categories":
        return "Case Category";
      case "languages":
        return "Language";
      case "cities":
        return "City";
      case "courts":
        return "Court";
    }
  };

  // Status Chip Badge renderer
  const renderStatus = (active: boolean) => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          : "bg-muted text-muted-foreground border border-border"
      }`}
    >
      {active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {active ? "Active" : "Inactive"}
    </span>
  );

  // Pagination calculations based on active tab
  const activeItemsCount =
    activeTab === "categories"
      ? filteredCategories.length
      : activeTab === "languages"
        ? filteredLanguages.length
        : activeTab === "cities"
          ? filteredCities.length
          : filteredCourts.length;

  const totalPages = Math.max(1, Math.ceil(activeItemsCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;

  const paginatedCategories = filteredCategories.slice(startIdx, startIdx + pageSize);
  const paginatedLanguages = filteredLanguages.slice(startIdx, startIdx + pageSize);
  const paginatedCities = filteredCities.slice(startIdx, startIdx + pageSize);
  const paginatedCourts = filteredCourts.slice(startIdx, startIdx + pageSize);

  return (
    <div className="w-full space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Data Management"
        description="Configure master categories, languages, cities, and courts for lawyers and citizens across CloseUrCase."
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outlined"
              onClick={() => setConfirmResetOpen(true)}
              icon={<RotateCcw className="h-4 w-4" />}
              className="flex-1 sm:flex-initial text-xs"
            >
              Reset Defaults
            </Button>
            <Button
              variant="filled"
              onClick={handleOpenCreate}
              icon={<Plus className="h-4 w-4" />}
              className="flex-1 sm:flex-initial text-xs"
            >
              Add {getTabTitle()}
            </Button>
          </div>
        }
      />

      {/* ── Category Switcher Tabs ── */}
      <div className="w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <SegmentedControl<TabType>
          value={activeTab}
          onChange={handleTabChange}
          options={[
            { value: "categories", label: `Case Categories (${categories.length})` },
            { value: "languages", label: `Languages (${languages.length})` },
            { value: "cities", label: `Cities (${cities.length})` },
            { value: "courts", label: `Courts (${courts.length})` },
          ]}
        />
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
        <div className="w-full sm:max-w-xs md:max-w-sm">
          <TextField
            value={search}
            onChange={setSearch}
            placeholder={`Search ${getTabTitle().toLowerCase()}s by name, code, or state...`}
            leadingIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <div
          className={`grid ${
            activeTab === "courts" ? "grid-cols-2" : "grid-cols-1"
          } sm:flex sm:items-center gap-2 w-full sm:w-auto`}
        >
          {activeTab === "courts" && (
            <div className="relative w-full sm:w-auto">
              <select
                value={courtLevelFilter}
                onChange={(e) => setCourtLevelFilter(e.target.value)}
                className="w-full sm:w-40 h-10 cursor-pointer appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-xs font-semibold text-foreground outline-hidden hover:bg-muted/40 focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs transition-colors"
              >
                <option value="all">All Levels</option>
                {COURT_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
          )}

          <div className="relative w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="w-full sm:w-36 h-10 cursor-pointer appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-xs font-semibold text-foreground outline-hidden hover:bg-muted/40 focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* ── Cards Grid Display ── */}
      {activeItemsCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
            <Search className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-foreground">No {getTabTitle().toLowerCase()}s found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search query or filter options.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Case Category Cards */}
          {activeTab === "categories" &&
            paginatedCategories.map((row) => (
              <Card
                key={row.id}
                variant="outlined"
                className="flex flex-col justify-between p-4.5 bg-card hover:border-primary/40 transition-all shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold rounded-md bg-primary/10 text-primary px-2.5 py-1">
                      {row.code}
                    </span>
                    {renderStatus(row.active)}
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-foreground truncate">{row.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {row.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Sub-Categories Tag Pills */}
                  {row.subCategories && row.subCategories.length > 0 && (
                    <div className="mt-3.5 pt-2.5 border-t border-border/60">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1.5">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-primary/70" />
                          Sub-Categories
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                          {row.subCategories.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-0.5">
                        {row.subCategories.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center rounded-md bg-secondary/80 text-secondary-foreground border border-border/70 px-2 py-0.5 text-[11px] font-medium leading-tight hover:bg-secondary transition-colors"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {row.updatedAt ? `Updated: ${row.updatedAt}` : "Master Record"}
                  </span>
                  <div className="flex items-center gap-1">
                    <IconButton ariaLabel="Edit category" onClick={() => handleOpenEdit(row.id)}>
                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </IconButton>
                    <IconButton
                      ariaLabel="Delete category"
                      onClick={() => setDeleteTarget({ id: row.id, name: row.name, type: "categories" })}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </IconButton>
                  </div>
                </div>
              </Card>
            ))}

          {/* Language Cards */}
          {activeTab === "languages" &&
            paginatedLanguages.map((row) => (
              <Card
                key={row.id}
                variant="outlined"
                className="flex flex-col justify-between p-4.5 bg-card hover:border-primary/40 transition-all shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold rounded-md bg-primary/10 text-primary px-2.5 py-1">
                      {row.code}
                    </span>
                    {renderStatus(row.active)}
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Languages className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-foreground truncate">{row.name}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">{row.nativeName}</span>
                        <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
                          (Native Script)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Language Pack
                  </span>
                  <div className="flex items-center gap-1">
                    <IconButton ariaLabel="Edit language" onClick={() => handleOpenEdit(row.id)}>
                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </IconButton>
                    <IconButton
                      ariaLabel="Delete language"
                      onClick={() => setDeleteTarget({ id: row.id, name: row.name, type: "languages" })}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </IconButton>
                  </div>
                </div>
              </Card>
            ))}

          {/* City Cards */}
          {activeTab === "cities" &&
            paginatedCities.map((row) => (
              <Card
                key={row.id}
                variant="outlined"
                className="flex flex-col justify-between p-4.5 bg-card hover:border-primary/40 transition-all shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground border border-border">
                      {row.tier}
                    </span>
                    {renderStatus(row.active)}
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base text-foreground truncate">{row.name}</h3>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate">{row.state}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Jurisdiction Location
                  </span>
                  <div className="flex items-center gap-1">
                    <IconButton ariaLabel="Edit city" onClick={() => handleOpenEdit(row.id)}>
                      <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </IconButton>
                    <IconButton
                      ariaLabel="Delete city"
                      onClick={() => setDeleteTarget({ id: row.id, name: row.name, type: "cities" })}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </IconButton>
                  </div>
                </div>
              </Card>
            ))}

          {/* Court Cards */}
          {activeTab === "courts" &&
            paginatedCourts.map((row) => {
              const isSupreme = row.level === "Supreme Court";
              const isHigh = row.level === "High Court";
              return (
                <Card
                  key={row.id}
                  variant="outlined"
                  className="flex flex-col justify-between p-4.5 bg-card hover:border-primary/40 transition-all shadow-2xs hover:shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          isSupreme
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                            : isHigh
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : "bg-muted text-foreground border-border"
                        }`}
                      >
                        {row.level}
                      </span>
                      {renderStatus(row.active)}
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Scale className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-foreground line-clamp-2 leading-snug">
                          {row.name}
                        </h3>
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="truncate">
                            {row.city ? `${row.city}, ` : ""}
                            {row.state}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      eCourt Forum
                    </span>
                    <div className="flex items-center gap-1">
                      <IconButton ariaLabel="Edit court" onClick={() => handleOpenEdit(row.id)}>
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </IconButton>
                      <IconButton
                        ariaLabel="Delete court"
                        onClick={() => setDeleteTarget({ id: row.id, name: row.name, type: "courts" })}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </IconButton>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}

      {/* ── Card Pagination Bar ── */}
      {activeItemsCount > pageSize && (
        <div className="pt-2">
          <CardPagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[9, 18, 27]}
          />
        </div>
      )}

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen} maxWidth="580px">
        <DialogHeader>
          <DialogTitle>
            {editingId ? `Edit ${getTabTitle()}` : `Add New ${getTabTitle()}`}
          </DialogTitle>
        </DialogHeader>

        <DialogContent className="space-y-4 pt-3">
          {formError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              {formError}
            </div>
          )}

          {/* Form Fields: Case Category */}
          {activeTab === "categories" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <TextField
                    label="Category Name *"
                    value={catName}
                    onChange={setCatName}
                    placeholder="e.g. Intellectual Property"
                    className="w-full"
                    required
                  />
                </div>
                <div className="sm:col-span-1">
                  <TextField
                    label="Short Code *"
                    value={catCode}
                    onChange={setCatCode}
                    placeholder="e.g. IP"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <TextField
                label="Description"
                value={catDesc}
                onChange={setCatDesc}
                placeholder="Brief summary of cases belonging to this category"
                className="w-full"
              />

              {/* Sub-Categories / Practice Areas */}
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-foreground">
                      Sub-Categories / Practice Areas
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      Specific case types matching landing page dropdowns
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-bold">
                    {catSubCategories.length} {catSubCategories.length === 1 ? "type" : "types"}
                  </span>
                </div>

                {/* Input with Add button */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <TextField
                      value={newSubCategoryInput}
                      onChange={setNewSubCategoryInput}
                      placeholder="Add sub-category (e.g. Anticipatory Bail)"
                      className="w-full"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubCategory();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="tonal"
                    onClick={() => handleAddSubCategory()}
                    disabled={!newSubCategoryInput.trim()}
                    className="shrink-0 h-10"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>

                {/* Sub-category chips */}
                {catSubCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto p-1">
                    {catSubCategories.map((sub, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs group hover:border-destructive/40 transition-colors"
                      >
                        <span>{sub}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubCategory(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-destructive/10 cursor-pointer"
                          title={`Remove ${sub}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic py-1">
                    No sub-categories configured yet. Type a case type above and click Add or press Enter.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium text-foreground">Active Status</span>
                <Switch selected={catActive} onChange={setCatActive} />
              </div>
            </>
          )}

          {/* Form Fields: Language */}
          {activeTab === "languages" && (
            <>
              <TextField
                label="Language Name (English) *"
                value={langName}
                onChange={setLangName}
                placeholder="e.g. French"
                required
              />
              <TextField
                label="Native Script Name"
                value={langNative}
                onChange={setLangNative}
                placeholder="e.g. Français"
              />
              <TextField
                label="ISO Code *"
                value={langCode}
                onChange={setLangCode}
                placeholder="e.g. FR"
                required
              />
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium text-foreground">Active Status</span>
                <Switch selected={langActive} onChange={setLangActive} />
              </div>
            </>
          )}

          {/* Form Fields: City */}
          {activeTab === "cities" && (
            <>
              <TextField
                label="City Name *"
                value={cityName}
                onChange={setCityName}
                placeholder="e.g. Visakhapatnam"
                required
              />
              <TextField
                label="State / Union Territory *"
                value={cityState}
                onChange={setCityState}
                placeholder="e.g. Andhra Pradesh"
                required
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Tier Classification</label>
                <div className="relative">
                  <select
                    value={cityTier}
                    onChange={(e) => setCityTier(e.target.value as "Tier 1" | "Tier 2" | "Tier 3")}
                    className="w-full h-12 cursor-pointer appearance-none rounded-lg border border-border bg-card px-3 pr-8 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {CITY_TIER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium text-foreground">Active Status</span>
                <Switch selected={cityActive} onChange={setCityActive} />
              </div>
            </>
          )}

          {/* Form Fields: Court */}
          {activeTab === "courts" && (
            <>
              <TextField
                label="Court Name *"
                value={courtName}
                onChange={setCourtName}
                placeholder="e.g. High Court of Judicature"
                required
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Court Level / Jurisdiction *</label>
                <div className="relative">
                  <select
                    value={courtLevel}
                    onChange={(e) => setCourtLevel(e.target.value as "Supreme Court" | "High Court" | "District Court" | "Tribunal")}
                    className="w-full h-12 cursor-pointer appearance-none rounded-lg border border-border bg-card px-3 pr-8 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {COURT_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <TextField
                label="State / Union Territory *"
                value={courtState}
                onChange={setCourtState}
                placeholder="e.g. Telangana"
                required
              />
              <TextField
                label="City (Optional)"
                value={courtCity}
                onChange={setCourtCity}
                placeholder="e.g. Hyderabad"
              />
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium text-foreground">Active Status</span>
                <Switch selected={courtActive} onChange={setCourtActive} />
              </div>
            </>
          )}
        </DialogContent>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outlined" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="filled" onClick={handleSaveItem}>
            {editingId ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget ? deleteTarget.name : "Item"}?`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This master data record will be permanently removed.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Reset Confirmation Dialog ── */}
      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset Master Data to Defaults?"
        message="This will restore all default Case Categories, Languages, Cities, and Courts to their original seed records. Any custom additions will be cleared."
        confirmLabel="Reset Everything"
        variant="warning"
        onConfirm={() => {
          resetDataManagementToDefaults();
          setConfirmResetOpen(false);
        }}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
}
