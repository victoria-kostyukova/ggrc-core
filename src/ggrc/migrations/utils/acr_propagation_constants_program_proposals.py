# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for keeping constants for ACR propagation rules
DO NOT MODIFY THESE VALUES.
These are just the common propagation dictionaries, that are used in different
migration files.
For migration consistency, do not update these values once they are merged.
If a modification is needed feel free to use these and modify them inside the
migration file, or add new common roles and propagation rules.
"""

GGRC_NEW_ROLES_PROPAGATION = {
    "Program": {
        "Program Editors": {
            "Relationship R": {
                "Proposal R": {
                },
            },
        },
        "Program Readers": {
            "Relationship R": {
                "Proposal R": {
                },
            },
        },
    },
}
