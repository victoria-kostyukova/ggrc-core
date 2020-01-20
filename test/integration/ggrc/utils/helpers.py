# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module with common helper functions."""
import collections

import ddt

from ggrc.models import all_models
from integration.ggrc_basic_permissions.models \
    import factories as rbac_factories


def add_person_global_role(person, role):
  """Add role to person"""
  system_role = all_models.Role.query.filter(
      all_models.Role.name == role
  ).one()
  rbac_factories.UserRoleFactory(role=system_role, person=person)
  return person


def tuplify(data, unwrap_keys=False):
  """Convert dictionary to a list of tuples."""
  for key, value in data.items():

    if not (unwrap_keys and isinstance(key, tuple)):
      key = (key,)

    for item in key:
      if isinstance(value, dict):
        for keykey in tuplify(value, unwrap_keys):
          yield (item,) + keykey
      else:
        yield (item, value)


def unwrap(data, unwrap_keys=False):
  """Decorator that unwrap data dictionary into list of tuples.

  Structure like {"A": {"B": "C", "D": "E"} will be changed to
  [("A", "B", "C"), ("A", "D", "E")]. It will be fed to wrapped function
  through the ddt.unpack.

  Args:
      data: Dictionary with test parameters.
      unwrap_keys: Boolean flag indicating whether dict keys should be
          unwrapped too in case they are tuples. Defaults to False.

  Returns:
      A batch of test functions.
  """
  def wrapper(func):
    return ddt.data(*tuplify(data, unwrap_keys))(ddt.unpack(func))
  return wrapper


def parse_export_data(data):
  """Parse standard export data into dict with header fields as keys.

  Input data should have the following format:
  <Field descriptions row>\r\n
  <Field names>\r\n
  <Field values>\r\n
  ...
  3 lines in the end.
  """
  field_values = collections.defaultdict(list)
  try:
    export_rows = data.split("\r\n")
    field_names = export_rows[1].split(",")

    # Field values are stored starting from second string,
    # last 3 strings are empty in standard export csv.
    rows = export_rows[2: -3]
    for row in rows:
      values = row.split(",")
      for id_, val in enumerate(values):
        field_values[field_names[id_]].append(val.strip('"'))
  except (IndexError, AttributeError):
    pass
  return field_values
