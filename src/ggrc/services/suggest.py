# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Suggest persons by prefix"""

import json

from flask import current_app
from flask import request
from sqlalchemy import or_
from sqlalchemy.orm import load_only

from ggrc import db
from ggrc.integrations import client
from ggrc import settings
from ggrc.models import all_models


def mock_suggest():
  """Mocks the url request for local development
     Called when INTEGRATION_SERVICE_URL=mock"""
  tokens = request.args.get("prefix", "")
  limit = request.args.get("limit", 10)
  results = all_models.Person.query\
      .filter(or_(
          all_models.Person.name.ilike('%{}%'.format(tokens)),
          all_models.Person.email.ilike('%{}%'.format(tokens))))\
      .options(load_only("name", "email"))\
      .order_by(all_models.Person.email)[:limit]
  return make_suggest_result([{
      "firstName": result.name,
      "lastName": "",
      "username": result.email.split('@')[0]
  } for result in results])


def suggest():
  """Suggest persons by prefix"""
  if not settings.INTEGRATION_SERVICE_URL:
    return make_suggest_result([])

  if settings.INTEGRATION_SERVICE_URL == 'mock':
    return mock_suggest()

  tokens = request.args.get("prefix", "").split()
  initial_email = request.args.get("initialEmail", None)
  if tokens:
    person_client = client.PersonClient()
    entries = person_client.suggest_persons(tokens)
    return make_suggest_result(entries, initial_email)
  return make_suggest_result([])


def _filter_emails(raw_suggest, initial_email):
  """Filter out persons existing in the DB from suggested people.

  Args:
    raw_suggest: a list of dicts with suggested by HR API people
    initial_email: initial email address when editing user information
  Returns:
    A list of dicts representing persons who are not in DB.
  """
  existed_emails = db.session.query(all_models.Person.email).filter(
      all_models.Person.email.in_(
          [suggest_person["email"] for suggest_person in raw_suggest]
      )
  ).all()
  existed_emails = {email for email, in existed_emails}
  filtered_suggest = []
  for suggest_person in raw_suggest:
    if suggest_person["email"] not in existed_emails:
      filtered_suggest.append(suggest_person)
  if initial_email:
    existed_person = all_models.Person.query.filter(
        all_models.Person.email == initial_email
    ).one()
    filtered_suggest.append({
        "name": existed_person.name,
        "email": existed_person.email
    })
  return filtered_suggest


def make_suggest_result(entries, initial_email=None):
  """Build suggest response"""
  domain = getattr(settings, "AUTHORIZED_DOMAIN", "")
  raw_suggest = [{
      "name": "%s %s" % (entry["firstName"], entry["lastName"]),
      "email": "%s@%s" % (entry["username"], domain),
  } for entry in entries]
  filtered_suggest = _filter_emails(raw_suggest, initial_email)
  return current_app.make_response((
      json.dumps(filtered_suggest),
      200,
      [('Content-Type', 'application/json')],
  ))
