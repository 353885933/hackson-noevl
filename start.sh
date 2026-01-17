#!/bin/sh
echo "Starting Narrative Engine on port 7860..."
echo "Checking static files..."
ls -la /usr/share/nginx/html/
echo "Testing nginx configuration..."
nginx -t
echo "Starting nginx..."
exec nginx -g "daemon off;"

