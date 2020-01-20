# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Remove mirrored external revisions

Create Date: 2019-05-30 12:56:41.994346
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import logging

import sqlalchemy as sa

from alembic import op


# revision identifiers, used by Alembic.
revision = '0dbe123e4118'
down_revision = '6d7a0c2baba1'

logger = logging.getLogger(__name__)


def _get_revs_and_events_to_delete(connection, rel_id):
  """Get a list of event and revisions IDs which can be removed

  We can remove all revisions associated with the relationship.
  It is safe to remove event only if event contains only one revision

  :return list_of_revs, list_of_events
  """

  # Find revisions and corresponding events for relationship
  revs_and_events = list(connection.execute(
      sa.text(
          """
          SELECT
              rev.id AS revid,
              e.id AS eid
          FROM
              revisions rev
                  JOIN
              events e ON rev.event_id = e.id
          WHERE
              rev.resource_type = 'Relationship'
                  AND rev.resource_id = :rel_id
          """
      ),
      rel_id=rel_id
  ))

  rev_ids = list(item.revid for item in revs_and_events)
  event_ids = list(item.eid for item in revs_and_events)

  # Get events where the number of associated revisions = 1
  events_with_multiple_revs = list(connection.execute(
      sa.text(
          """
          SELECT
              e.id AS eid
          FROM
              events e
                  JOIN
              revisions rev ON rev.event_id = e.id
          WHERE
              e.id IN :ids
          GROUP BY e.id
          HAVING COUNT(rev.id) = 1
          """
      ),
      ids=list(int(i) for i in event_ids)
  ))

  del_event_ids = list(i.eid for i in events_with_multiple_revs)
  return rev_ids, del_event_ids


def _delete_records(connection, table_name, ids):
  """Delete records from table"""

  if not ids:
    logging.warning("[rev:%s] No %s will be removed", revision, table_name)
    return

  logging.warning(
      "[rev:%s] Deleting %s (total %s): %s", revision, table_name, len(ids),
      ' '.join(str(i) for i in sorted(ids))
  )

  connection.execute(
      sa.text("DELETE FROM {} WHERE id IN :ids".format(table_name)),
      ids=list(int(i) for i in ids)
  )


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""

  connection = op.get_bind()

  # Get tuples (newer-id, older-id) of mirrored relationships created
  # by external user. It's not safe to remove relationships created by
  # regular GGRC users, because these relationship might be referenced
  # by snapshots or other objects.
  items = list(connection.execute(
      sa.text(
          """
          SELECT
              r1.id AS dup, r2.id AS orig
          FROM
              relationships r1
                  JOIN
              relationships r2 ON r1.source_type = r2.destination_type
                  AND r1.source_id = r2.destination_id
                  AND r2.source_type = r1.destination_type
                  AND r2.source_id = r1.destination_id
                  AND r1.id != r2.id
                  RIGHT JOIN
              revisions rev ON rev.resource_type = 'Relationship'
                  AND rev.resource_id = r1.id
                  LEFT JOIN
              events e ON e.id = rev.event_id
          WHERE
              r1.id > r2.id AND r1.is_external = 1
                  AND r2.is_external = 1
                  AND (r1.source_type = 'ExternalComment'
                  OR r1.destination_type = 'ExternalComment')
          ORDER BY r1.id
          """
      )
  ))

  if not items:
    logging.warning("[rev:%s] No mirrored external relationships found",
                    revision)
    return

  del_rels = set()
  del_revs = set()
  del_events = set()
  print_items = list()

  for new_id, old_id in items:
    rev_ids, evt_ids = _get_revs_and_events_to_delete(connection, new_id)

    print_revs = ', '.join(str(i) for i in rev_ids) if rev_ids else '<empty>'
    print_evts = ', '.join(str(i) for i in evt_ids) if evt_ids else '<empty>'
    print_items.append((new_id, old_id, print_revs, print_evts))

    del_rels.add(new_id)
    del_revs.update(rev_ids)
    del_events.update(evt_ids)

  logging.warning(
      "[rev:%s] Mirrored external relationships (total %s) to delete:\n"
      "%s",
      revision,
      len(items),
      '\n'.join('{} (orig rel={}); del revs: {}; del evts: {}'.format(*item)
                for item in print_items)
  )

  _delete_records(connection, 'revisions', del_revs)
  _delete_records(connection, 'events', del_events)
  _delete_records(connection, 'relationships', del_rels)


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
