import { ColorData } from '../../color/color-data';
import { DataConverter } from '../data-converter';
import { DepthConverter, DepthConverters } from '../depth-converters';

type Options = {
  depthConvert8to4?: DepthConverter<8, 4>;
};

export const convertRGBA8888ToARGB4444: DataConverter<'rgba8888', 'argb4444', Options> = (
  input,
  imgWidth,
  imgHeight,
  options,
): ColorData<'argb4444'> => {
  const outputBytes = new Uint8Array(imgWidth * imgHeight * 2); // 2 = 2 bytes per pixel

  const convert8to4 = options.depthConvert8to4 ?? DepthConverters.round8to4;

  throw 'TODO';
};

export { Options as OptionsRGBA8888ToARGB4444 };
