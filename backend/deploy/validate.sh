#!/bin/bash
set -e
# wait for app to be up; adjust endpoint / port
curl -f http://localhost:8080/actuator/health || exit 1
