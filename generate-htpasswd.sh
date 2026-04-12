#!/bin/bash
# Script to generate Basic Auth password file for Nginx
# Usage: ./generate-htpasswd.sh username

set -e

HTPASSWD_FILE="nginx/.htpasswd"

if [ -z "$1" ]; then
    echo "Usage: $0 <username>"
    echo "This will create/update the htpasswd file for Basic Auth"
    exit 1
fi

USERNAME="$1"

# Check if htpasswd exists, if not create with -c flag
if [ -f "$HTPASSWD_FILE" ]; then
    # Use docker to generate htpasswd entry (since alpine doesn't have htpasswd)
    docker run --rm --entrypoint htpasswd httpd:alpine -nb "$USERNAME" deepwiki >> "$HTPASSWD_FILE"
    echo "Added user '$USERNAME' to $HTPASSWD_FILE"
else
    # Create new file
    docker run --rm --entrypoint htpasswd httpd:alpine -nb "$USERNAME" deepwiki > "$HTPASSWD_FILE"
    echo "Created $HTPASSWD_FILE with user '$USERNAME'"
fi

echo ""
echo "Password file created at: $HTPASSWD_FILE"
echo "You can now start the services with: docker-compose up -d"
