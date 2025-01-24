#!/bin/bash

set -e

git submodule update --recursive --init

# Function to check repository status
check_repo_status() {
    local repo_path=$1
    local repo_name=$2
    
    echo "➤  Checking $repo_name..."
    
    # Check workspace status first
    # if [ -n "$(git status --porcelain)" ]; then
    #     echo "  ✗ Error: Working directory is not clean"
    #     git status --short
    #     exit 1
    # else
    #     echo "  ✓ Working directory is clean"
    # fi
    
    # Fetch latest changes
    echo "      Fetching latest changes..."
    git fetch
    
    # Get current HEAD commit
    current_head=$(git rev-parse HEAD)
    # Get origin/main commit
    origin_main_commit=$(git rev-parse origin/main)
    
    # Check if HEAD points to the same commit as origin/main
    if [ "$current_head" = "$origin_main_commit" ]; then
        echo "      HEAD points to same commit as origin/main"
        # If in detached HEAD state, checkout main
        if ! git symbolic-ref -q HEAD >/dev/null; then
            echo "      HEAD is detached, checking out main branch..."
            git checkout main
        fi
    else
        echo "  ✗ Error: HEAD points to different commit than origin/main"
        exit 1
    fi
    
    # Check for unpushed changes
    if [ -n "$(git log @{u}.. 2>/dev/null)" ]; then
        echo "  ✗ Error: There are unpushed changes"
        exit 1
    else
        echo "  ✓ No unpushed changes"
    fi
    
    # Check for unpulled changes
    if [ -n "$(git log ..@{u} 2>/dev/null)" ]; then
        echo "  ✗ Error: There are unpulled changes"
        exit 1
    else
        echo "  ✓ No unpulled changes"
    fi
    
    echo "✓ All checks passed for $repo_name"
    echo "-----------------------------------"
}

export -f check_repo_status

# Check main repository
main_repo_path=$(git rev-parse --show-toplevel)
check_repo_status "$main_repo_path" "main repository"

# Check each submodule
git submodule foreach --recursive \
    'check_repo_status "$path" "submodule $name"'

echo "All repositories passed checks! Start publishing sequence"

npm run publish

# Find the last commit with a message that matches "@Release-<Some Integer>"
last_release_commit=$(git log --grep="@Release-" --pretty=format:"%s" -n 1)

if [[ $last_release_commit =~ @Release-([0-9]+) ]]; then
  # Extract the integer part and increment it
  next_release_number=$((BASH_REMATCH[1] + 1))
else
  next_release_number=1
fi

git submodule foreach --recursive "git add . && git diff --cached --exit-code --quiet || git commit -m '@Release-$next_release_number'"
git add .
git commit -m "@Release-$next_release_number"
git tag -a "release-$next_release_number-$(git rev-parse --short HEAD)" -m "$(date)"
git push --follow-tags
git submodule foreach --recursive 'git push --follow-tags'

npm run upload-scaffolds-manifest
