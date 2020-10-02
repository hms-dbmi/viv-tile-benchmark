import { createBioformatsZarrLoader, createOMETiffLoader } from '@hms-dbmi/viv';
import { images } from './test_config.json';
import { getTileIndices } from "./vendored-utils";
async function timeGetTile(loader, { x, y, z, loaderSelection }) {
  const start = performance.now()
  await loader.getTile({ x, y, z, loaderSelection });
  const end = performance.now();
  return [start, end];
}

async function getLoader({ url, format }) {
  if (format === 'zarr') {
    return createBioformatsZarrLoader({ url });
  }
  return createOMETiffLoader({ url });
}

function getTileCoords(props) {
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

async function timeRegions({ file, sources, regions }) {
  for (const { url, format, tileSize, compression } of sources) {
    const loader = await getLoader({ url, format });
    const { height: rasterHeight, width: rasterWidth } = loader.getRasterSize({ z: 0 })
    const extent = [0, 0, rasterWidth, rasterHeight];
    for (const { id, yCoord, xCoord, zoom, viewports, numChannels } of regions) {
      for (const n of numChannels) {
        const loaderSelection = [...Array(n).keys()].map(d => ({ channel: d }));
        for (const [height, width] of viewports) {
          const tileCoords = getTileCoords({
            yCoord,
            xCoord,
            width,
            height,
            zoom,
            tileSize,
            extent,
          });
          const p = tileCoords.map(t => timeGetTile(loader, { ...t, loaderSelection }));
          const times = await Promise.all(p);
          const records = times.map(([start, end], i) => {
            const { x, y, z } = tileCoords[i];
            return {
              file,
              format,
              compression,
              // The zoom level is the z, not the provided one.
              zoom: -z,
              tileSize,
              regionId: id,
              yCoord,
              xCoord,
              height,
              width,
              numChannels: n,
              tileId: `${x}-${y}-${z}`,
              startTime: start,
              endTime: end,
            };
          });
          console.table(records);
          console.debug(JSON.stringify(records));
        }
      }
    }
  }
}

async function main() {
  console.time('Run benchmark.')
  for (const img of images) {
    await timeRegions(img);
  }
  console.timeEnd('Run benchmark.')
}

main();
