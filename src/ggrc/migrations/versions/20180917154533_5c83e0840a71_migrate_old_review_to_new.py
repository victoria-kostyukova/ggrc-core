# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Migrate old review to new

Create Date: 2018-09-17 15:45:33.712697
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

from alembic import op
from sqlalchemy import text
from ggrc.migrations import utils
from ggrc.migrations.utils.migrator import get_migration_user_id

revision = '5c83e0840a71'
down_revision = 'c56e3b1c14e5'

MIGRATED_REVIEWABLES = {
    ("controls", "Control"),
    ("directives", "Policy"),
    ("directives", "Standard"),
    ("directives", "Contract"),
    ("directives", "Regulation"),
    ("objectives", "Objective"),
    ("programs", "Program"),
    ("requirements", "Requirement"),
    ("risks", "Risk"),
    ("threats", "Threat")
}

NON_MIGRATED_REVIEWABLES = {
    ("access_groups", "AccessGroup"),
    ("data_assets", "DataAsset"),
    ("facilities", "Facilities"),
    ("issues", "Issue"),
    ("markets", "Market"),
    ("metrics", "Metric"),
    ("org_groups", "OrgGroup"),
    ("products", "Product"),
    ("product_groups", "ProductGroup"),
    ("projects", "Project"),
    ("systems", "System"),
    ("systems", "Process"),
    ("technology_environments", "TechnologyEnvironment"),
    ("vendors", "Vendor"),
}


def get_object_mapping_info(conn, table, obj_type, review_status):
  """Return data set contains all necessary data for migration"""
  sql = """
      SELECT
      r.source_type AS obj_type,
      c.id AS obj_id,
      c.updated_at AS reviewed_at,
      c.modified_by_id AS reviewer_id,
      r.id AS rel_id,
      r.destination_id as ctgot_id,
      ctgot.status as ctgot_status,
      cy.id AS cycle_id,
      cy.status AS cycle_status,
      ctg.id AS ctg_id,
      ctg.status AS ctg_status,
      w.id AS workflof_id,
      w.status AS workflof_status
      FROM {table} c
          JOIN relationships r on r.source_id=c.id AND
            r.source_type="{obj_type}" AND
            r.destination_type="CycleTaskGroupObjectTask"
          JOIN cycle_task_group_object_tasks ctgot ON
            ctgot.id = r.destination_id AND
            ctgot.title like 'Object review for%'
          JOIN cycles cy ON cy.id = ctgot.cycle_id
          JOIN workflows w ON w.id = cy.workflow_id
          JOIN cycle_task_groups ctg ON cy.id = ctg.cycle_id
        WHERE c.os_state="{review_status}"
    UNION ALL
    SELECT
      r.destination_type AS obj_type,
      c.id AS obj_id,
      c.updated_at AS reviewed_at,
      c.modified_by_id AS reviewer_id,
      r.id AS rel_id,
      r.source_id AS ctgot_id,
      ctgot.status as ctgot_status,
      cy.id AS cycle_id,
      cy.status AS cycle_status,
      ctg.id AS ctg_id,
      ctg.status AS ctg_status,
      w.id AS workflof_id,
      w.status AS workflof_status
      FROM {table} c
        JOIN relationships r on r.destination_id=c.id AND
          r.destination_type="{obj_type}" AND
          r.source_type="CycleTaskGroupObjectTask"
        JOIN cycle_task_group_object_tasks ctgot ON
          ctgot.id = r.source_id AND
          ctgot.title like 'Object review for%'
        JOIN cycles cy ON cy.id = ctgot.cycle_id
        JOIN workflows w ON w.id = cy.workflow_id
        JOIN cycle_task_groups ctg ON cy.id = ctg.cycle_id
      where c.os_state="{review_status}"
  """.format(
      table=table, obj_type=obj_type, review_status=review_status
  )
  return conn.execute(text(sql))


# pylint: disable=too-many-arguments
def create_review(conn, obj_id, obj_type, reviewer_id,
                  last_reviewed_at, migrator_id):
  """Create review record in DB"""
  sql = """
    INSERT INTO reviews(
        reviewable_id,
        reviewable_type,
        notification_type,
        last_reviewed_by_id,
        last_reviewed_at,
        status,
        updated_at,
        modified_by_id,
        created_by_id,
        created_at
    ) VALUES (
        :obj_id, :obj_type, 'email', :reviewer_id, :last_reviewed_at,
        'Reviewed', NOW(), :migrator_id, :migrator_id, NOW()
      )
  """
  conn.execute(
      text(sql),
      obj_id=obj_id,
      obj_type=obj_type,
      reviewer_id=reviewer_id,
      last_reviewed_at=last_reviewed_at,
      migrator_id=migrator_id
  )
  review_id = utils.last_insert_id(conn)
  utils.add_to_objects_without_revisions(conn, obj_id, obj_type)
  return review_id


