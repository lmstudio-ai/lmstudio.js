#!/bin/bash

set -e

if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "You are not on the 'main' branch. Exiting."
    exit 1
fi

if [[ -n $(git status --porcelain) || -n $(git submodule --quiet foreach --recursive git status --porcelain) ]]; then
  echo "Error: Workspace or submodules are not clean. Please commit or stash your changes."
  exit 1
fi

npm run publish

# Find the last commit with a message that matches "@Release-<Some Integer>"
last_release_commit=$(git log --grep="@Release-" --pretty=format:"%s" -n 1)

if [[ $last_release_commit =~ @Release-([0-9]+) ]]; then
  # Extract the integer part and increment it
  next_release_number=$((BASH_REMATCH[1] + 1))
else
  next_release_number=1
fi

git submodule foreach --recursive 'git add . && git diff --cached --exit-code --quiet || git commit -m "@Release-$next_release_number"'
git add .
git commit -m "@Release-$next_release_number"
git tag -a "release-$next_release_number-$(git rev-parse --short HEAD)" -m "$(date)"
git push --follow-tags
git submodule foreach --recursive 'git push --follow-tags'

npm run upload-scaffolds-manifest
