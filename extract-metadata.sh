#!/bin/bash
# Extract metadata files for contract verification

echo "Extracting metadata for TokenVesting..."
jq '.output | to_entries[] | select(.value.contractName == "TokenVesting") | .value.metadata | fromjson' \
  artifacts/build-info/2b63dc87025a71fc70558bbeb2f4f987.json > metadata-tokenvesting.json

echo "Extracting metadata for MockERC20..."
jq '.output | to_entries[] | select(.value.contractName == "MockERC20") | .value.metadata | fromjson' \
  artifacts/build-info/2b63dc87025a71fc70558bbeb2f4f987.json > metadata-mockerc20.json

echo "✅ Metadata files extracted!"
echo "  - metadata-tokenvesting.json"
echo "  - metadata-mockerc20.json"
