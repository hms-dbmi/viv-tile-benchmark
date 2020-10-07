#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');


const url = `file://${__dirname}/build/index.html`;

async function run(outfile, config = {}) {
  const stream = fs.createWriteStream(outfile);

  const browser = await puppeteer.launch(config);
  const page = await browser.newPage();

  await page.setCacheEnabled(false);
  await page.reload({ waitUntil: 'networkidle2' });

  await page.goto(url);

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
        stream.write(headers + '\n', 'utf-8');
        first = true;
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
    console.log("./benchmark.js <filename> [chrome_flags]")
    process.exit(1);
  }
  const outfile = args[0];
  run(outfile, { args: args.slice(1) });
}

main();
