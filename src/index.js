import { createBioformatsZarrLoader, createOMETiffLoader } from '@hms-dbmi/viv';
import { images } from './test_config.json';

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
  console.log(url)
  return createOMETiffLoader({ urlOrFile: url });
}

function getTileCoords(props) {
  const { left, top, width, height, zoomLevel, tileSize } = props;
  // TODO: Ilan
  return [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 1, z: 0 },
  ]
}

async function timeRegions({ file, sources, regions }) {
  for (const { url, format, tileSize, compression } of sources) {
    const loader = await getLoader({ url, format });
    
    for (const { id, top, left, zoomLevels, viewports, numChannels } of regions) {
      for (const n of numChannels) {
        const loaderSelection = [...Array(n).keys()].map(d => ({ channel: d }));
        for (const zoomLevel of zoomLevels) {
          for (const [height, width] of viewports) {

            const tileCoords = getTileCoords({ top, left, width, height, zoomLevel, tileSize });
            const p = tileCoords.map(t => timeGetTile(loader, { ...t, loaderSelection }));
            const times = await Promise.all(p);

            const records = times.map(([start, end], i) => {
              const { x, y, z } = tileCoords[i];
              return {
                file,
                format,
                compression,
                zoomLevel,
                tileSize,
                regionId: id,
                top, 
                left, 
                height,
                width,
                numChannels: n,
                tileId: `${x}-${y}-${z}`,
                startTime: start,
                endTime: end,
              }
            });
            console.table(records);
            console.debug(JSON.stringify(records));
          }
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
