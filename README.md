#### Generate fixtures and deploy image web-server.

Navivate to `deployment/README.md` for more information.

#### Run client-side benchmark in headless browser.

```bash
$ npm install && npm run build
$ npm run-script bench # runs benchmark.
```

#### Plot results.

The client scripts will save tile loading times in `chrome_http1.csv` and `chrome_http2.csv`.
The R scripts in `plots.Rmd` contain the code to produce figures for these data.
