# Copyright (C) 2019 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test issue_tracker hooks."""

import unittest

import ddt
import mock

from ggrc.models.hooks.issue_tracker import assessment_integration
from ggrc.models.hooks.issue_tracker import integration_utils
from ggrc.models import exceptions


@ddt.ddt
class TestUtilityFunctions(unittest.TestCase):
  """Test utility function in issue_tracker module."""

  def setUp(self):
    super(TestUtilityFunctions, self).setUp()
    self.session = mock.MagicMock()

  @ddt.data(
      (
          {
              'component_id': '188208',
              'hotlist_id': '2222',
              'issue_type': 'PROCESS',
              'issue_priority': 'P2',
              'issue_severity': 'S2',
              'title': 'Title'
          },
          None
      ),
      (
          {
              'component_id': '188208',
              'hotlist_id': '2222',
              'issue_type': 'PROCESS',
              'issue_priority': 'P2',
              'issue_severity': 'S2',
              'title': 'Title'
          },
          None,
      ),
      (
          {
              'component_id': '188208',
              'hotlist_id': '2222',
              'issue_type': 'PROCESS',
              'issue_priority': 'P2',
              'issue_severity': 'S2',
              'title': 'Title'
          },
          None,
      ),
      (
          {
              'component_id': 'zzz',
              'hotlist_id': '2222',
              'issue_type': 'PROCESS',
              'issue_priority': 'P2',
              'issue_severity': 'S2',
              'title': 'Title'
          },
          integration_utils.exceptions.ValidationError,),
      (
          {
              'component_id': '188208',
              'hotlist_id': 'zzz',
              'issue_type': 'PROCESS',
              'issue_priority': 'P2',
              'issue_severity': 'S2',
              'title': 'Title'
          },
          integration_utils.exceptions.ValidationError,),
  )
  @ddt.unpack
  def test_validate_info(self, info, expected_error):
    """Test _validate_issue_tracker_info function."""
    initial_info = dict(info)
    tracker_handler = assessment_integration.AssessmentTrackerHandler()
    # pylint: disable=protected-access
    if expected_error:
      with self.assertRaises(expected_error):
        tracker_handler._validate_generic_fields(info)
    else:
      tracker_handler._validate_generic_fields(info)

    self.assertEqual(info, initial_info)

  @ddt.data(
      ({},
       integration_utils.exceptions.ValidationError,),
      ({'issue_id': 'notint'},
       integration_utils.exceptions.ValidationError,),
      ({'issue_id': ''},
       integration_utils.exceptions.ValidationError,),
      ({'issue_id': '1234'},
       None,),
  )
  @ddt.unpack
  def test_validate_issue_id(self, info, expected_error):
    """Test _validate_issue_tracker_info function."""
    initial_info = dict(info)
    tracker_handler = assessment_integration.AssessmentTrackerHandler()
    # pylint: disable=protected-access
    if expected_error:
      with self.assertRaises(expected_error):
        tracker_handler._validate_issue_id(info)
    else:
      tracker_handler._validate_issue_id(info)

    self.assertEqual(info, initial_info)

  @ddt.data(
      ({'component_id': '188208', 'hotlist_id': '2222'},
       {'component_id': 188208, 'hotlist_id': 2222},
       None,),
      ({'component_id': '188208'},
       {'component_id': 188208},
       None,),
      ({'hotlist_id': '2222'},
       {'hotlist_id': 2222},
       None,),
      ({'component_id': 'zzz'},
       None,
       integration_utils.exceptions.ValidationError,),
      ({'hotlist_id': 'zzz'},
       None,
       integration_utils.exceptions.ValidationError,),
  )
  @ddt.unpack
  def test_normalize_info(self, info, expected, expected_error):
    """Test _normalize_issue_tracker_info function."""
    # pylint: disable=protected-access
    if expected_error:
      with self.assertRaises(expected_error):
        integration_utils.normalize_issue_tracker_info(info)
    else:
      integration_utils.normalize_issue_tracker_info(info)
      self.assertEqual(info, expected)

  @ddt.data(
      ([], [], []),
      (["1@e.w", "1@e.w"], ["1@e.w", "2@e.w"], ["1@e.w", "2@e.w"]),
      (["1@e.w", "2@e.w"], ["3@e.w", "2@e.w"], ["1@e.w", "2@e.w", "3@e.w"]),
      (["1@e.w", "2@e.w"],
       ["3@e.w", "4@e.w"],
       ["1@e.w", "2@e.w", "3@e.w", "4@e.w"]),
  )
  @ddt.unpack
  def test_merge_ccs_method(self, object_ccs, additional_ccs, expected_ccs):
    """Test merge_ccs method"""
    # pylint: disable=protected-access
    tracker_handler = assessment_integration.AssessmentTrackerHandler()
    grouped_ccs = tracker_handler._merge_ccs(
        object_ccs,
        additional_ccs,
    )
    self.assertEqual(set(grouped_ccs), set(expected_ccs))

  def test_reporter_sync_exists(self):
    """Test for get reporter on sync if reporter exists."""
    # pylint: disable=protected-access
    mock_object = mock.MagicMock(id=1)
    with mock.patch.object(
        assessment_integration.AssessmentTrackerHandler,
        '_is_reporter_exists',
        return_value=True
    ):
      tracker_handler = assessment_integration.AssessmentTrackerHandler()
      reporter = "reporter@test.com"
      reporter_tracker = tracker_handler._get_reporter_on_sync(
          mock_object,
          reporter
      )
      self.assertEqual(reporter, reporter_tracker)

  @mock.patch.object(
      assessment_integration.AssessmentTrackerHandler,
      '_get_reporter',
      lambda obj, audit_id: "repoter2@test.com"
  )
  def test_reporter_sync_not_exists(self):
    """Test for get reporter on sync if not exists."""
    # pylint: disable=protected-access
    mock_object = mock.MagicMock(id=1)
    with mock.patch.object(
        assessment_integration.AssessmentTrackerHandler,
        '_is_reporter_exists',
        return_value=False
    ):
      tracker_handler = assessment_integration.AssessmentTrackerHandler()
      reporter = "reporter@test.com"
      reporter_tracker = tracker_handler._get_reporter_on_sync(
          audit=mock_object,
          reporter_db=reporter
      )
      self.assertEqual(
          "repoter2@test.com",
          reporter_tracker
      )

  def test_assignee_sync_exists(self):
    """Test for get assignee on sync if assignee exists."""
    # pylint: disable=protected-access
    assmt_object = mock.MagicMock(id=1)
    with mock.patch.object(
        assessment_integration.AssessmentTrackerHandler,
        '_is_assignee_exists',
        return_value=True
    ):
      tracker_handler = assessment_integration.AssessmentTrackerHandler()
      assignee = "assignee@test.com"
      assignee_tracker = tracker_handler._get_assignee_on_sync(
          assmt_object,
          assignee
      )
      self.assertEqual(assignee, assignee_tracker)

  @mock.patch.object(
      assessment_integration.AssessmentTrackerHandler,
      '_get_assignee',
      lambda obj, assmt_id: "assignee2@test.com"
  )
  def test_assignee_sync_not_exists(self):
    """Test for get assignee on sync if not assignee exists."""
    # pylint: disable=protected-access
    assmt_object = mock.MagicMock(id=1)
    with mock.patch.object(
        assessment_integration.AssessmentTrackerHandler,
        '_is_assignee_exists',
        return_value=False
    ):
      tracker_handler = assessment_integration.AssessmentTrackerHandler()
      reporter = "assignee@test.com"
      reporter_tracker = tracker_handler._get_assignee_on_sync(
          assmt_object,
          reporter
      )
      self.assertEqual(
          "assignee2@test.com",
          reporter_tracker
      )

  @mock.patch(
      'ggrc.models.hooks.issue_tracker.assessment_integration.'
      'AssessmentTrackerHandler._get_issue_from_assmt_template'
  )
  @ddt.data(
      # cases: issue tracker is OFF in API
      ({'enabled': False}, {'enabled': True}, False),
      ({'enabled': False}, {'enabled': False}, False),
      ({'enabled': False}, None, False),
      # cases: issue tracker ON in API
      ({'enabled': True}, {'enabled': True}, True),
      ({'enabled': True}, {'enabled': False}, True),
      ({'enabled': True}, None, True),
      # cases: no "enable" flag in API
      (None, {'enabled': True}, True),
      (None, {'enabled': False}, False),
      (None, None, True),
  )
  @ddt.unpack
  def test_is_issue_on_create_enabled(self, api_issue_dict, tmpl_issue_dict,
                                      expected, mock_template):
    """Test _is_issue_on_create_enabled(api={0}, tmpl={1})"""
    # pylint: disable=protected-access,too-many-arguments

    # prepare Assessment instance
    asmt = mock.Mock()
    asmt.audit = mock.Mock()

    # prepare API dictionary
    api_dict = {}

    if api_issue_dict is not None:
      api_dict['issue_tracker'] = api_issue_dict

    if tmpl_issue_dict is not None:
      api_dict['template'] = {}
      mock_template.return_value = tmpl_issue_dict
    else:
      mock_template.return_value = {}

    # test result
    tracker_handler = assessment_integration.AssessmentTrackerHandler()
    ret = tracker_handler._is_issue_on_create_enabled(api_dict)

    self.assertEqual(ret, expected)

  @ddt.data(
      ({}, False),
      ({'title': None}, False),
      ({'title': ''}, False),
      ({'title': ' '}, False),
      ({'title': 'a'}, True),
      ({'title': 'a '}, True),
  )
  @ddt.unpack
  def test_validate_assessment_title(self, issue_info, expected):
    """Test title validation in issue_info={0}"""
    # pylint: disable=protected-access

    if expected:
      assessment_integration.AssessmentTrackerHandler.\
          _validate_assessment_title(issue_info)
    else:
      with self.assertRaises(exceptions.ValidationError):
        assessment_integration.AssessmentTrackerHandler.\
            _validate_assessment_title(issue_info)

  @mock.patch(
      'ggrc.models.hooks.issue_tracker.assessment_integration.'
      'AssessmentTrackerHandler._get_issue_info_from_audit'
  )
  @mock.patch(
      'ggrc.models.hooks.issue_tracker.assessment_integration.'
      'AssessmentTrackerHandler._get_issue_from_assmt_template'
  )
  @ddt.data(
      # expected - value from API dict
      ({'a': 1}, None, None, {'a': 1}),
      ({'a': 1}, {}, None, {'a': 1}),
      ({'a': 1}, None, {}, {'a': 1}),
      ({'a': 1}, {}, {}, {'a': 1}),
      ({'a': 1}, {'b': 1}, None, {'a': 1}),
      ({'a': 1}, {'b': 1}, {}, {'a': 1}),
      ({'a': 1}, None, {'c': 1}, {'a': 1}),
      ({'a': 1}, {}, {'c': 1}, {'a': 1}),
      ({'a': 1}, {'b': 1}, {'c': 1}, {'a': 1}),
      # expected - value from template dict
      (None, {'b': 1}, None, {'b': 1, 'title': 'T'}),
      ({}, {'b': 1}, None, {'b': 1, 'title': 'T'}),
      (None, {'b': 1}, {}, {'b': 1, 'title': 'T'}),
      ({}, {'b': 1}, {}, {'b': 1, 'title': 'T'}),
      (None, {'b': 1}, {'c': 1}, {'b': 1, 'title': 'T'}),
      ({}, {'b': 1}, {'c': 1}, {'b': 1, 'title': 'T'}),
      # expected - value from audit dict
      (None, None, {'c': 1}, {'c': 1, 'title': 'T'}),
      ({}, None, {'c': 1}, {'c': 1, 'title': 'T'}),
      (None, {}, {'c': 1}, {'c': 1, 'title': 'T'}),
      ({}, {}, {'c': 1}, {'c': 1, 'title': 'T'}),
  )
  @ddt.unpack
  def test_get_issuetracker_info(self, api_value, tmpl_value,
                                 audit_value, expected,
                                 mock_tmpl, mock_audit):
    """Test _get_issuetracker_info(api_val={0}, tmpl_val={1}, audit_val={2})"""
    # pylint: disable=protected-access,too-many-arguments

    asmt = mock.Mock()
    asmt.title = 'T'
    api_dict = dict()

    if api_value is not None:
      api_dict['issue_tracker'] = api_value

    if tmpl_value is not None:
      api_dict['template'] = {'type': 'A', 'id': 'B'}
      mock_tmpl.return_value = tmpl_value
    else:
      mock_tmpl.return_value = {}

    if audit_value is not None:
      api_dict['audit'] = {'type': 'A', 'id': 'B'}
      mock_audit.return_value = audit_value
    else:
      mock_audit.return_value = {}

    # test result
    tracker_handler = assessment_integration.AssessmentTrackerHandler()
    ret = tracker_handler._get_issuetracker_info(asmt, api_dict)

    self.assertEqual(ret, expected)
