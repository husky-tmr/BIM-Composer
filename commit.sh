#!/bin/bash
# Quick commit helper for conventional commits
# Usage: ./commit.sh <type> <scope> <message>
# Example: ./commit.sh feat viewer "add zoom controls"

if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Usage: ./commit.sh <type> <scope> <message>"
    echo ""
    echo "Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert"
    echo ""
    echo "Example: ./commit.sh feat viewer \"add zoom controls\""
    exit 1
fi

git commit -m "$1($2): $3"
