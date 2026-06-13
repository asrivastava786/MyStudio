export type PrintZone = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ProductTemplate = {
  id: string;
  name: string;
  /** Flat product mockup — background layer */
  mockupUrl: string;
  /** Transparent PNG with shadows/folds/highlights — top layer */
  overlayUrl?: string;
  /**
   * CSS mix-blend-mode applied to the artwork canvas layer.
   * "multiply" makes designs look printed on fabric (darkens with bg).
   * "normal" for photorealistic mockups with a pre-cut white print area.
   */
  blendMode?: "normal" | "multiply" | "screen" | "overlay";
  canvasW: number;
  canvasH: number;
  zones: PrintZone[];
  blueprintId: number;
  printProviderId: number;
  defaultVariants: number[];
};

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  {
    id: "tote-beige",
    name: "Tote Bag",
    mockupUrl:
      "https://res.cloudinary.com/zory-studio/image/upload/v1756152149/tote_beige_bdrizt.avif",
    overlayUrl: undefined, // add transparent shadow PNG when ready
    blendMode: "multiply",
    canvasW: 800,
    canvasH: 1000,
    zones: [{ id: "front", label: "Front", x: 250, y: 500, w: 300, h: 400 }],
    blueprintId: 0,
    printProviderId: 0,
    defaultVariants: [],
  },
  {
    id: "shoes",
    name: "Sneakers",
    mockupUrl: "",
    overlayUrl: undefined,
    blendMode: "multiply",
    canvasW: 800,
    canvasH: 800,
    zones: [
      { id: "left", label: "Left Side", x: 80, y: 180, w: 270, h: 220 },
      { id: "right", label: "Right Side", x: 450, y: 180, w: 270, h: 220 },
    ],
    blueprintId: 0,
    printProviderId: 0,
    defaultVariants: [],
  },
  {
    id: "trolley",
    name: "Trolley Bag",
    mockupUrl:
      "https://res.cloudinary.com/zory-studio/image/upload/v1779638863/60afd17d1ba151568e7eb17a_e7hju2.avif",
    overlayUrl: undefined,
    blendMode: "multiply",
    canvasW: 800,
    canvasH: 1000,
    zones: [
      { id: "front", label: "Front", x: 180, y: 180, w: 440, h: 520 },
      { id: "side", label: "Side Pocket", x: 80, y: 600, w: 160, h: 200 },
    ],
    blueprintId: 0,
    printProviderId: 0,
    defaultVariants: [],
  },
];
