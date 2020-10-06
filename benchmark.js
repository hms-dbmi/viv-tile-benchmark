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
    if (msg.type() === 'timeEnd') {
      stream.end();
      await browser.close();
    }
    if (msg.type() === 'debug') {
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

run('./chrome_http2.csv', { ignoreHTTPSErrors: true });
run('./chrome_http1.csv', { args: ["--disable-http2"], ignoreHTTPSErrors: true });

