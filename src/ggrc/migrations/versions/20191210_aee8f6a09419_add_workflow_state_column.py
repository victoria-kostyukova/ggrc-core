# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Add workflow_state column

Create Date: 2019-12-10 21:08:02.307155
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name


import collections
import logging

from alembic import op
import sqlalchemy as sa

from ggrc.migrations import utils

# revision identifiers, used by Alembic.
revision = 'aee8f6a09419'
down_revision = '14891a489a2d'


OVERDUE = "Overdue"
VERIFIED = "Verified"
FINISHED = "Finished"
ASSIGNED = "Assigned"
IN_PROGRESS = "In Progress"
UNKNOWN_STATE = None


CTGOTS_OBJ_QUERY = """
    SELECT
      r.destination_id as obj_id,
      c.id as c_id,
      c.status as c_stat
    FROM cycle_task_group_object_tasks AS c
    JOIN relationships AS r
    ON r.source_type = "CycleTaskGroupObjectTask" AND r.source_id = c.id
      AND r.destination_type = :object_type
    JOIN cycles as cyc
    ON cyc.id = c.cycle_id
      WHERE cyc.is_current=1
    UNION
    SELECT
      r.source_id as obj_id,
      c.id as c_id,
      c.status as c_stat
    FROM cycle_task_group_object_tasks AS c
    JOIN relationships AS r
    ON r.destination_type = "CycleTaskGroupObjectTask"
      AND r.destination_id = c.id
      AND r.source_type = :object_type
    JOIN cycles as cyc
    ON cyc.id = c.cycle_id
      WHERE cyc.is_current=1
"""


CTGOTS_WF_QUERY = """
    SELECT
      cyc.workflow_id as obj_id,
      c.id as c_id,
      c.status as c_stat
    FROM cycle_task_group_object_tasks AS c
    JOIN cycles AS cyc
    ON cyc.id = c.cycle_id
      WHERE cyc.is_current=1
"""


TYPE_TABLE_MAP = {
    "AccessGroup": "access_groups",
    "AccountBalance": "account_balances",
    "Assessment": "assessments",
    "Control": "controls",
    "DataAsset": "data_assets",
    "Policy": "directives",
    "Regulation": "directives",
    "Standard": "directives",
    "Contract": "directives",
    "Facility": "facilities",
    "Issue": "issues",
    "KeyReport": "key_reports",
    "Market": "markets",
    "Metric": "metrics",
    "Objective": "objectives",
    "OrgGroup": "org_groups",
    "Product": "products",
    "ProductGroup": "product_groups",
    "Program": "programs",
    "Project": "projects",
    "Requirement": "requirements",
    "Risk": "risks",
    "System": "systems",
    "TechnologyEnvironment": "technology_environments",
    "Threat": "threats",
    "Vendor": "vendors",
    "Workflow": "workflows",
}


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def fetch_ctgots_for(connection, type_):
  """Fetch CycleTaskGroupObject tasks related to object type.

  Args:
    connection (sqlalchemy.engine.base.Connection): A DB connection object.
    type_ (str): An object type name.

  Returns:
    A mapping of object id to a set of (ctgot.id, ctgot.status) tuples.
  """
  obj_ctgots = collections.defaultdict(set)
  query = CTGOTS_WF_QUERY if type_ == "Workflow" else CTGOTS_OBJ_QUERY
  ctgots = connection.execute(sa.text(query), object_type=type_)

  for line in ctgots:
    obj_ctgots[line.obj_id].add((line.c_id, line.c_stat))

  return obj_ctgots


def alter_table(connection, table_name):
  """Add 'workflow_state' column to the table.

  Args:
    connection (sqlalchemy.engine.base.Connection): A DB connection object.
    table_name (str): db table name.
  """
  sql = """
      ALTER TABLE `{}`
      ADD `workflow_state` ENUM(
          'Overdue',
          'Verified',
          'Finished',
          'Assigned',
          'In Progress'
      )
  """
  connection.execute(sql.format(table_name))


def get_object_state(states):
  """Calculate workflow_state for object.

  Args:
    states (set): A set with CycleTaskGroupObjectTasks statuses to which this
      object is mapped.
  """
  states = {i or ASSIGNED for i in states}
  if OVERDUE in states:
    return OVERDUE
  if states in [{VERIFIED}, {FINISHED}, {ASSIGNED}]:
    return states.pop()
  if states == {FINISHED, VERIFIED}:
    return FINISHED
  return IN_PROGRESS if states else UNKNOWN_STATE


def update_wf_state(connection, table_name, _id, wf_state):
  """Update workflow_state value.

  Args:
    connection (sqlalchemy.engine.base.Connection): A DB connection object.
    table_name (str): A DB table name.
    _id (int): An object ID.
    wf_state (str): A calculated 'workflow_state' value.
  """
  sql = """
      UPDATE `{table_name}`
      SET `workflow_state`="{wf_state}"
      WHERE `id`={id}
  """
  connection.execute(
      sql.format(table_name=table_name, id=_id, wf_state=wf_state))


def populate_wf_state(connection):
  """Populate 'workflow_state' column for objects."""
  obj_for_revs = collections.defaultdict(list)

  for type_, table in TYPE_TABLE_MAP.iteritems():
    obj_ctgots = fetch_ctgots_for(connection, type_)

    for obj_id in obj_ctgots:
      wf_state = get_object_state({state for _, state in obj_ctgots[obj_id]})
      if wf_state:
        update_wf_state(connection, table, obj_id, wf_state)
        obj_for_revs[type_].append(obj_id)

    if obj_for_revs[type_]:
      logger.info("Workflow State was calculated for %s %s objects.",
                  len(obj_for_revs[type_]), type_)

  return obj_for_revs


def add_to_objs_without_revs(objs):
  """Add to objects without revisions.

  Args:
    objs (dict): A dict with object type as key and list of ids as value.
  """
  for type_ in objs:
    utils.add_to_objects_without_revisions_bulk(
        op.get_bind(), objs[type_], type_, "modified"
    )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  for table in set(TYPE_TABLE_MAP.values()):
    alter_table(connection, table)
  objs = populate_wf_state(connection)
  add_to_objs_without_revs(objs)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
