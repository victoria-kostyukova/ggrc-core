# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Pool to hold requests sessions."""
import json

import requests

from lib import url as url_module
from lib.utils import date_utils

BASIC_HEADERS = {"X-Requested-By": "GGRC",
                 "Content-Type": "application/json",
                 "Accept-Encoding": "gzip, deflate, br"}


EXTERNAL_HEADERS = {
    'X-ggrc-user': {'email': 'external_app@example.com'},
    'Content-Type': 'application/json',
    'X-Requested-By': 'GGRC',
    'X-Appengine-Inbound-Appid': 'ext_app.com',
    'X-external-user': {'email': None, 'user': None}}


_sessions = {}  # pylint: disable=invalid-name


def get_session(user, is_external=False):
  """Returns a requests Session for the `user`."""
  try:
    value = _sessions[user.email]
  except KeyError:
    value = create_session(user, is_external=is_external)
    _sessions[user.email] = value
  return value


def create_session(user, is_external=False):
  """Creates a new requests Session for the `user`."""
  import copy
  session = requests.Session()
  if is_external:
    session.headers = copy.deepcopy(EXTERNAL_HEADERS)
    session.headers["X-external-user"]["email"] = user.email
    session.headers["X-external-user"]["user"] = user.name
    session.headers["X-external-user"] = json.dumps(
        session.headers["X-external-user"])
    session.headers["X-ggrc-user"] = json.dumps(session.headers["X-ggrc-user"])
  else:
    session.headers = copy.deepcopy(BASIC_HEADERS)
    session.headers["x-usertimezoneoffset"] = (
        date_utils.user_timezone_offset_min_str())
    _set_login_cookie(session, user)
  return session


def _set_login_cookie(session, user):
  """Sets dev_appserver_login and session cookies."""
  session.get(url_module.Urls().gae_login(user))
  session.get(url_module.Urls().login)


def reset_sessions():
  """Clears all sessions, to be invoked before each test."""
  # pylint: disable=invalid-name, global-statement
  global _sessions
  _sessions = {}
