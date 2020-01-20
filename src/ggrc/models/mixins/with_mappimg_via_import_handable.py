# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Contains mixins for handle Mapping via import events issued by signals.

This allows adding handlers to model without boilerplate code
"""

from ggrc.services import signals


class WithMappingImportHandable(object):
  """Mixin that adds Mapping via import handler"""
  __lazy_init__ = True

  # pylint: disable=invalid-name
  def handle_mapping_via_import_created(self, counterparty):
    """Proposal mapping via import handler"""
    raise NotImplementedError

  @classmethod
  def init(cls, model):
    """Init handlers"""
    # pylint: disable=unused-variable,unused-argument
    @signals.Import.mapping_created.connect_via(model)
    def mapping_created(*args, **kwargs):
      """proposal_applied handler"""
      model.handle_mapping_via_import_created(
          kwargs["instance"],
          kwargs["counterparty"]
      )
