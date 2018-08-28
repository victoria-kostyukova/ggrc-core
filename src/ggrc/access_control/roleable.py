# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Roleable model"""
from collections import defaultdict
from sqlalchemy import and_
from sqlalchemy import orm
from sqlalchemy.orm import remote
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.ext.hybrid import hybrid_property

from ggrc import db
from ggrc.access_control.list import AccessControlList
from ggrc.fulltext.attributes import CustomRoleAttr
from ggrc.models import reflection


class Roleable(object):
  """Roleable Mixin

  Mixin that adds access_control_list property to the parent object. Access
  control list includes a list of AccessControlList objects.
  """

  _update_raw = _include_links = ['access_control_list', ]
  _fulltext_attrs = [CustomRoleAttr('access_control_list'), ]
  _api_attrs = reflection.ApiAttributes(
      reflection.Attribute('access_control_list', True, True, True))
  MAX_ASSIGNEE_NUM = 1
  MAX_VERIFIER_NUM = 1

  @declared_attr
  def _access_control_list(cls):  # pylint: disable=no-self-argument
    """access_control_list"""
    return db.relationship(
        'AccessControlList',
        primaryjoin=lambda: and_(
            remote(AccessControlList.object_id) == cls.id,
            remote(AccessControlList.object_type) == cls.__name__,
            remote(AccessControlList.parent_id_nn) == 0
        ),
        foreign_keys='AccessControlList.object_id',
        backref='{0}_object'.format(cls.__name__),
        cascade='all, delete-orphan')

  @hybrid_property
  def access_control_list(self):
    return self._access_control_list

  @access_control_list.setter
  def access_control_list(self, values):
    """Setter function for access control list.

    Args:
        values: List of access control roles or dicts containing json
        representation of custom attribute values.
    """
    pass

  def extend_access_control_list(self, values):
    """Extend access control list.

    Args:
        values: List of access control roles or dicts containing json
        representation of custom attribute values.
    """
    pass

  @classmethod
  def eager_query(cls):
    """Eager Query"""
    query = super(Roleable, cls).eager_query()
    return cls.eager_inclusions(
        query,
        Roleable._include_links
    ).options(
        orm.subqueryload(
            '_access_control_list'
        ).joinedload(
            "ac_role"
        ).undefer_group(
            'AccessControlRole_complete'
        ),
    )

  @classmethod
  def indexed_query(cls):
    """Query used by the indexer"""
    query = super(Roleable, cls).indexed_query()
    return query.options(
        orm.subqueryload(
            '_access_control_list'
        ).joinedload(
            "ac_role"
        ).load_only(
            "id", "name", "object_type", "internal"
        ),
    )

  def log_json(self):
    """Log custom attribute values."""
    # pylint: disable=not-an-iterable
    res = super(Roleable, self).log_json()
    res["access_control_list"] = [
        value.log_json() for value in self.access_control_list]
    return res

  def get_persons_for_rolename(self, role_name):
    """Return list of persons that are valid for send role_name."""
    return []

  def get_person_ids_for_rolename(self, role_name):
    """Return list of persons that are valid for send role_name."""
    return []

  def validate_acl(self):
    """Check correctness of access_control_list."""
    for acl in self.access_control_list:
      if acl.object_type != acl.ac_role.object_type:
        raise ValueError(
            "Access control list has different object_type '{}' with "
            "access control role '{}'".format(
                acl.object_type,
                acl.ac_role.object_type
            )
        )
    self.validate_role_limit()

  def validate_role_limit(self, _import=False):
    """Validate the number of roles assigned to object

    Args:
      _import: if True than function return list of errors for 'add_error'
    """
    errors = []
    count_roles = defaultdict(int)
    for acl in self.access_control_list:
      count_roles[acl.ac_role.name] += 1

    for _role in count_roles.keys():
      max_attr = "MAX_{}_NUM".format(_role).upper()
      _max = getattr(self, max_attr) if hasattr(self, max_attr) else None
      if _max and count_roles[_role] > _max:
        message = "{} role must have only {} person(s) assigned".format(_role,
                                                                        _max)
        if _import:
          errors.append((_role, message))
        else:
          raise ValueError(message)
    if _import:
      return errors
