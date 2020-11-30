In order to generate data, you need to have an activated conda environment:

```bash
conda create --name bioformats python=3.8
conda activate bioformats
conda install -c ome bioformats2raw raw2ometiff
```

Then to generate the data:
```bash
./generate-data.sh
```