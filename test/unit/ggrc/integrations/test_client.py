# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Unit tests for client module."""
# pylint: disable=protected-access

import unittest

import mock
import ddt

from google.appengine.api import urlfetch_errors

from ggrc.integrations import client
from ggrc.integrations import constants
from ggrc.integrations import integrations_errors
from ggrc.integrations import issues


class ObjectDict(dict):
  """Dict with attributes access behavior."""

  __getattr__ = dict.__getitem__
  __setattr__ = dict.__setitem__


@ddt.ddt
class BaseClientTest(unittest.TestCase):
  """Test for Base Client"""

  def setUp(self):
    self.testable_cls = client.BaseClient

  @mock.patch('ggrc.integrations.client.urlfetch.fetch')
  def test_perform_request(self, fetch_mock):
    """Test request performing """
    fetch_mock.return_value = ObjectDict({
        'status_code': 200,
        'content': 'some content'
    })

    with mock.patch.multiple(self.testable_cls,
                             ENDPOINT='http://endpoint',
                             DEFAULT_HEADERS={
                                 'X-URLFetch-Service-Id': 'SERVICE',
                             }):
      testable_obj = self.testable_cls()
      response = testable_obj._perform_request('some_url')
      self.assertEqual(response, 'some content')
      fetch_mock.assert_called_once_with(
          'http://endpoint/some_url',
          method=client.urlfetch.GET,
          payload=None,
          headers={'X-URLFetch-Service-Id': 'SERVICE'},
          follow_redirects=False,
          deadline=constants.REQUEST_DEADLINE,
      )

  @mock.patch('ggrc.integrations.client.urlfetch.fetch')
  def test_post_request(self, fetch_mock):
    """Test POST request"""
    fetch_mock.return_value = ObjectDict({
        'status_code': 200,
        'content': 'some content'
    })

    with mock.patch.multiple(self.testable_cls,
                             ENDPOINT='endpoint',
                             DEFAULT_HEADERS={
                                 'X-URLFetch-Service-Id': 'SERVICE',
                             }):
      testable_obj = self.testable_cls()
      response = testable_obj._perform_request(
          'endpoint/some_url_post',
          method=client.urlfetch.POST,
          payload='some payload',
      )
      self.assertEqual(response, 'some content')
      fetch_mock.assert_called_once_with(
          'endpoint/some_url_post',
          method=client.urlfetch.POST,
          payload='some payload',
          headers={'X-URLFetch-Service-Id': 'SERVICE'},
          follow_redirects=False,
          deadline=constants.REQUEST_DEADLINE,
      )

  @mock.patch('ggrc.integrations.client.urlfetch.fetch')
  def test_fetch_error(self, fetch_mock):
    """Test fetch error"""
    fetch_mock.side_effect = urlfetch_errors.DeadlineExceededError
    with mock.patch.multiple(self.testable_cls, ENDPOINT='endpoint'):
      testable_obj = self.testable_cls()
      self.assertRaises(
          integrations_errors.HttpError,
          testable_obj._perform_request,
          'some_url')

  @mock.patch('ggrc.integrations.client.urlfetch.fetch')
  def test_not_expected_status(self, fetch_mock):
    """Test not expected status error"""
    fetch_mock.return_value = ObjectDict({
        'status_code': 500,
        'content': '{"status": "Server error"}'
    })
    with mock.patch.multiple(self.testable_cls, ENDPOINT='endpoint'):
      testable_obj = self.testable_cls()
      self.assertRaises(
          integrations_errors.HttpError,
          testable_obj._perform_request,
          'some_url')

  @ddt.data(400, 401, 403, 404, 405, 406, 500)
  @mock.patch('ggrc.integrations.client.urlfetch.fetch')
  def test_get_issue_raises_exception(self, error_code, fetch_mock):
    """Test issues.Client raises appropriate exception for error codes"""
    fetch_mock.return_value = ObjectDict({
        'status_code': error_code,
        'content': '{"status": "content"}'
    })
    with mock.patch.multiple(self.testable_cls, ENDPOINT='endpoint'):
      self.assertRaises(
          integrations_errors.HttpError,
          issues.Client().get_issue,
          'some_id'
      )


class JsonClientTest(unittest.TestCase):
  """Test for Json Client"""

  def setUp(self):
    self.testable_cls = client.JsonClient

  def test_perform_request(self):
    """Test request performing"""
    with mock.patch.object(client.BaseClient, '_perform_request',
                           return_value='{"a": 1}'):
      testable_obj = self.testable_cls()
      actual = testable_obj._perform_request('url',
                                             method='GET',
                                             payload=[1, 2])
      self.assertDictEqual(actual, {'a': 1})
      client.BaseClient._perform_request.assert_called_once_with(
          'url', method='GET', payload='[1, 2]',
          headers={'Content-Type': 'application/json'})

  def test_json_format_error(self):
    """Test JSON format error"""
    with mock.patch.object(client.BaseClient, '_perform_request',
                           return_value=None):
      testable_obj = self.testable_cls()
      with self.assertRaises(integrations_errors.BadResponseError):
        testable_obj._perform_request(
            'url', method='GET', payload=[1, 2],
            headers={'key1': '_perform_request'})
        client.BaseClient._perform_request.assert_called_once_with(
            'url', method='GET', payload='[1, 2]',
            headers={'Content-Type': 'application/json', 'key1': 'val1'})


class PersonClientTest(unittest.TestCase):
  """Test for Person Client"""

  def setUp(self):
    self.testable_cls = client.PersonClient

  def test_search(self):
    """Test search persons request"""
    with mock.patch.multiple(
        self.testable_cls,
        ENDPOINT='endpoint',
        _post=mock.MagicMock(return_value={'persons': 'persons data'})
    ):
      testable_obj = self.testable_cls()
      actual = testable_obj.search_persons([
          'u1',
          'u2',
      ])

      self.assertEqual(actual, 'persons data')
      testable_obj._post.assert_called_once_with(
          '/api/persons:search',
          payload={
              'usernames': [
                  'u1',
                  'u2',
              ],
          })

  def test_suggest(self):
    """Test suggest persons request"""
    with mock.patch.multiple(
        self.testable_cls,
        ENDPOINT='endpoint',
        _post=mock.MagicMock(return_value={'persons': 'persons data'})
    ):
      testable_obj = self.testable_cls()
      actual = testable_obj.suggest_persons(["pit"])

      self.assertEqual(actual, 'persons data')
      testable_obj._post.assert_called_once_with(
          '/api/persons:suggest',
          payload={
              'tokens': ['pit'],
          })
