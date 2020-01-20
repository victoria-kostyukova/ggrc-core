# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Contains `WithSOX302` mixin."""

from sqlalchemy import orm as sa_orm
from sqlalchemy.ext import declarative as sa_declarative

from ggrc import db
from ggrc.fulltext import attributes
from ggrc.models import reflection
from ggrc.models.mixins import customattributable
from ggrc.models.mixins import rest_handable
from ggrc.models.mixins import statusable


class WithSOX302Flow(rest_handable.WithPutBeforeCommitHandable):
  """Mixin which adds a support of SOX 302 flow."""

  @sa_declarative.declared_attr
  def sox_302_enabled(cls):  # pylint: disable=no-self-argument,no-self-use
    """Flag defining if SOX 302 flow is activated for object."""
    return db.Column(db.Boolean, nullable=False, default=False)

  _aliases = {
      "sox_302_enabled": {
          "display_name": "SOX 302 assessment workflow",
          "description": (
              "Allowed values are:\n"
              "YES (- Verification step will be skipped if only positive "
              "answers are given for the assessment. Specify negative answers "
              "at column 'Custom attributes'.\n"
              "- Assignees will have read only permissions upon "
              "assessment completion.)\n"
              "NO (Standard Assessment flow will be used)"
          ),
          "mandatory": False,
      }
  }

  _api_attrs = reflection.ApiAttributes(
      "sox_302_enabled",
  )

  _fulltext_attrs = [
      attributes.BooleanFullTextAttr(
          "sox_302_enabled",
          "sox_302_enabled",
          true_value="yes",
          false_value="no",
      ),
  ]

  @classmethod
  def indexed_query(cls):
    """Return DB query used for object indexing.

    Here `sox_302_enabled` is added to sqlalchemy query constructed during
    `super` call to allow indexing and thus search of objects by this field.
    """
    query = super(WithSOX302Flow, cls).indexed_query()
    return query.options(
        sa_orm.Load(cls).load_only(
            "sox_302_enabled",
        ),
    )

  def _has_negative_cavs(self):
    """Check if current object has any CAVs with values marked as negative."""
    from ggrc.models.custom_attribute_value \
        import CustomAttributeValue as cav_model

    local_cads = {
        # pylint: disable=access-member-before-definition,
        # pylint: disable=attribute-defined-outside-init
        cad.id: cad for cad in self.local_custom_attribute_definitions
    }

    local_cavs = []
    if local_cads:
      local_cavs = cav_model.query.filter(
          cav_model.custom_attribute_id.in_(local_cads.keys()),
      ).all()

    return any(
        local_cads[cav.custom_attribute_id].is_value_negative(cav)
        for cav in local_cavs
    )

  def exec_sox_302_status_flow(self, initial_state):
    # type: (collections.namedtuple) -> None
    """Execute SOX 302 status change flow.

    Perform SOX 302 status change flow for object method is called on. Current
    object should be instance of `statusable.Statusable` and should have flag
    `sox_302_enabled` set to `True` in order for SOX 302 to be executed.

    Args:
      initial_state (collections.namedtuple): Initial state of the object.
    """
    follow_sox_302_flow = (
        isinstance(self, statusable.Statusable) and
        isinstance(self, customattributable.CustomAttributable) and
        self.sox_302_enabled
    )

    # pylint: disable=access-member-before-definition,
    # pylint: disable=attribute-defined-outside-init
    moved_in_review = (
        initial_state.status != self.status and
        self.status == statusable.Statusable.DONE_STATE
    )

    if (
        follow_sox_302_flow and
        moved_in_review and
        not self._has_negative_cavs()
    ):
      self.status = statusable.Statusable.FINAL_STATE

  def handle_put_before_commit(self, initial_state):
    # type: (collections.namedtuple) -> None
    """Handle `model_put_before_commit` signals.

    This method is called after `model_put_before_commit` signal is being sent.
    Triggers SOX 302 status change flow.

    Args:
      initial_state (collections.namedtuple): Initial state of the object.
    """
    self.exec_sox_302_status_flow(initial_state)


class WithSOX302FlowReadOnly(WithSOX302Flow):
  """Mixin which adds support for SOX 302 flow. SOX flag is read only here."""

  _aliases = {
      "sox_302_enabled": {
          "display_name": "SOX 302 assessment workflow",
          "description": "Read only column and will be ignored on import.",
          "mandatory": False,
          "view_only": True,
      },
  }

  _api_attrs = reflection.ApiAttributes(
      reflection.Attribute('sox_302_enabled', create=False, update=False),
  )
