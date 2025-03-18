#!/bin/bash

# Search for hard-coded URLs in all JavaScript and CSS files
echo "Searching for hard-coded URLs in src directory..."
grep -r --include="*.js" --include="*.css" --include="*.html" "192.168" src/
grep -r --include="*.js" --include="*.css" --include="*.html" "http://" src/

echo "Done!"