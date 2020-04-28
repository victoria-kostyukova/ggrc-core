# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Base functions for app_entity factories."""
import copy

from lib.utils import random_utils, string_utils


class BaseFactory(object):
  """Base factory for app entities."""

  @property
  def _entity_cls(self):
    """Returns an app entity to create. To be overridden in subclass."""
    raise NotImplementedError

  @property
  def _empty_attrs(self):
    """Returns a dict of attributes used to create an empty entity object so
    all attributes will have values of valid types (e.g. empty lists or dicts).
    May be overridden in subclass.
    """
    return {}

  @property
  def _default_attrs(self):
    """Returns a dict of random mandatory attributes used to create a default
    object.
    May be overridden in subclass.
    """
    return {}

  def _post_obj_init(self, obj):
    """Run operations after creating an object (e.g. when creating a workflow
    set workflow for task group).
    May be overridden in subclass.
    """
    pass

  def create(self, **attrs):
    """Creates a random app entity with `args`."""
    attrs_to_set = copy.deepcopy(self._default_attrs)
    attrs_to_set.update(**attrs)
    return self.create_empty(**attrs_to_set)

  def create_empty(self, **attrs):
    """Creates an app entity from `args`. Attributes that are not passed,
    will be set to None.
    """
    all_attr_names = self._entity_cls.fields()
    all_attrs = dict.fromkeys(all_attr_names)
    attrs_to_set = self._empty_attrs
    attrs_to_set.update(attrs)
    for attr_name, attr_value in attrs_to_set.iteritems():
      all_attrs[attr_name] = attr_value
    obj = self._entity_cls(**all_attrs)
    self._post_obj_init(obj)
    return obj

  @property
  def _obj_title(self):
    """Returns a random object title for the object."""
    return random_utils.get_title(self._obj_name())

  @classmethod
  def _obj_name(cls):
    """Returns object name for app entity."""
    return string_utils.remove_from_end(cls.__name__, "Factory")

  @classmethod
  def generate_external_id(cls):
    """Generates external id."""
    import random
    return random.randint(10000, 99999)

  def generate_external_slug(self):
    """Generates external id."""
    import random
    return self._obj_name() + str(random.randint(10000, 99999))
