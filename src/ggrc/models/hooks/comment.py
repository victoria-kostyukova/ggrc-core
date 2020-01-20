# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""A module with Comment object creation hooks"""

from ggrc import db
from ggrc import login
from ggrc.models import all_models
from ggrc.models import relationship
from ggrc.services import signals

from blinker import ANY


def init_hook():
  """Initialize all hooks"""
  # pylint: disable=unused-variable
  @signals.Restful.collection_posted.connect_via(all_models.Comment)
  def handle_comment_post(mapper, objects, **kwargs):
    """Save information on which user created the Comment object.

    Comments have their users set in a hook, because we must ensure that it is
    always set to the current user, and that is why the info is not sent from
    the front-end through access_control_list property.
    """
    # pylint: disable=unused-argument
    user = login.get_current_user()
    for comment in objects:
      comment.add_person_with_role_name(user, "Admin")

  @signals.Restful.model_deleted.connect_via(sender=ANY)
  def handle_del_comment_mapping(sender, obj=None, **kwargs):
    # pylint: disable=unused-argument
    """Handle delete of commentable objects. """

    if not issubclass(sender, relationship.Relatable):
      return
    if isinstance(obj.related_objects, list):
      comments = [rel_obj for rel_obj in obj.related_objects
                  if isinstance(rel_obj, all_models.Comment)]
    else:
      comments = obj.related_objects(_types={all_models.Comment.__name__})
    for comment in comments:
      db.session.delete(comment)
