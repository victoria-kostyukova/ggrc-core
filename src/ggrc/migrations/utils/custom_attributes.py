# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Helper functions to create custom attributes for readonly objects"""
import sqlalchemy as sa

from ggrc.migrations import utils
from ggrc.migrations.utils import migrator


# pylint: disable=too-many-arguments
def create_custom_attribute(conn, name, attribute_type, for_object,
                            helptext=None, placeholder=None,
                            is_mandatory=False):
  """ Create custom attribute for given object."""

  migrator_id = migrator.get_migration_user_id(conn)
  conn.execute(
      sa.text("""
          INSERT INTO custom_attribute_definitions(
              modified_by_id, created_at, updated_at,
              title, helptext, placeholder,
              definition_type, attribute_type, mandatory
          )
          VALUES(
              :modified_by_id, NOW(), NOW(),
              :title, :helptext, :placeholder,
              :definition_type, :attribute_type, :mandatory
          );
      """),
      modified_by_id=migrator_id,
      title=name,
      helptext=helptext,
      placeholder=placeholder,
      definition_type=for_object,
      attribute_type=attribute_type,
      mandatory=is_mandatory
  )
  cad_id = utils.last_insert_id(conn)
  utils.add_to_objects_without_revisions(
      conn, cad_id, "CustomAttributeDefinition"
  )
