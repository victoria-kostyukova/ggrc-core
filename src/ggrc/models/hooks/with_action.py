# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Object with actions hooks."""

from ggrc.models import all_models, comment
from ggrc.models.mixins.base import ChangeTracked
from ggrc.models.mixins.with_action import WithAction
from ggrc.services import signals


def init_hook():  # noqa
  # pylint: disable=unused-variable

  """Initialize all hooks."""

  @signals.Restful.model_put_after_commit.connect_via(all_models.Assessment)
  def handle_assessment_put(_, obj, **kwargs):
    # pylint: disable=unused-argument
    """Handle Assessments with Comment mapping action"""
    from ggrc.notifications import people_mentions

    if not isinstance(obj, WithAction) or not isinstance(
        obj, (comment.Commentable, ChangeTracked)
    ):
      return

    actions = getattr(obj, '_actions')
    if not actions or 'add_related' not in actions:
      return

    saved_comments = list()
    for action in actions.get('add_related'):
      obj_type = action.get("type")
      obj_id = action.get("id")

      if obj_type != "Comment" or not obj_id:
        continue

      saved_comments.append(all_models.Comment.query.get(obj_id))

    people_mentions.handle_comment_mapped(obj=obj, comments=saved_comments)
