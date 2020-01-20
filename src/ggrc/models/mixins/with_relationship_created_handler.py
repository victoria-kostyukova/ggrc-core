# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Contains WithRelationshipCreatedHandler mixin.

Used to handle relationship created event.
"""
from ggrc.models import relationship
from ggrc.services import signals


class WithRelationshipCreatedHandler(object):

  """Mixin for handle relationship created/deleted event"""
  __lazy_init__ = True

  @classmethod
  def init(cls, model):
    """Initialization method to run after models have been initialized."""
    cls.set_handlers(model)

  def handle_relationship_created(self, target):
    """Override with custom handling"""
    pass

  @classmethod
  def set_handlers(cls, model):
    """Sets up handlers"""

    # pylint: disable=unused-argument,unused-variable
    @signals.Restful.collection_posted.connect_via(relationship.Relationship)
    def handle_object_mapping(sender, objects=None, **kwargs):
      """Handle  relationship collection_posted event"""
      for rel in objects:
        if rel.source_type == model.__name__:
          model.handle_relationship_created(rel.source, rel.destination)
        elif rel.destination_type == model.__name__:
          model.handle_relationship_created(rel.destination, rel.source)
