# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Constants related to people objects"""
from lib.entities import entity

DEFAULT_EMAIL_DOMAIN = "example.com"
MIGRATOR_USER_EMAIL = "migrator@" + DEFAULT_EMAIL_DOMAIN
EXTERNAL_APP_USER = entity.PersonEntity(
    email="external_app@" + DEFAULT_EMAIL_DOMAIN)
FAKE_SUPER_USER = entity.PersonEntity(email="user@" + DEFAULT_EMAIL_DOMAIN)

UI_USER = "UI user"

_current_user = None  # pylint: disable=invalid-name
_logged_in_user_tracks = {}  # pylint: disable=invalid-name


def set_current_user(user):
  """Set user as the current user"""
  print "Set user: {}".format(user)
  # pylint: disable=invalid-name, global-statement
  global _current_user
  _current_user = user


def current_user():
  """Get current user"""
  return _current_user


def set_current_person(person):
  """Set user as the current `Person`."""
  user = entity.PersonEntity(
      id=person.obj_id, name=person.name, email=person.email,
      system_wide_role=person.global_role_name)
  set_current_user(user)


def current_person():
  """Gets current person (app_entity)."""
  from lib.app_entity_factory import person_entity_factory
  user = current_user()
  return person_entity_factory.PersonFactory().create_empty(
      obj_id=user.id, name=user.name, email=user.email,
      global_role_name=user.system_wide_role)


def set_current_logged_in_user(track, user):
  """Set user as currently logged in via `track` (e.g. UI / REST)"""
  _logged_in_user_tracks[track] = user


def current_logged_in_user(track):
  """Return user that is currently logged in via `track` (e.g. UI / REST)"""
  if track not in _logged_in_user_tracks:
    return None
  return _logged_in_user_tracks[track]


def reset_logged_in_users():
  """Clear all currently logged in users, to be invoked before each test"""
  # pylint: disable=invalid-name, global-statement
  global _logged_in_user_tracks
  _logged_in_user_tracks = {}
