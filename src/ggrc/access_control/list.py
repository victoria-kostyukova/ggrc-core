# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Access Control List model"""

from ggrc import db
from ggrc import utils
from ggrc.access_control import people as acp
from ggrc.models import mixins
from ggrc.models import reflection
from ggrc.models.mixins import base


class AccessControlList(base.ContextRBAC, mixins.Base, db.Model):
  """Access Control List

  Model is a mapping between a role and an object. It creates a base for
  permissions of the role for mapping a person to this permission.
  """
  __tablename__ = 'access_control_list'
  _api_attrs = reflection.ApiAttributes(
      "ac_role_id"
  )

  ac_role_id = db.Column(db.Integer, db.ForeignKey(
      'access_control_roles.id'), nullable=False)
  object_id = db.Column(db.Integer, nullable=False)
  object_type = db.Column(db.String, nullable=False)

  # Base id always points to the top most parent of the acl propagation chain
  # or to itself if there are no parents. This field is used to optimize
  # permission queries by making sure a single extra join is needed to get to
  # the base ACL entry (one without parents) to which access control people are
  # mapped.
  base_id = db.Column(
      db.Integer,
      db.ForeignKey('access_control_list.id', ondelete='CASCADE'),
      nullable=True,
  )

  # This field is a copy of parent_id but set to not nullable, so it can be
  # used in a unique constraint. Uniqueness check will always pass if there is
  # a NULL in the set.
  parent_id_nn = db.Column(
      db.Integer,
      nullable=False,
      default=0,
  )

  # Parent id field is just to keep the information about the entire chain of
  # acl propagation. This field is only needed for acl deletion. So unmapping
  # will remove the entire subtree of propagated acl entries.
  parent_id = db.Column(
      db.Integer,
      db.ForeignKey('access_control_list.id', ondelete='CASCADE'),
      nullable=True,
  )

  parent = db.relationship(
      lambda: AccessControlList,  # pylint: disable=undefined-variable
      foreign_keys=lambda: AccessControlList.parent_id,
      remote_side=lambda: AccessControlList.id,
  )

  access_control_people = db.relationship(
      'AccessControlPerson',
      foreign_keys='AccessControlPerson.ac_list_id',
      backref='ac_list',
      lazy='subquery',
      cascade='all, delete-orphan',
  )

  @property
  def people_json(self):
    """Get json representation of people in ACL."""
    people_json = []
    common_json = self.log_json()
    for _acp in self.access_control_people:
      person = _acp.person
      person_entry = dict(
          person=utils.create_stub(person),
          person_email=person.email,
          person_id=person.id,
          person_name=person.name,
      )
      person_entry.update(common_json)
      people_json.append(person_entry)
    return people_json

  @property
  def object_attr(self):
    return '{0}_object'.format(self.object_type)

  @property
  def object(self):
    return getattr(self, self.object_attr)

  @object.setter
  def object(self, value):
    self.object_id = getattr(value, 'id', None)
    self.object_type = getattr(value, 'type', None)
    return setattr(self, self.object_attr, value)

  @staticmethod
  def _extra_table_args(_):
    return (
        db.UniqueConstraint(
            'ac_role_id',
            'object_id',
            'object_type',
            'parent_id_nn',
        ),
        db.Index('idx_object_type_object_idx', 'object_type', 'object_id'),
        db.Index('ix_role_object', 'ac_role_id', 'object_type', 'object_id'),
        db.Index(
            'idx_object_type_object_id_parent_id_nn',
            'object_type',
            'object_id',
            'parent_id_nn',
        ),
    )

  def _remove_people(self, obsolete_people):
    """Remove people from the current acl."""
    if not obsolete_people:
      return
    people_acp_map = {acp.person: acp for acp in self.access_control_people}
    for person in obsolete_people:
      self.access_control_people.remove(people_acp_map[person])

  def _add_people(self, additional_people):
    """Add people to the current acl."""
    for person in additional_people:
      acp.AccessControlPerson(ac_list=self, person=person)

  def add_person(self, additional_person):
    """Add a single person to current ACL entry.

    Args:
      additional_person: new person model that will be added.
    """
    self.add_people({additional_person})

  def add_people(self, additional_people):
    """Ensure that people are linked to the current ACL entry.

    Args:
      additional_people: set of people objects that will be added.
    """
    existing_people = {acp.person for acp in self.access_control_people}
    self._add_people(additional_people - existing_people)

  def remove_person(self, obsolete_person):
    self.remove_people({obsolete_person})

  def remove_people(self, obsolete_people):
    """Remove the given people from the current ACL entry.

    Args:
      obsolete_people: set of people models that will be removed.
    """
    existing_people = {acp.person for acp in self.access_control_people}
    self._remove_people(obsolete_people & existing_people)

  @property
  def current_people(self):
    """Get the list of current acl people

    Returns:
      set of persons from access_control_people
      """
    return {acp.person for acp in self.access_control_people}

  def update_people(self, new_people):
    """Update the list of current acl people to match new_people.

    Args:
      new_people: set of people objects. Any existing person missing from that
        set will be removed. Any new people will be added.

    Returns:
      True - if values was updated, and False - if we didn't update any people
    """
    existing_people = self.current_people
    self._remove_people(existing_people - new_people)
    self._add_people(new_people - existing_people)
    return existing_people != new_people
