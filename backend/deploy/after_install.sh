#!/bin/bash
set -e
# artifact is copied to /opt/chatapp by CodeDeploy 'files' section
# ensure jar has right permissions
chmod 755 /opt/chatapp/backend.jar || true
