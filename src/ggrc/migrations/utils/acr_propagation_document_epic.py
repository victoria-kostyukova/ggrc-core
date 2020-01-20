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

BASIC_ROLES = (
    "Admin",
    "Primary Contacts",
    "Secondary Contacts",
)

COMMENT_DOCUMENT_R = {
    "Relationship R": {
        "Comment R": {},
        "Document R": {
            "Relationship R": {
                "Comment R": {},
            }
        },
    },
}

COMMENT_DOCUMENT_RUD = {
    "Relationship R": {
        "Comment R": {},
        "Document RU": {
            "Relationship R": {
                "Comment R": {},
            }
        },
    },
}

PROPOSAL_RUD = {
    "Relationship R": {
        "Comment R": {},
        "Document RU": {
            "Relationship R": {
                "Comment R": {},
            }
        },
        "Proposal RU": {},
    },
}

PROPOSAL_R = {
    "Relationship R": {
        "Comment R": {},
        "Document R": {
            "Relationship R": {
                "Comment R": {},
            }
        },
        "Proposal R": {},
    },
}


BASIC_PROPAGATION = {
    "Admin": COMMENT_DOCUMENT_RUD,
    "Primary Contacts": COMMENT_DOCUMENT_RUD,
    "Secondary Contacts": COMMENT_DOCUMENT_RUD,
}


_ASSESSMENT_PROPAGATION = {
    ("Creators", "Verifiers"): {
        "Relationship R": {
            "Audit R": {
                "Relationship R": {
                    "Evidence R": {
                        "Relationship R": {
                            "Comment R": {},
                        },
                    },
                },
            },
            "Snapshot R": {
                "Relationship R": {
                    "Snapshot R": {},
                },
            },
            "Evidence RU": {
                "Relationship R": {
                    "Comment R": {},
                },
            },
            "Comment R": {},
            "Issue R": COMMENT_DOCUMENT_R,
        },
    },
    "Assignees": {
        "Relationship R": {
            "Snapshot R": {
                "Relationship R": {
                    "Snapshot R": {},
                },
            },
            "Audit R": {
                "Relationship R": {
                    "Evidence R": {
                        "Relationship R": {
                            "Comment R": {},
                        },
                    },
                },
            },
            "Evidence RU": {
                "Relationship R": {
                    "Comment R": {},
                },
            },
            "Comment R": {},
            "Issue RUD": COMMENT_DOCUMENT_RUD,
        },
    },
}

_CONTROL_ROLES = (
    "Admin",
    "Primary Contacts",
    "Secondary Contacts",
    "Principal Assignees",
    "Secondary Assignees",
)

_CONTROL_PROPAGATION = {
    _CONTROL_ROLES: PROPOSAL_RUD,
}


_AUDIT_FULL_ACCESS = {
    "Relationship R": {
        "Assessment RUD": {
            "Relationship R": {
                "Comment R": {},
                "Evidence RU": {
                    "Relationship R": {
                        "Comment R": {},
                    },
                },
            }
        },
        "AssessmentTemplate RUD": {},
        "Evidence RU": {
            "Relationship R": {
                "Comment R": {},
            },
        },
        "Issue RUD": COMMENT_DOCUMENT_RUD,
        "Snapshot RU": {},
    },
}

_PE_AUDIT_ACCESS = {
    "Relationship R": {
        "Assessment RU": {
            "Relationship R": {
                "Comment R": {},
                "Evidence RU": {
                    "Relationship R": {
                        "Comment R": {},
                    },
                },
            },
        },
        "AssessmentTemplate RUD": {},
        "Issue RUD": COMMENT_DOCUMENT_RUD,
        "Evidence RU": {
            "Relationship R": {
                "Comment R": {},
            },
        },
        "Snapshot RU": {},
    },
}

_AUDITOR_ACCESS = {
    "Relationship R": {
        "Assessment RU": {
            "Relationship R": {
                "Comment R": {},
                "Evidence RU": {
                    "Relationship R": {
                        "Comment R": {},
                    },
                },
            },
        },
        "AssessmentTemplate R": {},
        "Evidence RU": {
            "Relationship R": {
                "Comment R": {},
            },
        },
        "Issue RU": COMMENT_DOCUMENT_R,
        "Snapshot RU": {},
    },
}

_AUDIT_READ_ACCESS = {
    "Relationship R": {
        "Assessment R": {
            "Relationship R": {
                "Comment R": {},
                "Evidence R": {
                    "Relationship R": {
                        "Comment R": {},
                    },
                },
            },
        },
        "AssessmentTemplate R": {},
        "Evidence R": {
            "Relationship R": {
                "Comment R": {},
            },
        },
        "Issue R": COMMENT_DOCUMENT_R,
        "Snapshot R": {},
    },
}

