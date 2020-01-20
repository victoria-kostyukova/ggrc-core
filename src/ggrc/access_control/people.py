# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Access Control People model"""

from ggrc import db
from ggrc.models import mixins
from ggrc.models import reflection


class AccessControlPerson(mixins.Base, db.Model):
  """Access Control People

  Model is a mapping between a role a person and an object. It gives the
  permission of the role to the person from that object.
  """
  __tablename__ = 'access_control_people'
  _api_attrs = reflection.ApiAttributes()

  person_id = db.Column(
      db.Integer,
      db.ForeignKey('people.id'),
      nullable=False,
  )

  ac_list_id = db.Column(
      db.Integer,
      db.ForeignKey('access_control_list.id'),
      nullable=False,
  )
