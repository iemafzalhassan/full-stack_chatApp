#!/bin/bash
set -e
systemctl daemon-reload
systemctl enable chatapp.service
systemctl start chatapp.service
