import { ElementOf } from 'ts-essentials';

export const BIT_DEPTHS = [
  1,
  4,
  5,
  8,
] as const satisfies number[];

export type BitDepth = ElementOf<typeof BIT_DEPTHS>;

export module BitDepth {
  export function validateInteger(value: number, depth: BitDepth): boolean {
    if (depth === 1) {
      return value === 0 || value === 1;
    }

    if (depth === 4) {
      return value >= 0 && value < 16;
    }

    if (depth === 5) {
      return value >= 0 && value < 32;
    }

    if (depth === 8) {
      return value >= 0 && value < 256;
    }

    throw new Error(`Unknown Bit Depth: ${depth}`);
  }
}
