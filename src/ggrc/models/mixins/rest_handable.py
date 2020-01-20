# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Contains mixins for handle REST events issued by signals.

This allows adding handlers to model without boilerplate code
"""

from ggrc.services import signals


class WithPutHandable(object):
  """Mixin that adds PUT handler"""
  __lazy_init__ = True

  def handle_put(self):
    """PUT handler"""
    raise NotImplementedError

  @classmethod
  def init(cls, model):
    """Init handlers"""
    # pylint: disable=unused-variable,unused-argument
    @signals.Restful.model_put.connect_via(model)
    def model_put(*args, **kwargs):
      """PUT handler"""
      model.handle_put(kwargs["obj"])


class WithPutAfterCommitHandable(object):
  """Mixin that adds PUT after commit handler."""
  __lazy_init__ = True

  def handle_put_after_commit(self, event):
    """PUT after commit handler."""
    raise NotImplementedError

  @classmethod
  def init(cls, model):
    """Init handlers."""
    # pylint: disable=unused-variable,unused-argument
    @signals.Restful.model_put_after_commit.connect_via(model)
    def model_put_after_commit(*args, **kwargs):
      """PUT after commit handler."""
      model.handle_put_after_commit(kwargs["obj"], kwargs["event"])


class WithPutBeforeCommitHandable(object):
  """Mixin that add PUT before commit handler."""
  __lazy_init__ = True

  def handle_put_before_commit(self, initial_state):
    """Handle `model_put_before_commit` signals.

    Abstract method that handles `model_put_before_commit` signals. Should be
    implemented in derived classes.

    Args:
      initial_state (collections.namedtuple): Named tuple representing initial
        state of the object method is called on.
    """
    raise NotImplementedError

  @classmethod
  def init(cls, model):
    """Init handler."""
    # pylint: disable=unused-variable,unused-argument
    @signals.Restful.model_put_before_commit.connect_via(model)
    def model_put_before_commit(*args, **kwargs):
      """PUT before commit handler."""
      model.handle_put_before_commit(kwargs["obj"], kwargs["initial_state"])


class WithDeleteHandable(object):
  """Mixin that adds DELETE handler"""
  __lazy_init__ = True

  def handle_delete(self):
    """DELETE handler"""
    raise NotImplementedError

  @classmethod
  def init(cls, model):
    """Init handlers"""
    # pylint: disable=unused-variable,unused-argument
    @signals.Restful.model_deleted.connect_via(model)
    def model_delete(*args, **kwargs):
      """DELETE handler"""
      model.handle_delete(kwargs["obj"])


class WithPostHandable(object):
  """Mixin that adds POST handler"""
  __lazy_init__ = True

  def handle_post(self):
    """POST handler"""
    raise NotImplementedError

  @classmethod
  def init(cls, model):
    """Init handlers"""
    # pylint: disable=unused-variable,unused-argument
    @signals.Restful.model_posted.connect_via(model)
    def model_posted(*args, **kwargs):
      """POST handler"""
      model.handle_post(kwargs["obj"])


class WithPostAfterCommitHandable(object):
  """Mixin that adds POST after commit handler."""
  __lazy_init__ = True

  def handle_posted_after_commit(self, event):
    """POST after commit handler."""
    raise NotImplementedError

  @classmethod
  def init(cls, model):
    """Init handlers."""
    # pylint: disable=unused-variable,unused-argument
    @signals.Restful.model_posted_after_commit.connect_via(model)
    def model_posted_after_commit(*args, **kwargs):
      """POST after commit handler."""
      model.handle_posted_after_commit(kwargs["obj"], kwargs["event"])


class WithRelationshipsHandable(object):
  """Mixin that adds relationship POST/PUT/DELETE handlers"""
  __lazy_init__ = True

  def handle_relationship_post(self, counterparty):
    """relationship POST handler"""
    pass

  def handle_relationship_delete(self, counterparty):
    """relationship DELETE handler"""
    pass

  def is_in_relationship(self, relationship):
    endpoints = [relationship.source.type, relationship.destination.type]
    return self.__name__ not in endpoints

  @classmethod
  def init(cls, model):
    """Init handlers"""
    # pylint: disable=unused-variable,unused-argument
    from ggrc.models import all_models

    def is_in_relationship(rel):
      """Check if relationship related to model"""
      endpoints = {rel.source.type, rel.destination.type}
      return model.__name__ in endpoints

    def get_obj_counterparty(rel):
      """Get model object and its counterparty"""
      counterparty = rel.source
      obj = rel.destination
      if rel.source.type == model.__name__:
        counterparty = rel.destination
        obj = rel.source
      return obj, counterparty

    @signals.Restful.model_posted.connect_via(all_models.Relationship)
    def relationship_post(*args, **kwargs):
      """relationship POST handler"""
      relationship = kwargs["obj"]
      if not is_in_relationship(relationship):
        return
      obj, counterparty = get_obj_counterparty(relationship)
      model.handle_relationship_post(obj, counterparty)

    @signals.Restful.model_deleted.connect_via(all_models.Relationship)
    def relationship_delete(*args, **kwargs):
      """relationship DELETE handler"""
      relationship = kwargs["obj"]
      if not is_in_relationship(relationship):
        return
      obj, counterparty = get_obj_counterparty(relationship)
      model.handle_relationship_delete(obj, counterparty)