_PROGRAM_OBJECTS_R = (
    "AccessGroup R",
    "Clause R",
    "Contract R",
    # "Control R",  # control is separate due to proposals
    "DataAsset R",
    "Facility R",
    "Issue R",
    "Market R",
    "Objective R",
    "OrgGroup R",
    "Policy R",
    "Process R",
    "Product R",
    "Project R",
    "Regulation R",
    # "Risk R",  # excluded due to proposals
    "RiskAssessment R",
    "Section R",
    "Standard R",
    "System R",
    "Threat R",
    "Vendor R",
)

_PROGRAM_OBJECTS_RUD = (
    "AccessGroup RUD",
    "Clause RUD",
    "Contract RUD",
    # "Control RUD",  # control is separate due to proposals
    "DataAsset RUD",
    "Facility RUD",
    "Issue RUD",
    "Market RUD",
    "Objective RUD",
    "OrgGroup RUD",
    "Policy RUD",
    "Process RUD",
    "Product RUD",
    "Project RUD",
    "Regulation RUD",
    # "Risk RUD",  # excluded due to proposals
    "RiskAssessment RUD",
    "Section RUD",
    "Standard RUD",
    "System RUD",
    "Threat RUD",
    "Vendor RUD",
)


GGRC_PROPAGATION = {
    "Assessment": _ASSESSMENT_PROPAGATION,

    "Control": _CONTROL_PROPAGATION,

    "AccessGroup": BASIC_PROPAGATION,
    "Clause": BASIC_PROPAGATION,
    "Contract": BASIC_PROPAGATION,
    "DataAsset": BASIC_PROPAGATION,
    "Facility": BASIC_PROPAGATION,
    "Issue": BASIC_PROPAGATION,
    "Market": BASIC_PROPAGATION,
    "Objective": BASIC_PROPAGATION,
    "OrgGroup": BASIC_PROPAGATION,
    "Policy": BASIC_PROPAGATION,
    "Process": BASIC_PROPAGATION,
    "Product": BASIC_PROPAGATION,
    "Project": BASIC_PROPAGATION,
    "Regulation": BASIC_PROPAGATION,
    "Section": BASIC_PROPAGATION,
    "Standard": BASIC_PROPAGATION,
    "System": BASIC_PROPAGATION,
    "Vendor": BASIC_PROPAGATION,
    "Evidence": {
        "Admin": {
            "Relationship R": {
                "Comment R": {}
            }
        }
    },
    "Document": {
        "Admin": {
            "Relationship R": {
                "Comment R": {}
            }
        }
    }

    # "RiskAssessment": does not have ACL roles
}


GGRC_BASIC_PERMISSIONS_PROPAGATION = {
    "Program": {
        "Program Managers": {
            "Relationship R": {
                "Audit RUD": _AUDIT_FULL_ACCESS,
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {},
                    },
                },
                _PROGRAM_OBJECTS_RUD: COMMENT_DOCUMENT_RUD,
                ("Control RUD", "Risk RUD"): PROPOSAL_RUD,
            }
        },
        "Program Editors": {
            "Relationship R": {
                "Audit RUD": _PE_AUDIT_ACCESS,
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {},
                    },
                },
                ("Control RUD", "Risk RUD"): PROPOSAL_RUD,
                _PROGRAM_OBJECTS_RUD: COMMENT_DOCUMENT_RUD,
            }
        },
        "Program Readers": {
            "Relationship R": {
                "Audit R": _AUDIT_READ_ACCESS,
                "Comment R": {},
                "Document R": {
                    "Relationship R": {
                        "Comment R": {},
                    },
                },
                _PROGRAM_OBJECTS_R: COMMENT_DOCUMENT_R,
                ("Control R", "Risk R"): PROPOSAL_R,
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document R": {
                    "Relationship R": {
                        "Comment R": {},
                    },
                },
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document R": {
                    "Relationship R": {
                        "Comment R": {},
                    },
                },
            }
        },
    },
    "Audit": {
        # Audit captains might also need to get propagated access to program
        # and all program related objects, so that they could clone audits and
        # update all audit snapshots.
        "Audit Captains": _AUDIT_FULL_ACCESS,
        "Auditors": _AUDITOR_ACCESS,
    },
}

GGRC_RISKS_PROPAGATION = {
    "Risk": {
        BASIC_ROLES: PROPOSAL_RUD,
    },
    "Threat": BASIC_PROPAGATION,
}
