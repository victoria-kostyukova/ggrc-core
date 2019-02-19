# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module containing Categorizable mixin.

The mixin add categories and assertions fields to the model.
"""
import json

from sqlalchemy import orm
from sqlalchemy.ext.declarative import declared_attr
from werkzeug import exceptions

from ggrc import db
from ggrc.models import deferred, reflection
from ggrc.fulltext import attributes


def build_assertions(obj):
  """Returns a list of assertions for object."""
  return json.loads(obj.assertions) if obj.assertions else []


def build_categories(obj):
  """Returns a list of categories for object."""
  return json.loads(obj.categories) if obj.categories else []


class Categorizable(object):
  """Categorizable mixin."""

  @declared_attr
  def assertions(cls):  # pylint: disable=no-self-argument
    return deferred.deferred(
        db.Column(db.String, nullable=True),
        cls.__name__
    )

  @declared_attr
  def categories(cls):  # pylint: disable=no-self-argument
    return deferred.deferred(
        db.Column(db.String, nullable=True),
        cls.__name__
    )

  _fulltext_attrs = [
      attributes.JsonListFullTextAttr(
          "assertions",
          "assertions",
      ),
      attributes.JsonListFullTextAttr(
          "categories",
          "categories",
      ),
  ]
  _api_attrs = reflection.ApiAttributes(
      "assertions",
      "categories",
  )
  _aliases = {
      "assertions": {
          "display_name": "Assertions",
          "mandatory": True,
      },
      "categories": "Categories",
  }
  _custom_publish = {
      "assertions": build_assertions,
      "categories": build_categories,
  }

  _update_raw = ["assertions", "categories"]

  WRONG_FORMAT_ERR = "Wrong format of {} field."

  @orm.validates("assertions", "categories")
  def validate_categories(self, key, value):
    """Validate correctness of provided assertions."""
    categories = value
    if not value:
      categories = "[]"
    elif isinstance(value, list):
      categories = json.dumps(value)
    elif isinstance(value, (str, unicode)):
      try:
        categories_json = json.loads(value)
      except ValueError:
        raise exceptions.BadRequest(self.WRONG_FORMAT_ERR.format(key))

      if not isinstance(categories_json, list):
        raise exceptions.BadRequest(self.WRONG_FORMAT_ERR.format(key))
    else:
      raise exceptions.BadRequest(self.WRONG_FORMAT_ERR.format(key))

    return categories
