import { assets as assetFixtures } from '@/data/fixtures/mockData';
import { MockAssetRepository, type AssetRepository } from '@/services/asset-repository';
import type { Asset, AssetListQuery, AssetListResult, AssignAssetInput, CreateAssetInput } from '@/types/asset';

// Strip the legacy `icon: LucideIcon` field from the fixture rows — the domain Asset type
// no longer carries it (see types/asset.ts and data/asset-icons.ts).
const seedAssets: Asset[] = assetFixtures.map(({ icon: _icon, ...rest }) => rest);

const repository: AssetRepository = new MockAssetRepository(seedAssets);

/**
 * The stable frontend contract for Asset Management pages. Every page in
 * pages/Assets, pages/AssetDetail, pages/CreateAsset calls this — never the
 * repository or the fixture data directly — so swapping MockAssetRepository for an
 * HttpAssetRepository later (see ASSET-MANAGEMENT-API-CONTRACT.md) touches this file only.
 */
export const assetService = {
  listAssets: (query: AssetListQuery = {}): Promise<AssetListResult> => repository.list(query),
  getAsset: (id: string): Promise<Asset | null> => repository.getById(id),
  createAsset: (input: CreateAssetInput): Promise<Asset> => repository.create(input),
  assignAsset: (input: AssignAssetInput): Promise<Asset> => repository.assign(input),
};
