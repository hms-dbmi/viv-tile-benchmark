import { range, timeGetTile, getTileCoords, getLoader } from './utils';
import { images } from './config.json';

const ITERS = 10;

async function timeRegions({ file, sources, regions }, iter) {
  for (const { url, format, tileSize, compression } of sources) {
    const loader = await getLoader({ url, format });
    const { height: rasterHeight, width: rasterWidth } = loader.getRasterSize({ z: 0 })
    const extent = [0, 0, rasterWidth, rasterHeight];
    for (const { id, yCoord, xCoord, zoom, viewports, numChannels } of regions) {
      for (const n of numChannels) {
        const loaderSelection = range(n).map(i => ({ channel: i }));
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
              iter,
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
    for (let i = 0; i < ITERS; i++) {
      await timeRegions(img, i);
    }
  }
  console.timeEnd('Run benchmark.')
}

main();
