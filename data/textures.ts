
export interface Texture {
  src: string;
  rotate?: number;
  tile?: number;
}

export const TEXTURES: Record<string, Texture> = {
  // Flooring
  "floor-oak": {
    src: "/textures/oak-floor.png",
    rotate: 25,
  },
  "floor-grey-lvp": {
    src: "/textures/grey-plank.png",
    tile: 0.25,
  },

  // Wall panels
  "wall-panel": {
    src: "/textures/slat-panel.jpg",
  },

  // Ceiling — use this only if the image shows a ceiling texture
  "ceiling-wood": {
    src: "/products/ceiling.png",
  },
};
