# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""A mixin for objects that can be filtered in Query API"""


class Filterable(object):
  """Mixin for identification of filterable attributes of model in Query API"""
  _filterable_attrs = []

  @classmethod
  def get_filterable_attributes(cls):
    """Collect all filterable attributes from base classes."""
    result = set()

    for base in cls.__mro__:
      for attr in getattr(base, '_filterable_attrs', []):
        if hasattr(cls, attr):
          result.add(attr)

    return result

  @classmethod
  def get_filterable_attribute(cls, name):
    """Return filterable attribute. If attribute is missing returns None."""
    if cls.has_filterable_attribute(name):
      return getattr(cls, name)

    return None

  @classmethod
  def has_filterable_attribute(cls, name):
    """Check existence of filterable attribute."""
    return name in cls.get_filterable_attributes()
