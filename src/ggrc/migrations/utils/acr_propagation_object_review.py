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

# pylint: disable=too-many-lines

CURRENT_TREE = {
    "AccessGroup": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Assessment": {
        "Assignees": {
            "Relationship R": {
                "Audit R": {
                    "Relationship R": {
                        "Evidence R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Comment R": {},
                "Evidence RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Issue RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Snapshot R": {
                    "Relationship R": {
                        "Snapshot R": {}
                    }
                }
            }
        },
        "Creators": {
            "Relationship R": {
                "Audit R": {
                    "Relationship R": {
                        "Evidence R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Comment R": {},
                "Evidence RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Issue R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Snapshot R": {
                    "Relationship R": {
                        "Snapshot R": {}
                    }
                }
            }
        },
        "Primary Contacts": {},
        "Secondary Contacts": {},
        "Verifiers": {
            "Relationship R": {
                "Audit R": {
                    "Relationship R": {
                        "Evidence R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Comment R": {},
                "Evidence RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Issue R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Snapshot R": {
                    "Relationship R": {
                        "Snapshot R": {}
                    }
                }
            }
        }
    },
    "Audit": {
        "Audit Captains": {
            "Relationship R": {
                "Assessment RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Evidence RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "AssessmentTemplate RUD": {},
                "Evidence RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Issue RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Snapshot RU": {}
            }
        },
        "Auditors": {
            "Relationship R": {
                "Assessment RU": {
                    "Relationship R": {
                        "Comment R": {},
                        "Evidence RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "AssessmentTemplate R": {},
                "Evidence RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Issue RU": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Snapshot RU": {}
            }
        }
    },
    "BackgroundTask": {
        "Admin": {}
    },
    "Comment": {
        "Admin": {}
    },
    "Contract": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Control": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Proposal RU": {}
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Proposal RU": {}
            }
        },
        "Principal Assignees": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Proposal RU": {}
            }
        },
        "Secondary Assignees": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Proposal RU": {}
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Proposal RU": {}
            }
        }
    },
    "CycleTaskGroupObjectTask": {
        "Task Assignees": {},
        "Task Secondary Assignees": {}
    },
    "DataAsset": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Document": {
        "Admin": {
            "Relationship R": {
                "Comment R": {}
            }
        }
    },
    "Evidence": {
        "Admin": {
            "Relationship R": {
                "Comment R": {}
            }
        }
    },
    "Facility": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Issue": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Market": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Metric": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Objective": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "OrgGroup": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Policy": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Process": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Product": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "ProductGroup": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Program": {
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document R": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Program Editors": {
            "Relationship R": {
                "AccessGroup RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Audit RUD": {
                    "Relationship R": {
                        "Assessment RU": {
                            "Relationship R": {
                                "Comment R": {},
                                "Evidence RU": {
                                    "Relationship R": {
                                        "Comment R": {}
                                    }
                                }
                            }
                        },
                        "AssessmentTemplate RUD": {},
                        "Evidence RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        },
                        "Issue RUD": {
                            "Relationship R": {
                                "Comment R": {},
                                "Document RU": {
                                    "Relationship R": {
                                        "Comment R": {}
                                    }
                                }
                            }
                        },
                        "Snapshot RU": {}
                    }
                },
                "Comment R": {},
                "Contract RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Control RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        },
                        "Proposal RU": {}
                    }
                },
                "DataAsset RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Facility RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Issue RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Market RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Metric RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Objective RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "OrgGroup RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Policy RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Process RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Product RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "ProductGroup RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Project RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Regulation RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Requirement RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Risk RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        },
                        "Proposal RU": {}
                    }
                },
                "RiskAssessment RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Standard RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "System RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "TechnologyEnvironment RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Threat RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Vendor RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                }
            }
        },
        "Program Managers": {
            "Relationship R": {
                "AccessGroup RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Audit RUD": {
                    "Relationship R": {
                        "Assessment RUD": {
                            "Relationship R": {
                                "Comment R": {},
                                "Evidence RU": {
                                    "Relationship R": {
                                        "Comment R": {}
                                    }
                                }
                            }
                        },
                        "AssessmentTemplate RUD": {},
                        "Evidence RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        },
                        "Issue RUD": {
                            "Relationship R": {
                                "Comment R": {},
                                "Document RU": {
                                    "Relationship R": {
                                        "Comment R": {}
                                    }
                                }
                            }
                        },
                        "Snapshot RU": {}
                    }
                },
                "Comment R": {},
                "Contract RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Control RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        },
                        "Proposal RU": {}
                    }
                },
                "DataAsset RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Facility RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Issue RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Market RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Metric RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Objective RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "OrgGroup RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Policy RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Process RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Product RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "ProductGroup RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Project RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Regulation RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Requirement RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Risk RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        },
                        "Proposal RU": {}
                    }
                },
                "RiskAssessment RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Standard RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "System RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "TechnologyEnvironment RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Threat RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Vendor RUD": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document RU": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                }
            }
        },
        "Program Readers": {
            "Relationship R": {
                "AccessGroup R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Audit R": {
                    "Relationship R": {
                        "Assessment R": {
                            "Relationship R": {
                                "Comment R": {},
                                "Evidence R": {
                                    "Relationship R": {
                                        "Comment R": {}
                                    }
                                }
                            }
                        },
                        "AssessmentTemplate R": {},
                        "Evidence R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        },
                        "Issue R": {
                            "Relationship R": {
                                "Comment R": {},
                                "Document R": {
                                    "Relationship R": {
                                        "Comment R": {}
                                    }
                                }
                            }
                        },
                        "Snapshot R": {}
                    }
                },
                "Comment R": {},
                "Contract R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Control R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        },
                        "Proposal R": {}
                    }
                },
                "DataAsset R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Document R": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Facility R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Issue R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Market R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Metric R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Objective R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "OrgGroup R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Policy R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Process R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Product R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "ProductGroup R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Project R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Regulation R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Requirement R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Risk R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        },
                        "Proposal R": {}
                    }
                },
                "RiskAssessment R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Standard R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "System R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "TechnologyEnvironment R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Threat R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                },
                "Vendor R": {
                    "Relationship R": {
                        "Comment R": {},
                        "Document R": {
                            "Relationship R": {
                                "Comment R": {}
                            }
                        }
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document R": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Project": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Regulation": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Requirement": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Review": {
        "Reviewer": {}
    },
    "Risk": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Proposal RU": {}
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Proposal RU": {}
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                },
                "Proposal RU": {}
            }
        }
    },
    "Standard": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "System": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "TaskGroupTask": {
        "Task Assignees": {},
        "Task Secondary Assignees": {}
    },
    "TechnologyEnvironment": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Threat": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Vendor": {
        "Admin": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Assignee": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Compliance Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Legal Counsels": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Primary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Product Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Secondary Contacts": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "System Owners": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical / Program Managers": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Technical Leads": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        },
        "Verifier": {
            "Relationship R": {
                "Comment R": {},
                "Document RU": {
                    "Relationship R": {
                        "Comment R": {}
                    }
                }
            }
        }
    },
    "Workflow": {
        "Admin": {
            "Relationship RUD": {
                "Cycle RUD": {
                    "Relationship RUD": {
                        "CycleTaskGroup RUD": {
                            "Relationship RUD": {
                                "CycleTaskGroupObjectTask RUD": {
                                    "Relationship RUD": {
                                        "CycleTaskEntry RUD": {}
                                    }
                                }
                            }
                        }
                    }
                },
                "TaskGroup RUD": {
                    "Relationship RUD": {
                        "TaskGroupObject RUD": {},
                        "TaskGroupTask RUD": {}
                    }
                }
            }
        },
        "Workflow Member": {
            "Relationship R": {
                "Cycle R": {
                    "Relationship R": {
                        "CycleTaskGroup R": {
                            "Relationship R": {
                                "CycleTaskGroupObjectTask R": {
                                    "Relationship R": {
                                        "CycleTaskEntry R": {}
                                    }
                                }
                            }
                        }
                    }
                },
                "TaskGroup R": {
                    "Relationship R": {
                        "TaskGroupObject R": {},
                        "TaskGroupTask R": {}
                    }
                }
            }
        }
    }
}
