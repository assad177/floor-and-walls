export interface Texture {
  src: string;
  /** Degrees, to level a photo whose grain is tilted. */
  rotate?: number;
  /** Repeat size as a share of the photo's width. Leave out to stretch once over the whole area. */
  tile?: number;
}

/**
 * Photo textures, keyed by product id. A product without an entry is drawn as its flat colour,
 * which is right for paint. Only add an entry when a real texture photo exists.
 */
export const TEXTURES: Record<string, Texture> = {
  // floors
  "floor-oak": { src: "/textures/oak-floor.png", rotate: 25 },
  "floor-grey-lvp": { src: "/textures/grey-plank.png", tile: 0.25 },

  // walls
  "wall-panel": { src: "/textures/slat-panel.jpg" },

  // ceilings: add the id of your dark wood slat ceiling product here, for example
  "ceiling-wood": { src: "/products/wall-panel.png" },
};