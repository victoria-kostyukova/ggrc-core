# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
Test /search REST API for Workflow objects
"""

from collections import defaultdict

import ddt

from integration.ggrc import TestCase
from integration.ggrc.api_helper import Api
from integration.ggrc_workflows.models import factories
from integration.ggrc.models.factories import single_commit


class TestWorkflowTypesBase(TestCase):
  """
  Base class for /search REST API test
  """

  def setUp(self):
    """Create API instance
    """

    super(TestWorkflowTypesBase, self).setUp()

    self.api = Api()

  def _get_search_ids(self, types, query):
    """Make request and return entries in format dict(type->list_of_ids)"""
    response, _ = self.api.search(types=types, query=query, counts=False)

    entries = response.json['results']['entries']

    ret = defaultdict(set)
    for entry in entries:
      ret[entry['type']].add(entry['id'])

    return dict(ret)

  def _get_count_ids(self, types, query):
    """Make request and return entries in format dict(type->number_of_ids)"""
    response, _ = self.api.search(types=types, query=query, counts=True)

    return response.json['results']['counts']

  def _convert_expected_to_dict(self, type_, expected):
    """Convert list of (type, title) to dict (type -> list_of_ids)"""

    ret = defaultdict(set)
    for _, key in expected:
      ret[type_].add(self.objects[key])

    return dict(ret)

  @staticmethod
  # pylint: disable=invalid-name
  def _convert_expected_dict_to_counts(expected):
    """Convert dict(type->list_of_ids) to dict(type->count_of_ids)"""

    return dict((k, len(v)) for k, v in expected.iteritems())


@ddt.ddt
class TestCycle(TestWorkflowTypesBase):
  """
  Test /search REST API
  """

  def setUp(self):
    """Create indexable objects which provide required set of fulltext attrs

    Fulltext attributes are: title, name, email, notes, description, slug
    """

    super(TestCycle, self).setUp()

    with single_commit():
      # Create cycles
      objects = [factories.CycleFactory(title=title, description=desc)
                 for title, desc in (('t01', 'd01'),
                                     ('t02', 'd02'),
                                     ('t11', 'd11'),
                                     )]
      self.objects = dict((i.title, i.id) for i in objects)

  @ddt.data(
      # search for cycles by title
      ("Cycle", "t0", (('Cycle', 't01'),
                       ('Cycle', 't02'),
                       )),
      # search for cycles by description
      ("Cycle", "d1", (('Cycle', 't11'),
                       )),
      # search for cycles by slug
      ("Cycle", "CYCLE", (('Cycle', 't01'),
                          ('Cycle', 't02'),
                          ('Cycle', 't11'),
                          )),
  )
  @ddt.unpack
  def test_search(self, type_, query, expected):
    """Test search of objects for '{0}' '{1}'"""

    exp_search = self._convert_expected_to_dict(type_, expected)
    response_search = self._get_search_ids(type_, query)
    self.assertEqual(response_search, exp_search)

    exp_count = self._convert_expected_dict_to_counts(exp_search)
    response_count = self._get_count_ids(type_, query)
    self.assertEqual(response_count, exp_count)


@ddt.ddt
class TestCycleGroup(TestWorkflowTypesBase):
  """
  Test /search REST API
  """

  def setUp(self):
    """Create indexable objects which provide required set of fulltext attrs

    Fulltext attributes are: title, name, email, notes, description, slug
    """

    super(TestCycleGroup, self).setUp()

    with single_commit():
      # Create cycles
      objects = [factories.CycleTaskGroupFactory(title=title, description=desc)
                 for title, desc in (('t01', 'd01'),
                                     ('t02', 'd02'),
                                     ('t11', 'd11'),
                                     )]
      self.objects = dict((i.title, i.id) for i in objects)

  @ddt.data(
      # search for cycles by title
      ("CycleTaskGroup", "t0", (('CycleTaskGroup', 't01'),
                                ('CycleTaskGroup', 't02'),
                                )),
      # search for cycles by description
      ("CycleTaskGroup", "d1", (('CycleTaskGroup', 't11'),
                                )),
      # search for cycles by slug
      ("CycleTaskGroup", "CYCLEGROUP", (('CycleTaskGroup', 't01'),
                                        ('CycleTaskGroup', 't02'),
                                        ('CycleTaskGroup', 't11'),
                                        )),
  )
  @ddt.unpack
  def test_search(self, type_, query, expected):
    """Test search of objects for '{0}' '{1}'"""

    exp_search = self._convert_expected_to_dict(type_, expected)
    response_search = self._get_search_ids(type_, query)
    self.assertEqual(response_search, exp_search)

    exp_count = self._convert_expected_dict_to_counts(exp_search)
    response_count = self._get_count_ids(type_, query)
    self.assertEqual(response_count, exp_count)


@ddt.ddt
class TestCycleGroupObjectTask(TestWorkflowTypesBase):
  """
  Test /search REST API
  """

  def setUp(self):
    """Create indexable objects which provide required set of fulltext attrs

    Fulltext attributes are: title, name, email, notes, description, slug
    """

    super(TestCycleGroupObjectTask, self).setUp()

    with single_commit():
      # Create cycles
      objects = [factories.CycleTaskGroupObjectTaskFactory(title=title,
                                                           description=desc)
                 for title, desc in (('t01', 'd01'),
                                     ('t02', 'd02'),
                                     ('t11', 'd11'),
                                     )]
      self.objects = dict((i.title, i.id) for i in objects)

  @ddt.data(
      # search for cycles by title
      ("CycleTaskGroupObjectTask", "t0", (('CycleTaskGroupObjectTask', 't01'),
                                          ('CycleTaskGroupObjectTask', 't02'),
                                          )),
      # search for cycles by description
      ("CycleTaskGroupObjectTask", "d1", (('CycleTaskGroupObjectTask', 't11'),
                                          )),
      # search for cycles by slug
      ("CycleTaskGroupObjectTask", "CYCLETASK",
          (('CycleTaskGroupObjectTask', 't01'),
           ('CycleTaskGroupObjectTask', 't02'),
           ('CycleTaskGroupObjectTask', 't11'),
           )),
  )
  @ddt.unpack
  def test_search(self, type_, query, expected):
    """Test search of objects for '{0}' '{1}'"""

    exp_search = self._convert_expected_to_dict(type_, expected)
    response_search = self._get_search_ids(type_, query)
    self.assertEqual(response_search, exp_search)

    exp_count = self._convert_expected_dict_to_counts(exp_search)
    response_count = self._get_count_ids(type_, query)
    self.assertEqual(response_count, exp_count)
