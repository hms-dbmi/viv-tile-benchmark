#!/bin/sh

set -o errexit

ORIGINAL_DIR="original"
mkdir -p $ORIGINAL_DIR
ORIGINAL_TIFF=original/spraggins.ome.tif
if [ ! -f $ORIGINAL_TIFF ]; then
    wget https://vitessce-data.s3.amazonaws.com/source-data/spraggins/spraggins.ome.tif -O spraggins.ome.tif
fi

DERIVED_DIR="derived"
N5_DIR="spraggins.n5"
WORKERS=$(nproc)
mkdir -p $DERIVED_DIR
cd $DERIVED_DIR
tile_sizes=(256 512 1024)
for tile_size in "${tile_sizes[@]}"
do
  ZARR_NAME="spraggins_${tile_size}"
	bioformats2raw ../$ORIGINAL_TIFF $ZARR_NAME --file_type=zarr --tile_height $tile_size --tile_width $tile_size --max_workers $WORKERS
  aws s3 cp --recursive $ZARR_NAME s3://viv-benchmark/data/$ZARR_NAME
  rm -r $ZARR_NAME
  bioformats2raw ../$ORIGINAL_TIFF $N5_DIR --tile_height $tile_size --tile_width $tile_size
  compression_algos=("zlib" "LZW")
  for algo in "${compression_algos[@]}"
  do
    TIFF_NAME="spraggins_${tile_size}_${algo}.ome.tif"
    raw2ometiff $N5_DIR $TIFF_NAME --compression=$algo
    aws s3 cp $TIFF_NAME s3://viv-benchmark/data/$TIFF_NAME
    rm $TIFF_NAME
  done
  cd ..
  rm -r $DERIVED_DIR
  mkdir -p $DERIVED_DIR
  cd $DERIVED_DIR
done
