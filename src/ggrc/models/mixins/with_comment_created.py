# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Contains WithCommentCreated mixin."""

from ggrc import login
from ggrc.models import comment
from ggrc.models import relationship
from ggrc.models import revision


class WithCommentCreated(object):
  """Mixin for creating a comment on signals."""

  @staticmethod
  def clear_text(text):
    """Cleans leading and trailing paragraph tag."""
    txt = text or ""
    txt = txt.strip()
    if txt.startswith("<p>"):
      txt = txt[3:]
      if txt.endswith("</p>"):
        txt = txt[:-4]
    return txt.strip()

  @staticmethod
  def add_comment(comment_text, source, initiator_object=None):
    """Adds comment into the session.

      Args:
        comment_text: comment text.
        source: object to which comment will be attached via relationship.
        initiator_object: initiator of comment creation.
    """
    created_comment = comment.Comment(
        description=comment_text,
        modified_by_id=login.get_current_user_id(),
        initiator_instance=initiator_object,
    )
    relationship.Relationship(
        source=source,
        destination=created_comment
    )

  @staticmethod
  def apply_mentions_comment(event, obj):
    """Send people mentions in proposal comment.

      Args:
        event: event in which comment was added into session
        obj: object for which comment was created
    """
    if not event:
      return
    comment_revision = revision.Revision.query.filter(
        revision.Revision.resource_type == comment.Comment.__name__,
        revision.Revision.event_id == event.id,
    ).first()
    if not comment_revision:
      return
    comment_id = comment_revision.resource_id
    created_comment = comment.Comment.query.get(comment_id)

    from ggrc.notifications import people_mentions
    people_mentions.handle_comment_mapped(obj=obj, comments=[created_comment])
