# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module provides a client implementation for Issue Tracker integration."""


from ggrc.integrations import client


class Client(client.JsonClient):
  """Issue tracker proxy Client class."""

  _BASE_PATH = '/api/issues'

  def get_issue(self, issue_id):
    """Returns issue representation by given issue ID.

    Args:
      issue_id: A numeric identifier of an issue.

    Returns:
      A dict representing an issue.
    """
    return self._get('%s/%s' % (self._BASE_PATH, issue_id))

  def update_issue(self, issue_id, params):
    """Updates issue by ID with given parameters.

    Args:
      issue_id: A numeric identifier of an issue.
      params: A dict representing new values to update issue with.

    Returns:
      A dict representing an issue.
    """
    return self._put('%s/%s' % (self._BASE_PATH, issue_id), payload=params)

  def create_issue(self, params):
    """Creates new issue with given parameters.

    Args:
      params: A dict representing new values to update issue with.

    Returns:
      A dict representing an issue.
    """
    return self._post(self._BASE_PATH, payload=params)

  def search(self, params):
    """Searches for issues by given parameters.

    Args:
      params: A dict representing search parameters.

    Returns:
      A dict representing search response.
    """
    return self._post('%s/search' % self._BASE_PATH, payload=params)
