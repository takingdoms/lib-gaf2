import { ElementOf } from 'ts-essentials';

export const COLOR_DATA_FORMATS = [
  'rgba8888',
  'argb1555',
  'argb4444',
] as const satisfies string[];

export type ColorDataFormat = ElementOf<typeof COLOR_DATA_FORMATS>;

export module ColorDataFormat {
  export const FORMAT_TO_BITS: Record<ColorDataFormat, number> = {
    'rgba8888': 32,
    'argb1555': 16,
    'argb4444': 16,
  };

 export const FORMAT_TO_BYTES: Record<ColorDataFormat, number> = {
  'rgba8888': FORMAT_TO_BITS['rgba8888'] / 8, // 4 bytes
  'argb1555': FORMAT_TO_BITS['argb1555'] / 8, // 2 bytes
  'argb4444': FORMAT_TO_BITS['argb4444'] / 8, // 2 bytes
 };
}
