# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module containing Notifiable mixin.

The mixin is used primarily to create backrefs in Notification model.
"""

import sqlalchemy as sa
from sqlalchemy.ext.declarative import declared_attr


class Notifiable(object):
  """Notifiable mixin.

  Defines a backref in Notification model named like ModelName_notifiable.
  """
  # pylint: disable=too-few-public-methods

  @declared_attr
  def _notifications(cls):  # pylint: disable=no-self-argument
    """Relationship with notifications for cls."""
    from ggrc.models.notification import Notification

    current_type = cls.__name__

    joinstr = (
        "and_("
        "foreign(remote(Notification.object_id)) == {type}.id,"
        "Notification.object_type == '{type}'"
        ")"
        .format(type=current_type)
    )

    # Since we have some kind of generic relationship here, it is needed
    # to provide custom joinstr for backref. If default, all models having
    # this mixin will be queried, which in turn produce large number of
    # queries returning nothing and one query returning object.
    backref_joinstr = (
        "remote({type}.id) == foreign(Notification.object_id)"
        .format(type=current_type)
    )

    return sa.orm.relationship(
        Notification,
        primaryjoin=joinstr,
        backref=sa.orm.backref(
            "{}_notifiable".format(current_type),
            primaryjoin=backref_joinstr,
        ),
        cascade="all, delete-orphan",
    )
