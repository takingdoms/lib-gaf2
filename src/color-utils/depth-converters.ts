import { BitDepth } from '../color/bit-depth';

/** Converts a color component value from one bit-depth to another bit-depth */
export interface DepthConverter<
  TInputDepth extends BitDepth = BitDepth,
  TOutputDepth extends BitDepth = BitDepth,
>{
  (input: number): number;
};

/**
 * This function exists simply to facilitate validation of the input and output values.
 */
function makeDepthConverter<
  TInputDepth extends BitDepth,
  TOutputDepth extends BitDepth,
>(
  inputDepth: TInputDepth,
  outputDepth: TOutputDepth,
  fn: (input: number) => number,
): DepthConverter<TInputDepth, TOutputDepth> {
  return (input: number) => {
    if (!BitDepth.validateInteger(input, inputDepth)) {
      throw new Error(`Input value "${input}" with bit depth "${inputDepth}" is out of bounds.`);
    }

    const output = fn(input);

    if (!BitDepth.validateInteger(output, outputDepth)) {
      throw new Error(`Output value "${output}" with bit depth "${outputDepth}" is out of bounds.`);
    }

    return output;
  }
}

const round4to8 = makeDepthConverter(4, 8, (input) => {
  return Math.round((input * 255) / 15);
});

const round8to4 = makeDepthConverter(8, 4, (input) => {
  return Math.round((input * 15) / 255);
});

const round5to8 = makeDepthConverter(5, 8, (input) => {
  return Math.round((input * 255) / 31);
});

const round8to5 = makeDepthConverter(8, 5, (input) => {
  return Math.round((input * 31) / 255);
});

const round1to8 = makeDepthConverter(1, 8, (input) => {
  return input === 0 ? 0 : 255;
});

const round8to1 = makeDepthConverter(8, 1, (input) => {
  // return Math.round(input / 255); // same thing as below:
  return input < 128 ? 0 : 1;
});

const opaqueOrZero8to1 = makeDepthConverter(8, 1, (input) => {
  return input === 255 ? 1 : 0;
});

const transparentOrOne8to1 = makeDepthConverter(8, 1, (input) => {
  return input === 0 ? 0 : 1;
});

export const DepthConverters = {
  round4to8,
  round8to4,
  round5to8,
  round8to5,
  round1to8,
  round8to1,
  opaqueOrZero8to1,
  transparentOrOne8to1,
} as const;
