import { range, timeGetTile, getTileCoords, getLoader } from './utils';
import { images } from './config.json';
import PQueue from 'p-queue';

const ITERS = 10;

async function timeRegions({ file, sources, regions }, iter) {
  // TODO: Shuffle sources
  for (const { url, format, tileSize, compression } of sources) {

    for (const { id, yCoord, xCoord, zoom, viewports, numChannels } of regions) {
      for (const n of numChannels) {
        const loaderSelection = range(n).map(i => ({ channel: i }));

        for (const [height, width] of viewports) {
          const loader = await getLoader({ url, format });
          const { height: rasterHeight, width: rasterWidth } = loader.getRasterSize({ z: 0 })
          const extent = [0, 0, rasterWidth, rasterHeight];
          // Compute the tiles needed for each region for a viewport size and zoom level.
          const tileCoords = getTileCoords({
            yCoord,
            xCoord,
            width,
            height,
            zoom,
            tileSize,
            extent,
          });
          const queue = new PQueue({ concurrency: 10 });
          const records = [];
          for (const t of tileCoords) {
            queue.add(async () => {
              const [start, end] = await timeGetTile(loader, { ...t, loaderSelection });
              const { x, y, z } = t;
              const record = {
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
              records.push(record);
            })
          }
          await queue.onIdle();
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
    const iter = window.location.href.split('?')[1].split('=')[1];
    await timeRegions(img, iter);
  }
  console.timeEnd('Run benchmark.')
}

main();
