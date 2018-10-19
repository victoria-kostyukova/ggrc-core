# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Handle the interface to GGRC models for all login methods.
"""

import flask

from ggrc import db
from ggrc.utils.log_event import log_event


def get_next_url(request, default_url):
  """Returns next url from requres or default url if it's not found."""
  if 'next' in request.args:
    next_url = request.args['next']
    return next_url
  return default_url


def commit_user_and_role(user):
  """Commits and flushes user and its role after the login."""
  db_user, db_role = None, None
  if hasattr(flask.g, "user_cache"):
    db_user = flask.g.user_cache.get(user.email, None)
  if hasattr(flask.g, "user_creator_roles_cache"):
    db_role = flask.g.user_creator_roles_cache.get(user.email, None)
  if db_user or db_role:
    db.session.flush()
    if db_user:
      log_event(db.session, db_user, db_user.id, flush=False)
    if db_role and not db_user:
      # log_event of user includes event of role creation
      log_event(db.session, db_role, flush=False)
    db.session.commit()
