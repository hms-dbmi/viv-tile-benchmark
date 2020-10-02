import { createBioformatsZarrLoader, createOMETiffLoader } from '@hms-dbmi/viv';
import { getTileIndices } from "./vendored-utils";

export async function timeGetTile(loader, { x, y, z, loaderSelection }) {
  const start = performance.now()
  await loader.getTile({ x, y, z, loaderSelection });
  const end = performance.now();
  return [start, end];
}

export async function getLoader({ url, format }) {
  if (format === 'zarr') {
    return createBioformatsZarrLoader({ url });
  }
  return createOMETiffLoader({ url });
}

export function getTileCoords(props) {
  const {
    xCoord,
    yCoord,
    width,
    height,
    zoom: originalZoom,
    tileSize,
    extent,
  } = props;
  const tileIndices = [];
  for (let zoom = originalZoom; zoom <= 0; zoom++) {
    const viewState = { target: [xCoord, yCoord], zoom };
    tileIndices.push(
      ...getTileIndices({ viewState, width, height, tileSize, extent })
    );
  }
  // See https://github.com/visgl/deck.gl/pull/4616/files#diff-4d6a2e500c0e79e12e562c4f1217dc80R128
  // and https://github.com/hms-dbmi/viv/blob/db6f08a14f4d49590c49ea6ca23055782dcab29a/src/layers/MultiscaleImageLayer/MultiscaleImageLayer.js#L88-L94
  const correctedIndices = tileIndices.map((tile) => ({
    x: tile.x,
    y: tile.y,
    z: Math.round(-tile.z + Math.log2(512 / tileSize)),
  }));
  return correctedIndices;
}

export function range(n) {
  return [...Array(n).keys()];
}
