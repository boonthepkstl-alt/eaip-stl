// Lightweight QR payload encode/decode helper for Asset Management (Wave 3).
// No QR image-rendering library is bundled in this project yet — this module only wraps
// the payload string that would be encoded into/decoded from a QR code image. It is
// intentionally UI-agnostic (see AssetList _components for rendering usage).
import { Asset } from '@/types/asset';

export interface AssetQrPayload {
  assetId: string;
  assetTag: string;
}

/**
 * Builds the raw string payload that would be encoded into an asset's QR code.
 */
export function generateQrPayload(asset: Pick<Asset, 'id' | 'assetTag'>): string {
  const payload: AssetQrPayload = { assetId: asset.id, assetTag: asset.assetTag };
  return JSON.stringify(payload);
}

/**
 * Parses a raw QR code payload string back into its structured form.
 * Returns null when the payload is not valid JSON or missing required fields.
 */
export function parseQrPayload(raw: string): AssetQrPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<AssetQrPayload>;
    if (typeof parsed.assetId !== 'string' || typeof parsed.assetTag !== 'string') {
      return null;
    }
    return { assetId: parsed.assetId, assetTag: parsed.assetTag };
  } catch {
    return null;
  }
}
