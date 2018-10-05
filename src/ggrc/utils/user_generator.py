# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Collection of utils for login and user generation.
"""

import json

from email.utils import parseaddr
from werkzeug import exceptions

from sqlalchemy import orm

from ggrc import db, settings
from ggrc.integrations import client
from ggrc.login import get_current_user_id
from ggrc.models.person import Person
from ggrc.rbac import SystemWideRoles
from ggrc.utils import errors
from ggrc.utils.log_event import log_event
from ggrc_basic_permissions import basic_roles
from ggrc_basic_permissions.models import UserRole


def _base_user_query():
  return Person.query.options(
      orm.undefer_group('Person_complete'))


def find_user_by_id(user_id):
  """Find Person object by some ``id``.

  Note that ``id`` need not be Person().id, but should match the value
  returned by ``Person().get_id()``.
  """
  return _base_user_query().get(int(user_id))


def find_user_by_email(email):
  return _base_user_query().filter(Person.email == email).first()


def add_creator_role(user):
  """Add creator role for sent user."""
  user_creator_role = UserRole(
      person=user,
      role=basic_roles.creator(),
  )
  db.session.add(user_creator_role)
  db.session.commit()
  log_event(db.session, user_creator_role, user_creator_role.id)


def create_user(email, **kwargs):
  """Creates a user.

  Args:
    email: (string) mandatory user email
  """
  user = Person(email=email, **kwargs)
  db.session.add(user)
  db.session.flush()
  log_event(db.session, user, user.id)
  db.session.commit()
  return user


def is_authorized_domain(email):
  """Check whether user's email belongs to authorized domain"""
  # Email can have multiple @, but last one separates local and domain part
  user_domain = email.split("@")[-1]
  return user_domain.lower() == settings.AUTHORIZED_DOMAIN.lower()


def find_or_create_user_by_email(email, name, modifier=None):
  """Generates or find user for selected email."""
  user = find_user_by_email(email)
  if not user:
    if modifier:
      user = create_user(email, name=name)
    else:
      user = create_user(email,
                         name=name,
                         modified_by_id=get_current_user_id())
  if is_authorized_domain(email) and \
     user.system_wide_role == SystemWideRoles.NO_ACCESS:
    add_creator_role(user)
  return user


def search_user(email):
  """Search user by Integration Service

  Returns:
    string: user name for success, None otherwise
  """
  service = client.PersonClient()
  if is_authorized_domain(email):
    username = email.split("@")[0]
    ldaps = service.search_persons([username])
    if ldaps and ldaps[0]["username"] == username:
      return "%s %s" % (ldaps[0]["firstName"], ldaps[0]["lastName"])
  return None


def find_or_create_external_user(email, name, modifier=None):
  """Find or generate user after verification"""
  if is_external_app_user_email(email):
    return find_or_create_ext_app_user()

  if settings.INTEGRATION_SERVICE_URL == 'mock':
    return find_or_create_user_by_email(email, name, modifier)

  if settings.INTEGRATION_SERVICE_URL and search_user(email):
    return find_or_create_user_by_email(email, name, modifier)
  return None


def find_or_create_ext_app_user():
  """Find or generate external application user."""
  name, email = parseaddr(settings.EXTERNAL_APP_USER)
  user = find_user_by_email(email)
  if not user:
    user = create_user(email, name=name)
  return user


def parse_user_email(request, header, mandatory):
  """Parses a user email from the request header.

  Retrieves user email from the request header and
  validates it based on being mandatory or not.

  Args:
      request: the original request.
      header: a header name with a person email.
      mandatory: flag that header value is mandatory or not.

  Returns:
      A parsed user email.

  Raises:
     BadRequest: Raised when validation on email has failed.
  """
  user = request.headers.get(header)
  if mandatory and not user:
    raise exceptions.BadRequest(
        errors.MANDATORY_HEADER.format(header, user))
  if not user:
    return None
  try:
    user = json.loads(user)
    email = str(user["email"])
  except (TypeError, ValueError, KeyError):
    raise exceptions.BadRequest(
        errors.WRONG_PERSON_HEADER_FORMAT.format(header, user))
  return email


def find_user(email):
  """Find or generate user.

  If Integration Server is specified not found in DB user is generated
  with Creator role.
  """
  if is_external_app_user_email(email):
    return find_or_create_ext_app_user()

  if settings.INTEGRATION_SERVICE_URL == 'mock':
    return find_user_by_email(email)

  if settings.INTEGRATION_SERVICE_URL:
    name = search_user(email)
    if not name:
      return None
    return find_or_create_user_by_email(email, name)
  return find_user_by_email(email)


def find_users(emails):
  """Find or generate user.

  If Integration Server is specified not found in DB user is generated
  with Creator role.
  """
  if not settings.INTEGRATION_SERVICE_URL:
    return Person.query.filter(Person.email.in_(emails)).options(
        orm.undefer_group('Person_complete')).all()

  # Verify emails
  usernames = [email.split('@')[0] for email in emails
               if is_authorized_domain(email) and
               not is_external_app_user_email(email)]

  service = client.PersonClient()
  ldaps = service.search_persons(usernames)

  authorized_domain = getattr(settings, "AUTHORIZED_DOMAIN", "")
  verified_emails = {'%s@%s' % (ldap['username'], authorized_domain)
                     for ldap in ldaps}

  # Find users in db
  users = Person.query.filter(Person.email.in_(emails)).all()
  found_emails = {user.email for user in users}

  # Create new users
  new_emails = verified_emails - found_emails
  new_usernames = [email.split('@')[0] for email in new_emails]
  new_users = [('%s@%s' % (ldap['username'], authorized_domain),
                '%s %s' % (ldap['firstName'], ldap['lastName']))
               for ldap in ldaps if ldap['username'] in new_usernames]

  for email, name in new_users:
    user = create_user(email,
                       name=name,
                       modified_by_id=get_current_user_id())
    users.append(user)

  # Grant Creator role to all users
  for user in users:
    if user.system_wide_role == SystemWideRoles.NO_ACCESS:
      add_creator_role(user)

  return users


def is_external_app_user_email(email):
  """Checks if given user email belongs to external application.

  Args:
    email: A string email address of the user.
  """
  if not settings.EXTERNAL_APP_USER:
    return False

  _, external_app_user_email = parseaddr(settings.EXTERNAL_APP_USER)
  if not external_app_user_email:
    return False

  return external_app_user_email == email
