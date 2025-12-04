#!/bin/bash

echo "Making deploy scripts executable..."

# Add OS-level execute permissions
chmod +x backend/deploy/scripts/*.sh

# Update Git index to store executable bit permanently
git update-index --chmod=+x backend/deploy/scripts/stop_server.sh
git update-index --chmod=+x backend/deploy/scripts/before_install.sh
git update-index --chmod=+x backend/deploy/scripts/after_install.sh
git update-index --chmod=+x backend/deploy/scripts/start_server.sh
git update-index --chmod=+x backend/deploy/scripts/validate.sh

echo "Permissions updated and ready for commit."
echo "Next steps:"
echo "  git add ."
echo "  git commit -m 'Set executable permissions for deploy scripts'"
echo "  git push"