def map_review(conn, migrator_id, obj_id, obj_type, review_id):
  """Add relationship between review and reviewable"""
  sql = """
  INSERT INTO relationships (
    modified_by_id,
    created_at,
    updated_at,
    source_id,
    source_type,
    destination_id,
    destination_type,
    is_external
  ) VALUES (
    :migrator_id, NOW(), NOW(), :obj_id, :obj_type, :review_id, 'Review', '0')
  """
  conn.execute(
      text(sql),
      migrator_id=migrator_id,
      obj_id=obj_id,
      obj_type=obj_type,
      review_id=review_id
  )
  relationship_id = utils.last_insert_id(conn)
  utils.add_to_objects_without_revisions(conn, relationship_id, "Relationship")
  return relationship_id


def assign_reviewer(conn, reviewer_id, reviewer_acr_id,
                    review_id, migrator_id):
  """Add reviewer acl for given review"""
  sql = """
  INSERT INTO access_control_list (
    person_id,
    ac_role_id,
    object_id,
    object_type,
    created_at,
    modified_by_id,
    updated_at,
    parent_id_nn
  ) VALUES (
    :reviewer_id, :reviewer_acr_id, :review_id, 'Review', NOW(), :migrator_id,
    NOW(), '0'
  )
  """
  conn.execute(
      text(sql),
      reviewer_id=reviewer_id,
      reviewer_acr_id=reviewer_acr_id,
      review_id=review_id,
      migrator_id=migrator_id
  )
  acl_id = utils.last_insert_id(conn)
  utils.add_to_objects_without_revisions(conn, acl_id, "AccessControlList")


def get_reviewer_acr_id(conn):
  """Get reviewer acr id"""
  sql = """
      SELECT id FROM access_control_roles WHERE
        name="Reviewer" AND object_type="Review"
    """
  return conn.execute(text(sql)).fetchone().id


def unmap_cycle_task_group_object_task(conn, rel_id):
  """Delete relationship between reviewable and cycle_task_group_object_task"""
  sql = "DELETE from relationships WHERE id=:rel_id"
  conn.execute(text(sql), rel_id=rel_id)
  utils.add_to_objects_without_revisions(
      conn, rel_id, "Relationship", "deleted"
  )


def update_cycle_task_group_object_task(conn, ctgot_id, ctgot_status,
                                        migrator_id):
  """Set status of cycle_task_group_object_task Verified"""
  if ctgot_status != "Verified":
    sql = """
      UPDATE cycle_task_group_object_tasks SET
        status='Verified',
        finished_date=NOW(),
        verified_date=NOW(),
        modified_by_id=:migrator_id,
        updated_at=NOW()
      WHERE id=:ctgot_id
    """
    conn.execute(text(sql), ctgot_id=ctgot_id, migrator_id=migrator_id)
    utils.add_to_objects_without_revisions(
        conn, ctgot_id, "CycleTaskGroupObjectTask", "modified"
    )


def update_cycle(conn, cycle_id, cycle_status, migrator_id):
  """Set status of cycle Verified"""
  if cycle_status != "Verified":
    sql = """
      UPDATE cycles SET
        status='Verified',
        modified_by_id=:migrator_id,
        updated_at=NOW(),
        is_current='0'
      WHERE id=:cycle_id
    """
    conn.execute(text(sql), cycle_id=cycle_id, migrator_id=migrator_id)
    utils.add_to_objects_without_revisions(conn, cycle_id, "Cycle", "modified")


def update_cycle_task_groups(conn, ctg_id, ctg_status, migrator_id):
  """Set status of cycle_task_group Verified"""
  if ctg_status != "Verified":
    sql = """
      UPDATE cycle_task_groups SET
        status='Verified',
        modified_by_id=:migrator_id,
        updated_at=NOW()
      WHERE id=:ctg_id
    """
    conn.execute(text(sql), ctg_id=ctg_id, migrator_id=migrator_id)
    utils.add_to_objects_without_revisions(
        conn, ctg_id, "CycleTaskGroup", "modified"
    )


