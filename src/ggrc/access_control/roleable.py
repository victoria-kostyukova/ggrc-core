# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Roleable model"""
from collections import defaultdict
from sqlalchemy import and_
from sqlalchemy import orm
from sqlalchemy.orm import remote
from sqlalchemy.ext.declarative import declared_attr
from cached_property import cached_property

from ggrc import db
from ggrc.access_control.list import AccessControlList
from ggrc.access_control.people import AccessControlPeople
from ggrc.access_control import role
from ggrc.fulltext.attributes import CustomRoleAttr
from ggrc.models import reflection
from ggrc import utils
from ggrc.utils import referenced_objects


class Roleable(object):
  """Roleable Mixin

  Mixin that adds access_control_list property to the parent object. Access
  control list includes a list of AccessControlList objects.
  """

  _update_raw = ['access_control_list', ]
  _include_links = []
  _fulltext_attrs = [CustomRoleAttr('access_control_list'), ]
  _api_attrs = reflection.ApiAttributes(
      reflection.Attribute('access_control_list', True, True, True))
  MAX_ASSIGNEE_NUM = 1
  MAX_VERIFIER_NUM = 1

  _custom_publish = {
      'access_control_list': lambda obj: obj.acl_json,
  }

  def __init__(self, *args, **kwargs):
    for ac_role in role.get_ac_roles_for(self.type).values():
      AccessControlList(
          object=self,
          ac_role=ac_role,
      )
    super(Roleable, self).__init__(*args, **kwargs)

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

  @property
  def access_control_list(self):
    return [
        (acp.person, acp.ac_list)
        for acl in self._access_control_list
        for acp in acl.access_control_people
    ]

  @cached_property
  def acr_acl_map(self):
    return {acl.ac_role: acl for acl in self._access_control_list}

  @cached_property
  def acr_name_acl_map(self):
    return {acl.ac_role.name: acl for acl in self._access_control_list}

  @cached_property
  def acr_id_acl_map(self):
    return {acl.ac_role.id: acl for acl in self._access_control_list}

  def _add_acp(self, acl, people):
    for person in people:
      AccessControlPeople(person=person, ac_list=acl)

  def _remove_acp(self, acl, people):
    if not people:
      return
    people_acp_map = {acp.person: acp for acp in acl.access_control_people}
    for person in people:
      acl.access_control_people.remove(people_acp_map[person])

  def _update_acp(self, acl, new_people):
    """Update access control people list for a single ACL entry.

    Args:
      acl: a single access control list model.
      people: a set of people that should exist in ACP.
    """
    existing_people = {acp.person for acp in acl.access_control_people}
    self._remove_acp(acl, existing_people - new_people)
    self._add_acp(acl, new_people - existing_people)

  @access_control_list.setter
  def access_control_list(self, values):
    """Setter function for access control list.

    Args:
        values: List of access control roles or dicts containing json
        representation of custom attribute values.
    """
    if not values:
      return

    acls = defaultdict(set)
    for value in values:
      person = referenced_objects.get("Person", value["person"]["id"])
      acl = self.acr_id_acl_map[value["ac_role_id"]]
      acls[acl].add(person)

    for acl in self._access_control_list:
      self._update_acp(acl, acls[acl])

  def extend_access_control_list(self, values):
    """Extend access control list.

    Args:
        values: List of access control roles or dicts containing json
        representation of custom attribute values.
    """
    pass  # TODO: acp

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

  @property
  def acl_json(self):
    acl_json = []
    for person, acl in self.access_control_list:
      person_entry = acl.log_json()
      person_entry["person"] = utils.create_stub(person)
      person_entry["person_email"] = person.email
      person_entry["person_id"] = person.id
      person_entry["person_name"] = person.name
      acl_json.append(person_entry)
    return acl_json

  def log_json(self):
    """Log custom attribute values."""
    # pylint: disable=not-an-iterable
    res = super(Roleable, self).log_json()
    res["access_control_list"] = self.acl_json
    return res

  def get_persons_for_rolename(self, role_name):
    """Return list of persons that are valid for send role_name."""
    return []

  def get_person_ids_for_rolename(self, role_name):
    """Return list of persons that are valid for send role_name."""
    if role_name not in self.acr_name_acl_map:
      # This will be removed
      return []
    acps = self.acr_name_acl_map[role_name].access_control_people
    return [acp.person.id for acp in acps]

  def validate_acl(self):
    """Check correctness of access_control_list."""
    for _, acl in self.access_control_list:
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
    # This can now be fully refactored due to ACP, I am leaving this for the
    # end though.
    errors = []
    count_roles = defaultdict(int)
    for _, acl in self.access_control_list:
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
