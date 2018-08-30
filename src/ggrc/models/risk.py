# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module for risk model."""

from sqlalchemy.ext.declarative import declared_attr

from ggrc import db
from ggrc.access_control.roleable import Roleable
from ggrc.fulltext.mixin import Indexed
from ggrc.models import mixins
from ggrc.models import proposal
from ggrc.models.comment import Commentable
from ggrc.models.deferred import deferred
from ggrc.models.object_document import PublicDocumentable
from ggrc.models.object_person import Personable
from ggrc.models.relationship import Relatable
from ggrc.models.track_object_state import HasObjectState


class Risk(Roleable,
           HasObjectState,
           mixins.CustomAttributable,
           Relatable,
           Personable,
           PublicDocumentable,
           Commentable,
           mixins.TestPlanned,
           mixins.LastDeprecatedTimeboxed,
           mixins.base.ContextRBAC,
           mixins.BusinessObject,
           proposal.Proposalable,
           mixins.Folderable,
           Indexed,
           db.Model):
  """Basic Risk model."""
  __tablename__ = 'risks'

  # Overriding mixin to make mandatory
  @declared_attr
  def description(cls):  # pylint: disable=no-self-argument
    return deferred(db.Column(db.Text, nullable=False, default=u""),
                    cls.__name__)

  _aliases = {
      "description": {
          "display_name": "Description",
          "mandatory": True
      },
      "documents_file": None,
      "status": {
          "display_name": "State",
          "mandatory": False,
          "description": "Options are: \n {}".format('\n'.join(
              mixins.BusinessObject.VALID_STATES))
      }
  }
