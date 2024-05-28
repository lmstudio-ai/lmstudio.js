#!/bin/bash

NODE_VERSION="v20.12.2"
NODE_DOWNLOAD_URL="https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-win-x64.zip"
TEMP_DIR="./temp"
DIST_DIR="./dist"
NODE_ZIP="${TEMP_DIR}/node.zip"
NODE_DIR="${TEMP_DIR}/node"
EXE_NAME="lms.exe"

# Function to load .env files from current directory up to the root
load_env_from_ancestors() {
  # Get the current directory
  local current_dir=$(pwd)

  # Loop until the root directory is reached
  while [ "$current_dir" != "/" ]; do
    # Check for the presence of a .env file
    if [ -f "$current_dir/.env" ]; then
      echo "Loading .env from $current_dir"
      # Export variables defined in .env file
      set -a
      # shellcheck source=/dev/null
      . "$current_dir/.env"
      set +a
    fi
    # Move up to the parent directory
    current_dir=$(dirname "$current_dir")
  done
}

# Call the function to load .env files
load_env_from_ancestors

# Create temp and dist directories if they don't exist
mkdir -p $TEMP_DIR
mkdir -p $DIST_DIR

# Download Node.js if it's not already downloaded
if [ ! -f "${NODE_DIR}/node.exe" ]; then
  echo "Node.js not found. Downloading..."
  curl $NODE_DOWNLOAD_URL --output $NODE_ZIP
  unzip $NODE_ZIP -d $TEMP_DIR
  mv "${TEMP_DIR}/node-${NODE_VERSION}-win-x64" $NODE_DIR
  rm $NODE_ZIP
else
  echo "Node.js already downloaded."
fi

# Generate the blob
"${NODE_DIR}/node.exe" --experimental-sea-config ./sea-config.json

# Copy the node executable and rename it
cp "${NODE_DIR}/node.exe" "${DIST_DIR}/${EXE_NAME}"

if [ -z "$LMS_NO_SIGN" ]; then
    # Remove the signature
    signtool remove "//s" "${DIST_DIR}/${EXE_NAME}"

    # Inject the blob into the copied binary
    postject "${DIST_DIR}/${EXE_NAME}" NODE_SEA_BLOB ./temp/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

    # Signing

    if ! command -v smctl &> /dev/null
    then
        echo "Warning: smctl could not be found - To skip signing, set LMS_NO_SIGN=true"
        exit 1
    fi

    # Check if WINDOWS_DIGICERT_KEYPAIR_ALIAS environment variable is set
    if [[ -z "${WINDOWS_DIGICERT_KEYPAIR_ALIAS}" ]]; then
        echo "Warning: WINDOWS_DIGICERT_KEYPAIR_ALIAS is not set - To skip signing, set LMS_NO_SIGN=true"
        exit 1
    fi

    # Try to sign the binary
    if [[ -n "${DIST_DIR}" ]] && [[ -n "${EXE_NAME}" ]]; then
        echo "Attempting to sign '${DIST_DIR}/${EXE_NAME}'..."
        output=$(smctl sign --keypair-alias="${WINDOWS_DIGICERT_KEYPAIR_ALIAS}" --input "${DIST_DIR}/${EXE_NAME}" -v)
        if [ $? -ne 0 ] || [[ ! $output == *"SUCCESSFUL"* ]]; then
            echo "Error: Failed to sign the binary at '${DIST_DIR}/${EXE_NAME}' with output: $output"
            echo "Signing FAILED"
            exit 1
        fi
        echo "Signing was SUCCESSFUL"
    else
        echo "Warning: DIST_DIR or EXE_NAME is not set - To skip signing, set LMS_NO_SIGN=true"
        exit 1
    fi
else
  echo "LMS_NO_SIGN is set, signing skipped."
fi

