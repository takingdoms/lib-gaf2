import { GafLayerData } from "../gaf-types";

export type CachedLayerData = {
  layerData: GafLayerData;
  metadata?: number;
};

export type CachedLayerDataResult = {
  offset: number;
  layerData: GafLayerData;
}

export class LayerDataCache {
  private layerDataCache: Record<number, CachedLayerData> = {}; // offset -> GafLayerData
  private layerDataCacheKeys: number[] = []; // unique array of offsets used in the layerDataCache

  set(position: number, layerData: GafLayerData, metadata?: number) {
    if (this.layerDataCacheKeys.includes(position)) {
      console.warn(`ERROR: Overriding layerDataCache at position: ${position}`);
    }
    else {
      this.layerDataCacheKeys.push(position);
    }

    this.layerDataCache[position] = {
      layerData,
      metadata,
    };
  }

  get(layerData: GafLayerData, metadata?: number): CachedLayerDataResult | undefined {
    for (const offsetCandidate of this.layerDataCacheKeys) {
      const resultCandidate = this.layerDataCache[offsetCandidate];

      if (resultCandidate === undefined) {
        throw new Error(`Something went very wrong (in the code).`);
      }

      if (metadata !== resultCandidate.metadata) {
        continue;
      }

      if (this.compareLayerData(layerData, resultCandidate.layerData)) {
        return {
          offset: offsetCandidate,
          layerData: resultCandidate.layerData,
        };
      }
    }

    return undefined;
  }

  /** Verifies if two layerDatas are IDENTICAL */
  private compareLayerData(sourceLayerData: GafLayerData, targetLayerData: GafLayerData): boolean {
    if (sourceLayerData.kind === 'palette-idx') {
      if (targetLayerData.kind !== 'palette-idx') {
        return false; // should NEVER happen but used purely for typing narrowing
      }

      return this.compareBytes(sourceLayerData.indices, targetLayerData.indices);
    }

    if (targetLayerData.kind !== 'raw-colors') {
      return false; // should NEVER happen but used purely for typing narrowing
    }

    return this.compareBytes(sourceLayerData.colorData.bytes, targetLayerData.colorData.bytes);
  }

  private compareBytes(sourceBytes: Uint8Array, targetBytes: Uint8Array): boolean {
    if (sourceBytes.length > targetBytes.length) {
      return false;
    }

    for (let i = 0; i < sourceBytes.length; i++) {
      if (sourceBytes[i] !== targetBytes[i]) {
        return false;
      }
    }

    return true;
  }
}
