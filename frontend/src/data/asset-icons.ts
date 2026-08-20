import { Laptop, Monitor, Smartphone, Tablet, Printer, Server, Router, Headphones, Camera, Projector, Package, type LucideIcon } from 'lucide-react';

/**
 * Legacy src/data/mockData.ts embedded a resolved `icon: LucideIcon` directly on each Asset
 * record. That is a presentation-layer detail, not domain data (a Go API will never return a
 * React component), so ASSET-MANAGEMENT-MIGRATION.md classifies it as REFACTOR: the domain
 * `Asset` type (types/asset.ts) carries only `type: string`, and pages resolve an icon for
 * display via this lookup — same visual result, cleaner service contract.
 */
const assetIconsByType: Record<string, LucideIcon> = {
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  Printer,
  Server,
  Router,
  Headphones,
  Camera,
  Projector,
};

export function getAssetIcon(type: string): LucideIcon {
  return assetIconsByType[type] ?? Package;
}
