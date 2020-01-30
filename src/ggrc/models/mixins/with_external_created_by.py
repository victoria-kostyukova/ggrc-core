# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

""" Module for WithExternalCreatedBy mixin."""

from sqlalchemy import orm
from sqlalchemy.ext.declarative import declared_attr

from ggrc import db
from ggrc import utils as ggrc_utils
from ggrc.models import reflection
from ggrc.models import utils


class WithExternalCreatedBy(object):
  """Mixin for external created_by_id attribute"""

  created_by_id = db.Column(db.Integer, nullable=False)

  _api_attrs = reflection.ApiAttributes(
      reflection.ExternalUserAttribute('created_by',
                                       force_create=True),
  )

  _custom_publish = {
      'created_by': ggrc_utils.created_by_stub,
  }

  _aliases = {
      "created_by": {
          "display_name": "Created By",
          "mandatory": False,
      },
  }

  # pylint: disable=no-self-argument
  @declared_attr
  def created_by(cls):
    """Relationship to user referenced by created_by_id."""
    return utils.person_relationship(cls.__name__, "created_by_id")

  def log_json(self):
    res = super(WithExternalCreatedBy, self).log_json()
    res["created_by"] = ggrc_utils.created_by_stub(self)
    return res

  @classmethod
  def eager_query(cls, **kwargs):
    query = super(WithExternalCreatedBy, cls).eager_query(**kwargs)
    return cls.eager_inclusions(query, cls._include_links).options(
        orm.joinedload('created_by'),
    )
