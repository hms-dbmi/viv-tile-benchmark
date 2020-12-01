#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');


const url = `file://${__dirname}/build/index.html`;

async function run(outfile, config = {}, iter) {
  const stream = fs.createWriteStream(outfile, { flags: iter > 0 ? "a" : undefined });
  const iterUrl = `${url}?iter=${iter}`;

  const browser = await puppeteer.launch(config);
  const page = await browser.newPage();

  await page.setCacheEnabled(false);
  await page.reload({ waitUntil: 'networkidle2' });

  await page.goto(iterUrl);

  let first = false;
  page.on('console', async msg => {
    const type = msg.type();
    if (type === 'timeEnd') {
      stream.end();
      await browser.close();
    }
    if (type === 'debug') {
      const records = JSON.parse(msg.text());
      if (!first) {
        const headers = Object.keys(records[0]).join(',');
        // Only write headers on first pass.
        if (iter === 0) {
          stream.write(headers + '\n', 'utf-8');
          first = true;
        }
      }
      for (const record of records) {
        const values = Object.values(record).join(',');
        stream.write(values + '\n', 'utf-8');
      }
    }
  })
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    exitOnBadArgs('No args found.');
  }
  const outfile = args[0];
  const flags = new Set(args.slice(1, -2));
  const headless = !flags.delete('--no-headless');
  const ignoreHTTPSErrors = flags.has("--ignore-https-errors");
  const [iterArg] = args.slice(-2);
  if (iterArg !== '-iter') {
    exitOnBadArgs(`-iter arg is not correct - found ${iterArg}`);
  }
  const [iter] = args.slice(-1);
  console.log("running with args: ", { headless, ignoreHTTPSErrors, args: [...flags] });
  run(outfile, { headless, ignoreHTTPSErrors, args: [...flags] }, Number(iter));
}

function exitOnBadArgs(message) {
  console.log(message)
  console.log("./benchmark-iter.js <filename> [--no-headless] [--ignore-https-errors] [chrome_flags] [-iter i]")
  process.exit(1);
}

main();
