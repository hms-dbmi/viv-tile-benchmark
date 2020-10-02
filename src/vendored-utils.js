// This is a vendored version of the deck.gl tile utils that gives tile indices
// of the current zoom level.

import { OrthographicView } from "@deck.gl/core";

const TILE_SIZE = 512;
const DEFAULT_EXTENT = [-Infinity, -Infinity, Infinity, Infinity];

/**
 * gets the bounding box of a viewport
 */
function getBoundingBox(viewport, zRange, extent) {
  let bounds;
  if (zRange && zRange.length === 2) {
    const [minZ, maxZ] = zRange;
    const bounds0 = viewport.getBounds({ z: minZ });
    const bounds1 = viewport.getBounds({ z: maxZ });
    bounds = [
      Math.min(bounds0[0], bounds1[0]),
      Math.min(bounds0[1], bounds1[1]),
      Math.max(bounds0[2], bounds1[2]),
      Math.max(bounds0[3], bounds1[3]),
    ];
  } else {
    bounds = viewport.getBounds();
  }
  return [
    Math.max(bounds[0], extent[0]),
    Math.max(bounds[1], extent[1]),
    Math.min(bounds[2], extent[2]),
    Math.min(bounds[3], extent[3]),
  ];
}

function getTileIndex([x, y], scale) {
  return [(x * scale) / TILE_SIZE, (y * scale) / TILE_SIZE];
}

function getScale(z) {
  return Math.pow(2, z);
}

function getIdentityTileIndices(viewport, z, extent) {
  const bbox = getBoundingBox(viewport, null, extent);
  const scale = getScale(z);

  const [minX, minY] = getTileIndex([bbox[0], bbox[1]], scale);
  const [maxX, maxY] = getTileIndex([bbox[2], bbox[3]], scale);
  const indices = [];

  /*
      |  TILE  |  TILE  |  TILE  |
        |(minX)            |(maxX)
   */
  for (let x = Math.floor(minX); x < maxX; x++) {
    for (let y = Math.floor(minY); y < maxY; y++) {
      indices.push({ x, y, z });
    }
  }
  return indices;
}

/**
 * Returns all tile indices in the current viewport. If the current zoom level is smaller
 * than minZoom, return an empty array. If the current zoom level is greater than maxZoom,
 * return tiles that are on maxZoom.
 */
export function getTileIndices({ viewState, extent, tileSize, height, width }) {
  const { zoom } = viewState;
  const tiles = [];
  const newViewState = { ...viewState, zoom };
  const viewport = new OrthographicView({ ...newViewState }).makeViewport({
    width,
    height,
    viewState: newViewState,
  });
  let z = Math.round(zoom + Math.log2(TILE_SIZE / tileSize));
  tiles.push(
    ...getIdentityTileIndices(viewport, z, extent || DEFAULT_EXTENT)
  );
  return tiles;
};
