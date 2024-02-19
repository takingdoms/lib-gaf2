import { ColorData } from "../color/color-data";
import { ColorDataFormat } from "../color/color-data-format";

export interface DataConverter<
  TInputFormat extends ColorDataFormat = ColorDataFormat,
  TOutputFormat extends ColorDataFormat = ColorDataFormat,
  TOptions = undefined,
>{
  (
    inputData: ColorData<TInputFormat>,
    imageWidthPx: number,
    imageHeightPx: number,
    options: TOptions,
  ): ColorData<TOutputFormat>;
}
