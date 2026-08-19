import { Laptop, HardDrive, Monitor, Printer, Package, type LucideIcon } from 'lucide-react';

// Maps AssetCategory.name (config/masterdata.mock.ts: Notebook/Desktop/Monitor/Printer) to a
// representative icon for the asset row/header icon chip — mirrors esaps_ai_gemini-main's
// per-asset-type icon pattern. Falls back to a generic icon for any category not in this list
// (there are only 4 real categories today) rather than guessing.
const ICON_BY_CATEGORY: Record<string, LucideIcon> = {
  Notebook: Laptop,
  Desktop: HardDrive,
  Monitor: Monitor,
  Printer: Printer,
};

export function getAssetCategoryIcon(categoryName?: string): LucideIcon {
  return (categoryName && ICON_BY_CATEGORY[categoryName]) || Package;
}
