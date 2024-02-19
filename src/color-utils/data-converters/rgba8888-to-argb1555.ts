import { ColorData } from "../../color/color-data";
import { DataConverter } from "../data-converter";
import { DepthConverter, DepthConverters } from "../depth-converters";

type Options = {
  depthConvert8to5?: DepthConverter<8, 5>;
  depthConvert8to1?: DepthConverter<8, 1>;
};

export const convertRGBA8888ToARGB1555: DataConverter<'rgba8888', 'argb1555', Options> = (
  input,
  imgWidth,
  imgHeight,
  options,
): ColorData<'argb1555'> => {
  const outputBytes = new Uint8Array(imgWidth * imgHeight * 2); // 2 = 2 bytes per pixel

  const convert8to5 = options.depthConvert8to5 ?? DepthConverters.round8to5;
  const convert8to1 = options.depthConvert8to1 ?? DepthConverters.transparentOrOne8to1;

  throw 'TODO';
};

export { Options as OptionsRGBA8888ToARGB1555 };
