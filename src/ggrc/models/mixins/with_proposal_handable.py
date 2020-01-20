# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Contains mixins for handle Proposal events issued by signals.

This allows adding handlers to model without boilerplate code
"""

from ggrc.services import signals


class WithProposalHandable(object):
  """Mixin that adds Proposal handler"""
  __lazy_init__ = True

  def handle_proposal_applied(self):
    """Proposal applied handler"""
    raise NotImplementedError

  @classmethod
  def init(cls, model):
    """Init handlers"""
    # pylint: disable=unused-variable,unused-argument
    @signals.Proposal.proposal_applied.connect_via(model)
    def proposal_applied(*args, **kwargs):
      """proposal_applied handler"""
      model.handle_proposal_applied(kwargs["instance"])
