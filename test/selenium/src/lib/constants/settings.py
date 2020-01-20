# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Settings for tests launch."""
# pylint: disable=too-few-public-methods


# size of the header in px
SIZE_HEADER = 90
SIZE_PANE_HEADER = 90
SIZE_FOOTER = 40


class Section(object):
  """Section names."""
  APP = "webapp"
  LOGGING = "logging"


class Values(object):
  """Setting parameters for test launch."""
  WAIT_FOR_APP_SERVER = "wait_for_app_server"
  PORT = "port"
  LEVEL = "level"
  FORMAT = "format"
