#!/bin/bash

NODE_VERSION="v20.12.2"
NODE_FILE_SUFFIX="darwin-arm64"
NODE_DOWNLOAD_URL="https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-${NODE_FILE_SUFFIX}.tar.gz"
TEMP_DIR="./temp"
DIST_DIR="./dist"
NODE_TAR="${TEMP_DIR}/node.tar.gz"
NODE_DIR="${TEMP_DIR}/node"
EXE_NAME="lms"

load_env_from_ancestors() {
  local current_dir=$(pwd)
  while [ "$current_dir" != "/" ]; do
    if [ -f "$current_dir/.env" ]; then
      echo "Loading .env from $current_dir"
      set -a
      . "$current_dir/.env"
      set +a
    fi
    current_dir=$(dirname "$current_dir")
  done
}

load_env_from_ancestors

mkdir -p $TEMP_DIR
mkdir -p $DIST_DIR

if [ ! -f "${NODE_DIR}/bin/node" ]; then
  echo "Node.js not found. Downloading..."
  curl $NODE_DOWNLOAD_URL --output $NODE_TAR
  tar -xzf $NODE_TAR -C $TEMP_DIR
  mv "${TEMP_DIR}/node-${NODE_VERSION}-${NODE_FILE_SUFFIX}" $NODE_DIR
  rm $NODE_TAR
else
  echo "Node.js already downloaded."
fi

"${NODE_DIR}/bin/node" --experimental-sea-config ./sea-config.json

cp "${NODE_DIR}/bin/node" "${DIST_DIR}/${EXE_NAME}"

if ! command -v codesign &> /dev/null
then
    echo "Warning: codesign could not be found"
    exit 1
fi

codesign --remove-signature "${DIST_DIR}/${EXE_NAME}"

postject "${DIST_DIR}/${EXE_NAME}" NODE_SEA_BLOB ./temp/sea-prep.blob \
  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 \
  --macho-segment-name NODE_SEA

if [[ -z "${APPLE_SIGNING_IDENTITY}" ]]; then
    echo "Warning: APPLE_SIGNING_IDENTITY is not set"
    exit 1
fi

if [[ -n "${DIST_DIR}" ]] && [[ -n "${EXE_NAME}" ]]; then
    codesign --sign "${APPLE_SIGNING_IDENTITY}" --options runtime --entitlements entitlements.plist "${DIST_DIR}/${EXE_NAME}"
    if [ "$LMS_SKIP_NOTARIZATION" = "1" ] || [ "$LMS_SKIP_NOTARIZATION" = "true" ]; then
        echo "LMS_SKIP_NOTARIZATION is set. Skipping notarization..."
    else
        zip -r "${DIST_DIR}/${EXE_NAME}.zip" "${DIST_DIR}/${EXE_NAME}"
        xcrun notarytool submit "${DIST_DIR}/${EXE_NAME}.zip" --keychain-profile "AC_PASSWORD" --wait
    fi
else
    echo "Warning: DIST_DIR or EXE_NAME is not set"
    exit 1
fi
