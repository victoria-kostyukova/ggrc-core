# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module containing `WithPeopleCache` mixin."""

import collections

from ggrc import utils
from ggrc.converters import errors
from ggrc.converters.handlers import handlers
from ggrc.utils import structures
from ggrc.utils import user_generator


class WithPeopleCache(object):
  """Mixin providing people cache functionality for block."""

  def __init__(self, *args, **kwargs):
    super(WithPeopleCache, self).__init__(*args, **kwargs)
    self._people_cache = None
    self._people_errors_cache = collections.defaultdict(list)

  @property
  def people_cache(self):
    # type: () -> Dict[str, models.Person]
    """Return people used for objects in the block.

    Returns people used for objects in the block grouped by their emails. If
    person with provided email does not exist in the system, one will be
    created.

    Returns:
      A dict where keys are user emails and values are persom objects.
    """
    if self._people_cache is None:
      with utils.benchmark("Create cache of people"):
        self._create_people_cache()
    return self._people_cache

  def gather_people_errors(self, row_idx, attr_name):
    # type: (int, str) -> List[Tuple[str, Dict[str, Any]]]
    """Get errors raised during people cache creation in row and column."""
    return self._people_errors_cache[(row_idx, attr_name)]

  def _gather_columns_with_people(self):
    # type: () -> Dict[Tuple[int, str], handlers.ColumnHandler]
    """Get mapping (index, attr_name): handler of columns containing people."""
    return {
        (i, attr_name): header
        for i, (attr_name, header) in enumerate(self.headers.iteritems())
        if issubclass(header["handler"], handlers.PersonColumnHandlerMixin)
    }

  def _create_people_cache(self):
    """Create cache of people used in this block."""
    with utils.benchmark("Create cache of people"):
      if self.operation == "import":
        self._create_people_cache_import()
      if self.operation == "export":
        self._people_cache = {}

  def _create_people_cache_import(self):
    """Create cache of people used in this block for import."""
    people_emails = set()

    columns_with_people = self._gather_columns_with_people()
    for row_idx, row in enumerate(self.rows):
      for (column_idx, attr_name), header in columns_with_people.iteritems():
        handler = header["handler"]
        emails = handler.get_people_emails_from_value(row[column_idx])
        valid_emails = set()
        for email in emails:
          try:
            handler.validate_email(email)
          except ValueError as err:
            self._cache_error(
                errors.VALIDATION_ERROR,
                key=(row_idx, attr_name),
                column_name=header["display_name"],
                message=err.message,
            )
            continue

          valid_emails.add(email)

        people_emails |= set(valid_emails)

    people = []
    if people_emails:
      people = user_generator.find_users(people_emails)
    self._people_cache = structures.CaseInsensitiveDict({
        person.email: person for person in people
    })

  def _cache_error(self, template, key, **kwargs):
    """Cache an error to use it later in column handlers."""
    self._people_errors_cache[key].append((template, kwargs))
