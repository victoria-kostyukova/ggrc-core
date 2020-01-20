# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Custom Pytest schedulers"""

from xdist.scheduler import LoadScheduling

from lib.constants import test_runner


class CustomPytestScheduling(LoadScheduling):
  """Pytest scheduler.
  The only difference from LoadScheduling is that it sends all "destructive"
  tests to the same node. It is done so they will not collide with other tests
  running in parallel.
  A test is marked as destructive by starting its name with "test_destructive".
  """
  NUMBER_TO_PREVENT_UNEQUAL_LOAD = 3

  def _send_tests(self, node, num):
    if len(self.node2pending[node]) >= self.NUMBER_TO_PREVENT_UNEQUAL_LOAD:
      # There are already enough tests. Do not schedule more to prevent
      # unequal load on nodes.
      return

    def _idxs_of_remaining_tests():
      """Remaining tests to send."""
      return self.pending[:num]
    idxs_to_send_lists = [
        self._idxs_of_destructive_tests,
        self._idxs_of_proposal_tests,
        self._idxs_of_export_tests,
        _idxs_of_remaining_tests
    ]
    idxs_to_send = []
    for elem in idxs_to_send_lists:
      if not idxs_to_send:
        idxs_to_send = elem()
    self._execute_tests(node, idxs_to_send)

  def _idxs_of_destructive_tests(self):
    """Destructive tests to send."""
    return self._idxs_to_send_for(self.is_destructive_test)

  def _idxs_of_proposal_tests(self):
    """Proposal tests to send."""
    return self._idxs_to_send_for(self._is_check_proposals_test)

  def _idxs_of_export_tests(self):
    """Export tests to send."""
    return self._idxs_to_send_for(self._is_export_test)

  def _idxs_to_send_for(self, should_include):
    """Choose what tests to send."""
    idxs_to_send = []
    for idx, test_name in enumerate(self.collection):
      if should_include(test_name) and idx in self.pending:
        idxs_to_send.append(idx)
    return idxs_to_send

  def _execute_tests(self, node, idxs_to_send):
    """Run tests represented by `idxs_to_send` at `node`"""
    for test_idx in idxs_to_send:
      self.pending.remove(test_idx)
    self.node2pending[node].extend(idxs_to_send)
    node.send_runtest_some(idxs_to_send)

  @staticmethod
  def is_destructive_test(*args):
    """Verify if test destructive based on prefix and suffix and list of
    input items.
    """
    prefix = test_runner.DESTRUCTIVE_TEST_METHOD_PREFIX
    suffix = test_runner.DESTRUCTIVE_TEST_CLASS_SUFFIX
    return any(
        str_part in item
        for str_part in (prefix, suffix)
        for item in args
    )

  @staticmethod
  def _is_check_proposals_test(test_id):
    return test_runner.CHECK_PROPOSALS_TEST_METHOD_PREFIX in test_id

  @staticmethod
  def _is_export_test(test_id):
    return test_runner.TEST_EXPORT_METHOD_PREFIX in test_id
