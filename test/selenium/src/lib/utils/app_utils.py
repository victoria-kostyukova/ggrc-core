# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Actions with the app that didn't fit to other places."""
from lib.rest import api_client


def workaround_edit_without_non_api_request():
  """Send some non-API request.
  This is the workaround for the following issue in the app:
  Global reader can't send PUT request for object if they haven't made
  a non-API request before. This is GGRC-6306.
  """
  # pylint: disable=invalid-name
  api_client.send_get("dashboard")
