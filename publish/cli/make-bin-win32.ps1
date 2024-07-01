$NODE_VERSION = "v20.12.2"
$TEMP_DIR = "./temp"
$DIST_DIR = "./dist"
$NODE_ZIP = "${TEMP_DIR}/node.zip"
$NODE_DIR = "${TEMP_DIR}/node"
$EXE_NAME = "lms.exe"

# Get the architecture using PowerShell
$ARCH = (Get-WmiObject -Class Win32_Processor).Architecture

# Map the PowerShell architecture numbers to URL suffixes
switch ($ARCH) {
    0 { $ARCH_SUFFIX = "x64" }  # x86 architecture, defaulting to x64 binaries
    9 { $ARCH_SUFFIX = "x64" }  # x64 architecture
    12 { $ARCH_SUFFIX = "arm64" }
    default {
        Write-Host "Unsupported architecture: $ARCH"
        exit 1
    }
}

# Set the download URL based on the architecture suffix
$NODE_DOWNLOAD_URL = "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-win-${ARCH_SUFFIX}.zip"

# Function to load .env files from current directory up to the root
function Load-EnvFromAncestors {
    $currentDir = Get-Location

    while ($currentDir -ne [System.IO.Path]::GetPathRoot($currentDir)) {
        $envPath = Join-Path $currentDir ".env"
        if (Test-Path $envPath) {
            Write-Host "Loading .env from $currentDir"
            Get-Content $envPath | ForEach-Object {
                # ignore lines that don't have the expected X=Y format
                if ($_ -and $_.Contains('=')) {
                    $key, $value = $_.Split('=', 2)
                    # Remove single quotes from the value if present
                    $value = $value.Trim("'")
                    # Set environment variable for the current process
                    [System.Environment]::SetEnvironmentVariable($key, $value, [System.EnvironmentVariableTarget]::Process)
                    # Output the environment variable and its value
                    Write-Output "Setting environment variable: '$key'"
                }
            }
        }
        $currentDir = Split-Path $currentDir -Parent
    }
}

# Call the function to load .env files
Load-EnvFromAncestors

# Create temp and dist directories if they don't exist
New-Item -Path $TEMP_DIR -ItemType Directory -Force | Out-Null
New-Item -Path $DIST_DIR -ItemType Directory -Force | Out-Null

# Download Node.js if it's not already downloaded
if (-Not (Test-Path "${NODE_DIR}/node.exe")) {
    Write-Host "Node.js not found. Downloading..."
    Invoke-WebRequest -Uri $NODE_DOWNLOAD_URL -OutFile $NODE_ZIP
    Expand-Archive -Path $NODE_ZIP -DestinationPath $TEMP_DIR
    Move-Item -Path "${TEMP_DIR}/node-${NODE_VERSION}-win-${ARCH_SUFFIX}" -Destination $NODE_DIR
    Remove-Item -Path $NODE_ZIP
} else {
    Write-Host "Node.js already downloaded."
}

# Generate the blob
& "${NODE_DIR}/node.exe" --experimental-sea-config ./sea-config.json

# Copy the node executable and rename it
Copy-Item -Path "${NODE_DIR}/node.exe" -Destination "${DIST_DIR}/${EXE_NAME}"

if (-Not $env:LMS_NO_SIGN) {
    # Remove the signature
    & signtool remove /s "${DIST_DIR}/${EXE_NAME}"
}

# Inject the blob into the copied binary
& postject "${DIST_DIR}/${EXE_NAME}" NODE_SEA_BLOB ./temp/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

if (-Not $env:LMS_NO_SIGN) {
    # Signing
    if (-Not (Get-Command "smctl" -ErrorAction SilentlyContinue)) {
        Write-Host 'Warning: smctl could not be found - To skip signing, $env:LMS_NO_SIGN = "true"'
        exit 1
    }

    # Check if WINDOWS_DIGICERT_KEYPAIR_ALIAS environment variable is set
    if ([string]::IsNullOrEmpty($env:WINDOWS_DIGICERT_KEYPAIR_ALIAS)) {
        Write-Host 'Warning: WINDOWS_DIGICERT_KEYPAIR_ALIAS is not set - To skip signing, $env:LMS_NO_SIGN = "true"'
        exit 1
    }

    # Try to sign the binary
    if ($DIST_DIR -and $EXE_NAME) {
        & smctl sign --keypair-alias $env:WINDOWS_DIGICERT_KEYPAIR_ALIAS --input "${DIST_DIR}/${EXE_NAME}"
    } else {
        Write-Host 'Warning: DIST_DIR or EXE_NAME is not set - To skip signing, set $env:LMS_NO_SIGN = "true"'
        exit 1
    }
} else {
    Write-Host "LMS_NO_SIGN is set, signing skipped."
}