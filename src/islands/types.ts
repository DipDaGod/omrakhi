/** The shape the category page hands to its islands. Serialised into the HTML,
    so it carries only what the grid and drawer actually render. */
export type ImgView = {
  src: string;
  srcset: string;
  sizes: string;
  width: number;
  height: number;
  lqip?: string;
};

export type ProductView = {
  code: string;
  name: string;
  alt: string;
  band: string;
  bandValue: number;
  moq: number;
  pack: string;
  packType: string;
  materials: string[];
  colours: string[];
  colourFamily: string;
  sizeMm: number;
  isNew: boolean;
  img: ImgView;
  detail?: ImgView;
  detailAlt?: string;
};

export type GridLabels = Record<string, string>;

export type FilterOption = { value: string; label: string; count: number };