def update_workflow(conn, workflof_id, workflof_status, migrator_id):
  """Set status of workflow Inactive"""
  if workflof_status != "Inactive":
    sql = """
      UPDATE workflows SET
        modified_by_id=:migrator_id,
        updated_at=NOW(),
        status='Inactive'
      WHERE id=:workflof_id
    """
    conn.execute(text(sql), workflof_id=workflof_id, migrator_id=migrator_id)


def process_migrated_reviewed(conn, migrator_id, reviewer_acr_id):
  """Process objects that had Reviewed state and migrated"""
  for reviewable, obj_type in MIGRATED_REVIEWABLES:
    print "Processing -> {}: {}".format(obj_type, "Reviewed")
    reviews_reviewable_ids = set()
    for data in get_object_mapping_info(conn, reviewable,
                                        obj_type, "Reviewed"):
      if data.obj_id not in reviews_reviewable_ids and data.reviewer_id:
        review_id = create_review(
            conn, data.obj_id, data.obj_type, data.reviewer_id,
            data.reviewed_at, migrator_id
        )
        map_review(conn, migrator_id, data.obj_id, data.obj_type, review_id)
        assign_reviewer(
            conn, data.reviewer_id, reviewer_acr_id, review_id, migrator_id
        )
        reviews_reviewable_ids.add(data.obj_id)

      unmap_cycle_task_group_object_task(conn, data.rel_id)
      update_cycle_task_group_object_task(
          conn, data.ctgot_id, data.ctgot_status, migrator_id
      )
      update_cycle(conn, data.cycle_id, data.cycle_status, migrator_id)
      update_cycle_task_groups(conn, data.ctg_id, data.ctg_status, migrator_id)
      update_workflow(
          conn, data.workflof_id, data.workflof_status, migrator_id
      )


def process_migrated_unreviewed(conn, migrator_id):
  """Process objects that had Unreviewed state and migrated"""
  for reviewable, obj_type in MIGRATED_REVIEWABLES:
    print "Processing -> {} : {}".format(obj_type, "Unreviewed")
    for data in get_object_mapping_info(
        conn, reviewable, obj_type, "Unreviewed"
    ):
      unmap_cycle_task_group_object_task(conn, data.rel_id)
      update_cycle_task_group_object_task(
          conn, data.ctgot_id, data.ctgot_status, migrator_id
      )
      update_cycle(conn, data.cycle_id, data.cycle_status, migrator_id)
      update_cycle_task_groups(conn, data.ctg_id, data.ctg_status, migrator_id)
      update_workflow(
          conn, data.workflof_id, data.workflof_status, migrator_id
      )


def process_non_migrated(conn, migrator_id, state):
  """Process objects that had state and not migrated"""
  for reviewable, obj_type in NON_MIGRATED_REVIEWABLES:
    print "Processing -> {} : {}".format(obj_type, state)
    for data in get_object_mapping_info(conn, reviewable,
                                        obj_type, state):
      unmap_cycle_task_group_object_task(conn, data.rel_id)
      update_cycle_task_group_object_task(
          conn, data.ctgot_id, data.ctgot_status, migrator_id
      )
      update_cycle(conn, data.cycle_id, data.cycle_status, migrator_id)
      update_cycle_task_groups(conn, data.ctg_id, data.ctg_status, migrator_id)
      update_workflow(
          conn, data.workflof_id, data.workflof_status, migrator_id
      )


def process_non_migrated_reviewed(conn, migrator_id):
  """Process objects that had Reviewed state and not migrated"""
  process_non_migrated(conn, migrator_id, "Reviewed")


def process_non_migrated_unreviewed(conn, migrator_id):
  """Process objects that had Unreviewed state and not migrated"""
  process_non_migrated(conn, migrator_id, "Unreviewed")


def run_migration():
  """Migration runner"""
  conn = op.get_bind()
  migrator_id = get_migration_user_id(conn)
  reviewer_acr_id = get_reviewer_acr_id(conn)
  process_migrated_reviewed(conn, migrator_id, reviewer_acr_id)
  process_migrated_unreviewed(conn, migrator_id)
  process_non_migrated_unreviewed(conn, migrator_id)
  process_non_migrated_reviewed(conn, migrator_id)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  run_migration()


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
