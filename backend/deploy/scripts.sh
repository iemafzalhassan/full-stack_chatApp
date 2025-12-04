#!/bin/bash
set -e
if systemctl is-active --quiet chatapp.service; then
  systemctl stop chatapp.service
fi
