# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Test /suggest REST API
"""

import ddt
import mock

from ggrc.integrations.client import PersonClient

from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc.models import factories


@ddt.ddt
class TestSuggest(TestCase):
  """Test /suggest REST API"""

  def setUp(self):
    super(TestSuggest, self).setUp()
    self.api = Api()

  @ddt.data((' prefix ', ['prefix']),
            ('prefix', ['prefix']),
            ('Jhon Snow', ['Jhon', 'Snow']),
            ('  Jhon   Snow  ', ['Jhon', 'Snow']))
  @ddt.unpack
  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  def test_suggest(self, prefix, expected):
    """Test suggest logic."""
    query = '/people/suggest?prefix={}'.format(prefix)
    with mock.patch.multiple(
        PersonClient,
        _post=mock.MagicMock(return_value={'persons': [
            {
                'uri': '1912',
                'username': 'aturing',
                'personNumber': '1912',
                'firstName': 'Alan',
                'lastName': 'Turing'
            },
            {
                'uri': '1791',
                'username': 'cbabbage',
                'personNumber': '1791',
                'firstName': 'Charles',
                'lastName': 'Babbage'
            },
        ]})
    ):
      response = self.api.client.get(query)
      self.assert200(response)
      self.assertEqual(response.json, [{'name': 'Alan Turing',
                                       'email': 'aturing@example.com'},
                                       {'name': 'Charles Babbage',
                                        'email': 'cbabbage@example.com'},
                                       ])
      # pylint: disable=protected-access
      PersonClient._post.assert_called_once_with(
          '/api/persons:suggest',
          payload={'tokens': expected, }
      )

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='mock')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  def test_suggest_for_exist(self):
    """Test no suggest for exist person."""
    with factories.single_commit():
      factories.PersonFactory(email='qwerty1@example.com')
      factories.PersonFactory(email='qwerty2@example.com')
    query = '/people/suggest?prefix={}'.format('qw')
    response = self.api.client.get(query)
    self.assert200(response)
    self.assertEqual(len(response.json), 0)

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  def test_suggest_for_creation(self):
    """Test suggest in step creating new user."""
    with factories.single_commit():
      factories.PersonFactory(
          email='john_b@example.com',
          name='John Born'
      )
    query = '/people/suggest?prefix={}'.format('joh')
    with mock.patch.multiple(
        PersonClient,
        _post=mock.MagicMock(return_value={'persons': [
            {
                'uri': '1912',
                'username': 'john_b',
                'personNumber': '1912',
                'firstName': 'John',
                'lastName': 'Born'
            },
            {
                'uri': '1791',
                'username': 'john_d',
                'personNumber': '1791',
                'firstName': 'John',
                'lastName': 'Dory'
            },
        ]})
    ):
      expected_response = [
          {'name': 'John Dory', 'email': 'john_d@example.com'},
      ]
      response = self.api.client.get(query)
      self.assert200(response)
      self.assertEqual(response.json, expected_response)

  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  def test_suggest_for_editing(self,):
    """Test suggest in step editing user."""
    with factories.single_commit():
      factories.PersonFactory(
          email='john_b@example.com',
          name='John Born'
      )
      factories.PersonFactory(
          email='john_s@example.com',
          name='John Smit'
      )
    query = '/people/suggest?prefix={}&initialEmail={}'.format(
        'joh',
        "john_s@example.com"
    )
    with mock.patch.multiple(
        PersonClient,
        _post=mock.MagicMock(return_value={'persons': [
            {
                'uri': '1912',
                'username': 'john_b',
                'personNumber': '1912',
                'firstName': 'John',
                'lastName': 'Born'
            },
            {
                'uri': '1791',
                'username': 'john_d',
                'personNumber': '1791',
                'firstName': 'John',
                'lastName': 'Dory'
            },
            {
                'uri': '666',
                'username': 'john_s',
                'personNumber': '666',
                'firstName': 'John',
                'lastName': 'Smit'
            },
        ]})
    ):
      expected_response = [
          {'name': 'John Dory', 'email': 'john_d@example.com'},
          {'name': 'John Smit', 'email': 'john_s@example.com'}
      ]
      response = self.api.client.get(query)
      self.assert200(response)
      self.assertEqual(response.json, expected_response)

  @ddt.data('', '  ')
  @mock.patch('ggrc.settings.INTEGRATION_SERVICE_URL', new='endpoint')
  @mock.patch('ggrc.settings.AUTHORIZED_DOMAIN', new='example.com')
  def test_empty_prefix(self, prefix):
    """Test suggest for empty prefix."""
    query = '/people/suggest?prefix={}'.format(prefix)
    with mock.patch.multiple(
        PersonClient,
        _post=mock.MagicMock(return_value={'persons': []})
    ):
      response = self.api.client.get(query)
      self.assert200(response)
      self.assertEqual(response.json, [])
      # pylint: disable=protected-access
      PersonClient._post.assert_not_called()
