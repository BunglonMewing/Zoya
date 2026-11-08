#!/usr/bin/env bash
# Rasterise the Zoya brand SVGs into PWA/Android icon PNGs and splash screens.
# Requires: node scripts/gen-brand.mjs (run first) and npx sharp-cli.
set -euo pipefail
cd "$(dirname "$0")/.."

render() { # input output [width height]
  if [ "$#" -ge 4 ]; then
    npx --yes sharp-cli@4 -i "$1" -o "$2" resize "$3" "$4" >/dev/null
  else
    npx --yes sharp-cli@4 -i "$1" -o "$2" >/dev/null
  fi
  echo "  ✓ $2"
}

node scripts/gen-brand.mjs

echo "Web icons"
render public/icons/icon.svg public/icons/icon-192.png 192 192
render public/icons/icon.svg public/icons/icon-512.png 512 512
render public/icons/icon-maskable.svg public/icons/icon-maskable-512.png 512 512
render public/icons/icon.svg public/icons/apple-touch-icon.png 180 180

echo "Android launcher icons"
res=android/app/src/main/res
declare -A DENSITY=( [mdpi]=48 [hdpi]=72 [xhdpi]=96 [xxhdpi]=144 [xxxhdpi]=192 )
for d in "${!DENSITY[@]}"; do
  size=${DENSITY[$d]}
  render public/icons/icon.svg "$res/mipmap-$d/ic_launcher.png" "$size" "$size"
  render public/icons/icon-round.svg "$res/mipmap-$d/ic_launcher_round.png" "$size" "$size"
done

echo "Android adaptive foreground"
declare -A FG=( [mdpi]=108 [hdpi]=162 [xhdpi]=216 [xxhdpi]=324 [xxxhdpi]=432 )
for d in "${!FG[@]}"; do
  size=${FG[$d]}
  render assets/brand/zoya-foreground.svg "$res/mipmap-$d/ic_launcher_foreground.png" "$size" "$size"
done

echo "Splash screens"
while IFS= read -r file; do
  dims=$(file -b "$file" | sed -E 's/^[^0-9]*([0-9]+) x ([0-9]+),.*/\1 \2/')
  width=${dims% *}
  height=${dims#* }
  tmp=$(mktemp --suffix=.svg)
  node scripts/gen-brand.mjs splash "$width" "$height" "$tmp"
  npx --yes sharp-cli@4 -i "$tmp" -o "$file" >/dev/null
  rm -f "$tmp"
  echo "  ✓ $file (${width}x${height})"
done < <(find "$res" -name splash.png | sort)

echo "Done."
