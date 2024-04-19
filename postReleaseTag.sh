#!/bin/bash

# After every release, run this script to tag the current commit
# This allows lerna to know how to diff
git tag -a "release-$(git rev-parse --short HEAD)" -m "$(date)"
