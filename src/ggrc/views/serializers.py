# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Serializers for view requests."""

from ggrc import models


class RelationshipSerializer(object):
  """Serializer that serialize/deserialize relationship between two objects."""
  def __init__(self, data):
    self.raw_data = data
    self.cleaned_data = None

  def clean(self):
    """Deserialize JSON object to internal representation."""
    if not self.raw_data:
      raise ValueError("No input data was provided.")

    try:
      first_object_id = self.raw_data["first_object_id"]
      first_object_type = self.raw_data["first_object_type"]
      second_object_id = self.raw_data["second_object_id"]
      second_object_type = self.raw_data["second_object_type"]
    except KeyError as exc:
      raise ValueError("Missing mandatory attribute: %s." % exc.message)

    if not isinstance(first_object_id, int):
      raise ValueError("Invalid object id for first object.")

    if not isinstance(second_object_id, int):
      raise ValueError("Invalid object id for second object.")

    if not isinstance(first_object_type, basestring) or \
       not models.get_model(first_object_type):
      raise ValueError("Invalid object type for first object.")

    if not isinstance(first_object_type, basestring) or \
       not models.get_model(second_object_type):
      raise ValueError("Invalid object type for second object.")

    self.cleaned_data = {
        "first_type": first_object_type,
        "first_id": first_object_id,
        "second_type": second_object_type,
        "second_id": second_object_id,
    }

  def as_query(self):
    """Return query based on cleaned data."""
    if not self.cleaned_data:
      raise ValueError("Input data must be cleaned.")

    return models.Relationship.query.filter(
        models.Relationship.source_type ==
        self.cleaned_data["first_type"],
        models.Relationship.source_id ==
        self.cleaned_data["first_id"],
        models.Relationship.destination_type ==
        self.cleaned_data["second_type"],
        models.Relationship.destination_id ==
        self.cleaned_data["second_id"]
    ).union(models.Relationship.query.filter(
        models.Relationship.source_type ==
        self.cleaned_data["second_type"],
        models.Relationship.source_id ==
        self.cleaned_data["second_id"],
        models.Relationship.destination_type ==
        self.cleaned_data["first_type"],
        models.Relationship.destination_id ==
        self.cleaned_data["first_id"]
    ))
