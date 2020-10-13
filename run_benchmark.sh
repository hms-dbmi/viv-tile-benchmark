#!/usr/bin/env bash
set -o errexit
die() { set +v; echo "$*" 1>&2 ; exit 1; }

# Run 10 iterations.
for i in $(seq 0 10); do 
   node ./benchmark-iter.js $@ "-iter" $i
done