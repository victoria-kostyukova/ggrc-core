# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""This module contain functionality for moving Regulation and
Objective Snapshots to Assessment"""
import sqlalchemy as sa

import ggrc.app  # noqa pylint: disable=unused-import
from ggrc import db


def move_snapshots_to_asmnt(audit_id):
  """Move snapshots of Revision and Objective to Assessment"""
  # Run this query to prevent case when temp table wasn't removed
  # after last run
  # Enable creation of temp tables
  db.session.execute("SET AUTOCOMMIT = 1;")
  # Disable the "Table already exists" warning
  db.session.execute("SET sql_notes = 0;")
  db.session.execute("DROP TABLE IF EXISTS temp_control_snapshots;")
  # And then re-enable the warning again
  db.session.execute("SET sql_notes = 1;")
  db.session.execute("""
      CREATE TEMPORARY TABLE temp_control_snapshots (
        snapshot_id int(11),
        assessment_id int(11)
      );
  """)
  db.session.execute(sa.text("""
      INSERT INTO temp_control_snapshots(snapshot_id, assessment_id)
      SELECT snap_id, asmnt_id
      FROM (
        SELECT r.destination_id AS snap_id, r.source_id as asmnt_id
        FROM relationships r
        JOIN assessments a ON a.id = r.source_id
        JOIN snapshots s ON s.id = r.destination_id
        WHERE r.source_type = 'Assessment' AND
              r.destination_type = 'Snapshot' AND
              a.audit_id = :audit_id AND
              s.child_type = 'Control'
        UNION ALL
        SELECT r.source_id, r.destination_id
        FROM relationships r
        JOIN assessments a ON a.id = r.destination_id
        JOIN snapshots s ON s.id = r.source_id
        WHERE r.destination_type = 'Assessment' AND
              r.source_type = 'Snapshot' AND
              a.audit_id = :audit_id AND
              s.child_type = 'Control'
      ) tmp;
  """), {"audit_id": audit_id})

  asmnt_count = db.session.execute("""
      SELECT COUNT(DISTINCT assessment_id) FROM temp_control_snapshots;
  """).fetchone()[0]
  print "{} Assessments will be affected".format(asmnt_count)

  while True:
    user_input = raw_input(
        "Press 'Y' to continue, 'N' to cancel script execution: "
    )
    if user_input.lower() == "y":
      db.session.execute("""
          INSERT INTO relationships(
            created_at, updated_at, source_id, source_type,
            destination_id, destination_type
          )
          SELECT now(), now(), tcs.assessment_id, 'Assessment',
            tmp.mapped_id, 'Snapshot'
          FROM
          (
            SELECT r.source_id AS control_snap_id,
                   r.destination_id AS mapped_id
            FROM relationships r
            JOIN snapshots s ON s.id = r.destination_id
            WHERE r.source_type = 'Snapshot' AND
                r.destination_type = 'Snapshot' AND
                s.child_type IN ('Regulation', 'Objective')
            UNION
            SELECT r.destination_id, r.source_id
            FROM relationships r
            JOIN snapshots s ON s.id = r.source_id
            WHERE r.source_type = 'Snapshot' AND
                r.destination_type = 'Snapshot' AND
                s.child_type IN ('Regulation', 'Objective')
          ) tmp
          JOIN temp_control_snapshots tcs
            ON tcs.snapshot_id = tmp.control_snap_id
          LEFT JOIN relationships r1 ON
            r1.source_id = tcs.assessment_id AND
            r1.source_type = 'Assessment' AND
            r1.destination_id = tmp.mapped_id AND
            r1.destination_type = 'Snapshot'
          LEFT JOIN relationships r2 ON
            r2.destination_id = tcs.assessment_id AND
            r2.destination_type = 'Assessment' AND
            r2.source_id = tmp.mapped_id AND
            r2.source_type = 'Snapshot'
          WHERE r1.id IS NULL AND r2.id IS NULL
          GROUP BY tcs.assessment_id, tmp.mapped_id;
      """)
      db.session.execute("DROP TABLE IF EXISTS temp_control_snapshots;")
      db.session.execute("SET AUTOCOMMIT = 0;")

      print "Snapshots were migrated successfully for " \
            "Audit id {}".format(audit_id)
      return

    elif user_input.lower() == "n":
      db.session.execute("DROP TABLE IF EXISTS temp_control_snapshots;")
      db.session.execute("SET AUTOCOMMIT = 0;")
      print "Script execution was canceled"
      return
