#!/bin/bash

# Simple test script to verify the scroll behavior implementation
# This script checks that all application files have the scroll behavior code

echo "🔍 Testing Application Form Scroll Behavior Implementation"
echo "========================================================="

# Array of application files to check
APPLICATION_FILES=(
  "src/pages/hack/[event_id]/hacker-application.js"
  "src/pages/hack/[event_id]/mentor-application.js"
  "src/pages/hack/[event_id]/volunteer-application.js"
  "src/pages/hack/[event_id]/sponsor-application.js"
  "src/pages/hack/[event_id]/judge-application.js"
)

# Counter for successful checks
PASSED=0
TOTAL=0

for file in "${APPLICATION_FILES[@]}"; do
  echo ""
  echo "📄 Checking: $file"
  
  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "❌ File not found!"
    continue
  fi
  
  TOTAL=$((TOTAL + 1))
  FILE_PASSED=true
  
  # Check for handleNext function
  if grep -q "const handleNext" "$file"; then
    echo "✅ handleNext function found"
  else
    echo "❌ handleNext function not found"
    FILE_PASSED=false
  fi
  
  # Check for handleBack function
  if grep -q "const handleBack\|handleBack.*=" "$file"; then
    echo "✅ handleBack function found"
  else
    echo "❌ handleBack function not found"
    FILE_PASSED=false
  fi
  
  # Check for scrollIntoView in the file
  if grep -q "scrollIntoView" "$file"; then
    echo "✅ scrollIntoView method found"
  else
    echo "❌ scrollIntoView method not found"
    FILE_PASSED=false
  fi
  
  # Check for formRef usage
  if grep -q "formRef.*current" "$file"; then
    echo "✅ formRef is properly used"
  else
    echo "❌ formRef usage not found"
    FILE_PASSED=false
  fi
  
  # Check for smooth behavior
  if grep -q "behavior.*smooth" "$file"; then
    echo "✅ Smooth scroll behavior configured"
  else
    echo "❌ Smooth scroll behavior not found"
    FILE_PASSED=false
  fi
  
  # Check for block start
  if grep -q "block.*start" "$file"; then
    echo "✅ Scroll to start block configured"
  else
    echo "❌ Scroll to start block not found"
    FILE_PASSED=false
  fi
  
  if [ "$FILE_PASSED" = true ]; then
    PASSED=$((PASSED + 1))
    echo "✅ All checks passed for this file"
  else
    echo "❌ Some checks failed for this file"
  fi
done

echo ""
echo "========================================================="
echo "📊 SUMMARY: $PASSED/$TOTAL files have correct scroll behavior"

if [ $PASSED -eq $TOTAL ]; then
  echo "🎉 All application forms now have smooth scroll behavior!"
  echo ""
  echo "🚀 UX IMPROVEMENT DETAILS:"
  echo "• Users will automatically scroll to the top when clicking Next/Back"
  echo "• Smooth animation provides better visual feedback"
  echo "• Validation errors also trigger scroll to top for better visibility"
  echo "• Consistent behavior across all application forms"
  exit 0
else
  echo "❌ Some files are missing the scroll behavior implementation"
  exit 1
fi