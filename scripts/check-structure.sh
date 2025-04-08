#!/bin/bash

# Make script executable with: chmod +x scripts/check-structure.sh

echo "Checking project structure..."

# Find all enum files in the project
echo "Looking for role.enum.ts files:"
find src -name "role.enum.ts" -o -name "roles.enum.ts"

# Check the specific import path from the error
echo "Checking specific path from error:"
if [ -f "src/enums/role.enum.ts" ]; then
  echo "✅ File exists at src/enums/role.enum.ts"
else
  echo "❌ File does not exist at src/enums/role.enum.ts"
fi

# Look for the roles decorator file
echo "Looking for roles.decorator.ts:"
find src -name "roles.decorator.ts"

# Check the directory structure
echo "Directory structure around auth folder:"
find src/auth -type f | sort

echo "Check complete!"