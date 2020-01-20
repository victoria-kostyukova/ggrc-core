# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Methods that uses in proposal tests"""

from ggrc.models import all_models


def _get_query_proposal_request(program_id):
  """Prepare dict with proposal creation request"""

  return [{"limit": [0, 5],
           "object_name": all_models.Proposal.__name__,
           "order_by": [{"name": "status", "desc": True},
                        {"name": "created_at", "desc": True}, ],
           "filters": {
               "expression": {
                   "left": {"left": "instance_type",
                            "op": {"name": "="},
                            "right": all_models.Program.__name__, },
                   "op": {"name": "AND"},
                   "right": {
                       "left": "instance_id",
                       "op": {"name": "="},
                       "right": program_id,
                   },
               }},
           }
          ]
