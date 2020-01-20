# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
update propagation tree for program editor

Create Date: 2019-09-15 12:09:24.688154
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from ggrc.migrations.utils.acr_propagation import update_acr_propagation_tree

# revision identifiers, used by Alembic.
revision = '3141784ef298'
down_revision = '1290304b791b'


def generate_propagation_tree(propagation_tree):
  """Function generate new propagation tree without delete permissions."""
  new_propagation_tree = {}
  for i in propagation_tree:
    name_obj, permissions = i.split(' ')
    new_perm = permissions.replace('D', '')
    obj_with_perm = "{} {}".format(name_obj, new_perm)
    new_propagation_tree[obj_with_perm] = propagation_tree[i]
  return new_propagation_tree


CURRENT_PROGRAM_EDITOR_PERMISSIONS = {
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
    "AccountBalance RUD": {
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
            },
            "Review RU": {}
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
            "Proposal RU": {},
            "Review RU": {}
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
    "KeyReport RUD": {
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
            },
            "Review RU": {}
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
            },
            "Review RU": {}
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
    "Proposal R": {},
    "Regulation RUD": {
        "Relationship R": {
            "Comment R": {},
            "Document RU": {
                "Relationship R": {
                    "Comment R": {}
                }
            },
            "Review RU": {}
        }
    },
    "Requirement RUD": {
        "Relationship R": {
            "Comment R": {},
            "Document RU": {
                "Relationship R": {
                    "Comment R": {}
                }
            },
            "Review RU": {}
        }
    },
    "Review RU": {},
    "Risk RUD": {
        "Relationship R": {
            "Comment R": {},
            "Document RU": {
                "Relationship R": {
                    "Comment R": {}
                }
            },
            "Proposal RU": {},
            "Review RU": {}
        }
    },
    "Standard RUD": {
        "Relationship R": {
            "Comment R": {},
            "Document RU": {
                "Relationship R": {
                    "Comment R": {}
                }
            },
            "Review RU": {}
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
            },
            "Review RU": {}
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

NEW_PROGRAM_EDITOR_PERMISSIONS = generate_propagation_tree(
    CURRENT_PROGRAM_EDITOR_PERMISSIONS
)

CURRENT_RELATIONSHIP = {"Relationship R": CURRENT_PROGRAM_EDITOR_PERMISSIONS}
NEW_RELATIONSHIP = {"Relationship R": NEW_PROGRAM_EDITOR_PERMISSIONS}

CURRENT_PROGRAM_EDITORS = {"Program Editors": CURRENT_RELATIONSHIP}
NEW_PROGRAM_EDITORS = {"Program Editors": NEW_RELATIONSHIP}

NEW_PROGRAM_EDITOR_PROPAGATION = {
    "Program": NEW_PROGRAM_EDITORS
}

CURRENT_PROGRAM_EDITOR_PROPAGATION = {
    "Program": CURRENT_PROGRAM_EDITORS
}


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  update_acr_propagation_tree(
      CURRENT_PROGRAM_EDITOR_PROPAGATION,
      NEW_PROGRAM_EDITOR_PROPAGATION
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
