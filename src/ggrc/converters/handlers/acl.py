# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Handlers for access control roles."""

from ggrc import models
from ggrc.converters.handlers import handlers


class AccessControlRoleColumnHandler(handlers.UsersColumnHandler):
  """Handler for access control roles."""

  def __init__(self, row_converter, key, **options):
    super(AccessControlRoleColumnHandler, self).__init__(
        row_converter, key, **options)
    role_name = (options.get("attr_name") or self.display_name)
    self.acl = [acl for acl in row_converter.obj._access_control_people
                if acl.ac_role.name==role_name][0]

  def set_obj_attr(self):
    """Update current AC list with correct people values."""
    value_is_correct = self.value or self.set_empty
    if not value_is_correct:
      return
    list_old = {
        acp.person
        for acp in self.acl.access_control_people
    }
    if self.set_empty:
      self.row_converter.obj._remove_acp(self.acl, list_old)
      return

    list_new = set(self.value)
    self.row_converter.obj._add_acp(list_new - list_old)
    self.row_converter.obj._remove_acp(list_old - list_new)

  def get_value(self):
    """Get list of emails for people with the current AC role."""
    people = sorted(
        acl.person.email
        for acl in self.row_converter.obj.access_control_list
        if acl.ac_role == self.role
    )
    return "\n".join(people)
