# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""A module with Access Control Role object creation hooks.

The hooks in this file ensure that all objects get their proper access control
list entries for the new access control role.

Since we have started creating ACL entries eagerly on object creation, we
always assume that every object will have all it's ACL entries created. But
when we create a new role for a given object type, those ACL entries are
missing and so we create them manually.

Note:
  - This hook creates a big performance degradation on creating a new custom
    role. This is expected and preferable over the lazy creation of ACLs which
    would reduce performance on assigning or removing people from a role.

  - This hook also makes it impossible for us to create a new role and assign
    people to it in the same request! People can only be assigned to a role
    that already existed before the request was sent. Adding a person to a
    new role must now be done in separate requests.
"""

from ggrc import db
from ggrc import utils
from ggrc.models import all_models
from ggrc.models import inflector
from ggrc.services import signals


def init_hook():
  """Initialize all hooks"""

  # pylint: disable=unused-variable
  @signals.Restful.model_posted_after_commit.connect_via(
      all_models.AccessControlRole)
  def handle_role_posted(sender, obj=None, src=None, service=None, event=None):
    """Handle ACL entries creation for newly created access control role."""
    role_model = inflector.get_model(obj.object_type)
    for query_chunk in utils.generate_query_chunks(role_model.query):
      for roleable_obj in query_chunk:
        all_models.AccessControlList(
            ac_role=obj,
            object=roleable_obj,
        )
      db.session.commit()
