import { ColorData } from '../../color/color-data';
import { DataConverter } from '../data-converter';
import { DepthConverter, DepthConverters } from '../depth-converters';

type Options = {
  depthConvert4to8?: DepthConverter<4, 8>;
};

export const convertARGB4444ToRGBA8888: DataConverter<'argb4444', 'rgba8888', Options> = (
  input,
  imgWidth,
  imgHeight,
  options,
): ColorData<'rgba8888'> => {
  const outputBytes = new Uint8Array(imgWidth * imgHeight * 4); // 4 = 4 bytes per pixel

  const convert4to8 = options.depthConvert4to8 ?? DepthConverters.round4to8;

  for (let i = 0; i < imgWidth * imgHeight; i++) {
    const inputOffset = i * 2;  // 2 = 2 bytes per pixel
    const outputOffset = i * 4; // 4 = 4 bytes per pixel

    const inputByte1 = input.bytes[inputOffset + 0]; // byte for alpha + red
    const inputByte2 = input.bytes[inputOffset + 1]; // byte for green + blue

    const inputUint16 = (inputByte2 << 8) | inputByte1; // Little endian!

    const inputAlpha = (inputUint16 & 0xF000) >> 12;
    const inputRed   = (inputUint16 & 0x0F00) >> 8;
    const inputGreen = (inputUint16 & 0x00F0) >> 4;
    const inputBlue  = (inputUint16 & 0x000F) >> 0;

    const outputAlpha = convert4to8(inputAlpha);
    const outputRed   = convert4to8(inputRed);
    const outputGreen = convert4to8(inputGreen);
    const outputBlue  = convert4to8(inputBlue);

    outputBytes[outputOffset + 0] = outputRed;
    outputBytes[outputOffset + 1] = outputGreen;
    outputBytes[outputOffset + 2] = outputBlue;
    outputBytes[outputOffset + 3] = outputAlpha;
  }

  return {
    format: 'rgba8888',
    bytes: outputBytes,
  };
};

export { Options as OptionsARGB4444ToRGBA8888 };
