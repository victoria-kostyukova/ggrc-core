# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Fix NULL resource slugs in revisions.

Create Date: 2019-09-02 11:58:15.663744
"""
# disable Invalid constant name pylint warning for mandatory Alembic variables.
# pylint: disable=invalid-name

import json
import logging

from alembic import op
import sqlalchemy as sa

from ggrc.models import all_models
from ggrc.models import mixins


# revision identifiers, used by Alembic.
revision = "7542f6d44eaa"
down_revision = "10b40b26d571"


logger = logging.getLogger(__name__)


def gather_slugged_models():
  """Gather models that have `slug` column."""
  return [
      model for model in all_models.all_models
      if issubclass(model, mixins.Slugged)
  ]


def get_objs_with_broken_revisions(slugged_model, connection):
  """Get resource (ID, slug) pairs from broken revisions of specific type."""
  sql = """
      SELECT rev.id, rev.resource_id, rev.content
        FROM revisions AS rev
       WHERE rev.resource_type = '{slugged_type}'
         AND rev.resource_slug IS NULL;
  """.format(
      slugged_type=slugged_model.__name__,
  )

  resource_id_slug_map = {}
  fail_to_fix_revisions = []
  query_result = connection.execute(sa.text(sql)).fetchall()
  for revision_id, resource_id, content, in query_result:
    content = json.loads(content)
    resource_slug = content.get("slug")
    if not resource_slug:
      fail_to_fix_revisions.append(revision_id)
    else:
      resource_id_slug_map[resource_id] = resource_slug

  if fail_to_fix_revisions:
    logger.warning(
        "Failed to fix following revisions - no slug in content. %s",
        fail_to_fix_revisions,
    )

  return resource_id_slug_map


def update_resource_slug_value(slugged_model, id_slug_map, connection):
  """Set `resource_slug` to right value for `slugged_model`'s revisions."""
  logger.info(
      "Fixing %s revisions. %s revisions will be affected.",
      slugged_model.__name__,
      len(id_slug_map),
  )

  sql = """
      UPDATE revisions AS rev
         SET rev.resource_slug = :resource_slug
       WHERE rev.resource_type = '{slugged_type}'
         AND rev.resource_id = {slugged_id};
  """
  for obj_id, obj_slug in id_slug_map.iteritems():
    query = sa.text(
        sql.format(slugged_type=slugged_model.__name__, slugged_id=obj_id)
    )
    connection.execute(query, resource_slug=obj_slug)


def fix_null_resource_slug_in_revs(connection):
  """Set correct `resource_slug` for slugged objects if it is `NULL`."""
  for model in gather_slugged_models():
    id_slug_map = get_objs_with_broken_revisions(model, connection)
    update_resource_slug_value(model, id_slug_map, connection)


def upgrade():
  """Upgrade database schema and/or data, creating a new revision."""
  connection = op.get_bind()
  fix_null_resource_slug_in_revs(
      connection,
  )


def downgrade():
  """Downgrade database schema and/or data back to the previous revision."""
  raise NotImplementedError("Downgrade is not supported")
