#!/usr/bin/env bash

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

set -o errexit
set -o nounset

declare -r SCRIPTPATH=$( cd "$(dirname "$0")" ; pwd -P )
cd "${SCRIPTPATH}/../../"

usage () {
  cat <<EOF
Usage: $(basename ${0})

Fetch the latest upstream/master,
search src/ggrc/settings/default.py for the version number,
create a tag with the name equal to the version number,
push it to upstream.

Prerequisites:
1. Google repo is pointed by "upstream" remote.
2. Git is configured to sign tags
(see https://help.github.com/articles/signing-commits-with-gpg/)
EOF
}

write_visible_message () {
  message=${1:-}
  echo '-----'
  echo ${message}
  echo '-----'
}

version_script () {
  declare -r SETTINGS_FILE="src/ggrc/settings/default.py"
  declare -r TARGET_REF="FETCH_HEAD"

  cat <<EOF
BUILD_NUMBER = ""
$(git grep -h "VERSION =" $TARGET_REF -- $SETTINGS_FILE)
print VERSION
EOF
}

main () {
  if [[ "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi

  git fetch upstream master

  v=$(version_script | python -)
  git tag -s -m "$v" $v FETCH_HEAD

  write_visible_message "$(git rev-parse FETCH_HEAD) is tagged as $v"
  git show $v

  write_visible_message "Pushing $v to upstream:"
  git push upstream $v
}

main "$@"
