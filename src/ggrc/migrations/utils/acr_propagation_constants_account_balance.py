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

COMMENT_DOCUMENT_R = {
    "Relationship R": {
        "Document R": {
            "Relationship R": {
                "Comment R": {},
            }
        },
        "Comment R": {},
    },
}

COMMENT_DOCUMENT_RUD = {
    "Relationship R": {
        "Document RU": {
            "Relationship R": {
                "Comment R": {},
            }
        },
        "Comment R": {},
    },
}

BASIC_PROPAGATION = {
    "Assignee": COMMENT_DOCUMENT_RUD,
    "Admin": COMMENT_DOCUMENT_RUD,
    "Legal Counsels": COMMENT_DOCUMENT_RUD,
    "Line of Defense One Contacts": COMMENT_DOCUMENT_RUD,
    "Primary Contacts": COMMENT_DOCUMENT_RUD,
    "Compliance Contacts": COMMENT_DOCUMENT_RUD,
    "Product Managers": COMMENT_DOCUMENT_RUD,
    "Secondary Contacts": COMMENT_DOCUMENT_RUD,
    "System Owners": COMMENT_DOCUMENT_RUD,
    "Verifier": COMMENT_DOCUMENT_RUD,
    "Technical / Program Managers": COMMENT_DOCUMENT_RUD,
    "Technical Leads": COMMENT_DOCUMENT_RUD,
    "Vice Presidents": COMMENT_DOCUMENT_RUD,
}

GGRC_BASIC_PERMISSIONS_PROPAGATION = {
    "Program": {
        "Program Managers": {
            "Relationship R": {
                "AccountBalance RUD": COMMENT_DOCUMENT_RUD,
            }
        },
        "Program Editors": {
            "Relationship R": {
                "AccountBalance RUD": COMMENT_DOCUMENT_RUD,
            }
        },
        "Program Readers": {
            "Relationship R": {
                "AccountBalance R": COMMENT_DOCUMENT_R,
            }
        },
    },
    "AccountBalance": BASIC_PROPAGATION,
}
