#!/usr/bin/env python

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Utility script to get a list of pull requests merged since some tag.

Usage:
  get_pr_titles.py TAG_NAME

Tries to guess ticket ids from pull request titles.
"""


from __future__ import print_function

import argparse
import collections
import getpass
import re
import subprocess
import sys

import requests


# pylint: disable=too-few-public-methods
class AuthEnum(object):
  """Enum-like with available authentication mechanisms."""

  BASIC = "basic"
  TOKEN = "token"

  __members__ = (BASIC, TOKEN)


class TokenAuth(requests.auth.AuthBase):
  """Github Token-based authentication."""

  AUTH_TEMPLATE = "token {}"

  def __init__(self, token):
    self.token = token

  def __call__(self, r):
    r.headers["Authorization"] = self.AUTH_TEMPLATE.format(
        self.token.encode("latin1"),
    )
    return r


class PrGetter(object):
  """Github REST client to fetch PR data."""
  URL_PATTERN = "https://api.github.com/repos/google/ggrc-core/issues/{id}"

  def __init__(self, auth):
    self.session = requests.Session()
    self.auth = auth

  @classmethod
  def _make_pr_url(cls, pr_id):
    return cls.URL_PATTERN.format(id=pr_id)

  def get_pr(self, pr_id):
    """Fetch JSON description for PR by its id"""
    response = self.session.get(self._make_pr_url(pr_id),
                                auth=self.auth)
    if response.status_code != 200:
      raise ValueError(u"Expected HTTP200 response, found "
                       u"status_code={status_code}, text={text}"
                       .format(status_code=response.status_code,
                               text=response.text))
    return response.json()


def parse_argv(argv):
  """Get argv and return a parsed arguments object.

  Supported arguments:
    previous_release_tag (str)
    --upstream (str, default "upstream")
    --branch (str, default "release/0.10-Raspberry")
    --auth (str, default AuthEnum.TOKEN)
  """
  parser = argparse.ArgumentParser(
      description="Get PR titles from current release",
  )
  parser.add_argument("previous_release_tag", type=str,
                      help="The name of the previous release tag")
  parser.add_argument("--upstream", type=str, default="upstream",
                      help="The name of the main git remote, "
                           "default 'upstream'")
  parser.add_argument("--branch", type=str, default="release/0.10-Raspberry")
  parser.add_argument("--auth", type=str, choices=AuthEnum.__members__,
                      default=AuthEnum.TOKEN)

  return parser.parse_args(argv)


def git_diff(upstream, branch, tag):
  """Get git diff --oneline between tag and latest upstream/branch."""
  subprocess.check_call(["git", "fetch", upstream, branch])

  tag_string = "refs/tags/{tag}:refs/tags/{tag}".format(tag=tag)
  subprocess.check_call(["git", "fetch", upstream, tag_string])

  log_target = "{tag}..{upstream}/{branch}".format(
      tag=tag,
      upstream=upstream,
      branch=branch,
  )
  return subprocess.check_output(["git", "log", "--oneline", log_target])


def get_pr_ids(message_list):
  """Get PR ids from git log --oneline output (skip non-merge lines)."""
  merge_commit_pattern = r"Merge pull request #(?P<id>\d+)"
  for line in message_list:
    match = re.search(merge_commit_pattern, line)
    if match:
      yield match.group("id")


def try_parse_ticket_ids(title):
  """Get ticket id from PR title.

  Assumptions:
    - ticket id or special prefix before PR title
    - no whitespace before ticket id
    - whitespace between ticket id and PR title

  Transformations (for the worst case):
    "ggrc-1234/1235: Do something" -> ["GGRC-1234", "GGRC-1235"]

  Special prefixes:
    "QUICK-FIX", "DOCS", "MERGE", "BACKMERGE"

  Returns:
    a list of string ticket ids.
  """
  ticket = title.split()[0]
  ticket = ticket.upper()
  ticket = ticket.rstrip(":")

  if ticket in ("QUICK-FIX", "DOCS", "MERGE", "BACKMERGE"):
    return [ticket]

  ticket = ticket.replace("/", ",")
  tickets = []
  for ticket in ticket.split(","):
    if not ticket.startswith("GGRC-"):
      ticket = "GGRC-" + ticket
    tickets.append(ticket)

  return tickets


def parse_ticket_labels(labels):
  """Get a generator that returns names of labels passed if any."""
  if not labels:
    return []
  return (label.get("name") for label in labels)


def print_table(item_type, items):
  """Print list of named tuples in table form.

  The title row is taken from namedtuple field list.
  """
  header = item_type(*item_type._fields)

  max_widths = [max(len(unicode(v)) for v in column)
                for column in zip(*items)]

  print_unicode(u" | ".join(u"{0:{width}}".format(field, width=width)
                            for field, width in zip(header, max_widths)))
  print_unicode(u"-|-".join(u"-" * width for width in max_widths))

  for item in items:
    print_unicode(u" | ".join(u"{0:{width}}".format(field, width=width)
                              for field, width in zip(item, max_widths)))


def print_unicode(line):
  """A wrapper to print data encoded as UTF-8 manually.

  The manual encoding is required to print to pipes which accept ASCII only.
  """
  print(line.encode("UTF-8"))


def check_tickets(tickets):
  """Splits ticket ids into valid and special/malformed."""
  valid_ticket_re = re.compile(r"GGRC-\d+")

  valid = (ticket for ticket in tickets if valid_ticket_re.match(ticket))
  invalid = (ticket for ticket in tickets if not valid_ticket_re.match(ticket))

  return valid, invalid


def print_pr_details(pr_details):
  """Print PR list summary in table format.

  For each PR, try to guess ticket id(s) and print a table with columns:
    - PR id
    - ticket id(s) comma-separated
    - assignee username or "None"
    - milestone name or "None"
    - labels list
    - PR title

  Also print a Jira-friendly list of ticket ids guessed from the PRs.
  """
  assumed_tickets = set()
  ok_labels = {"cla: no",
               "cla: yes",
               "new contribution",
               "next release",
               "please review"}

  row_tuple = collections.namedtuple(
      "Row",
      ["id", "ticket", "assignee", "milestone", "labels", "title"],
  )
  rows = []

  for id_, details in pr_details.iteritems():
    tickets = try_parse_ticket_ids(details.get("title"))
    labels = set(parse_ticket_labels(details.get("labels"))) - ok_labels
    assumed_tickets.update(tickets)
    rows.append(row_tuple(
        id=str(id_),
        ticket=", ".join(tickets),
        assignee=(details.get("assignee") or {}).get("login"),
        milestone=(details.get("milestone") or {}).get("title"),
        title=details.get("title"),
        labels=", ".join(labels),
    ))

  print_table(row_tuple, rows)

  valid_tickets, invalid_tickets = check_tickets(assumed_tickets)
  print_unicode("")
  print_unicode("Assumed ticket ids")
  print_unicode(u", ".join(valid_tickets))
  print_unicode("")
  print_unicode("Malformed/special ticket ids")
  print_unicode(u", ".join(invalid_tickets))


def main():
  """Get and print the details of pull requests merged since some tag."""
  args = parse_argv(sys.argv[1:])

  git_output = git_diff(upstream=args.upstream,
                        branch=args.branch,
                        tag=args.previous_release_tag)

  pull_request_ids = get_pr_ids(git_output.split("\n"))

  if args.auth == AuthEnum.TOKEN:
    token = getpass.getpass("Token: ")
    auth = TokenAuth(token)
  elif args.auth == AuthEnum.BASIC:
    username = raw_input("Username: ")
    password = getpass.getpass("Password: ")
    auth = requests.auth.HTTPBasicAuth(username, password)
  else:
    raise ValueError("Unexpected auth method: {}".format(args.auth))

  pr_getter = PrGetter(auth=auth)

  pull_request_details = {}
  for pull_request_id in pull_request_ids:
    pull_request_details[pull_request_id] = pr_getter.get_pr(pull_request_id)

  print_pr_details(pull_request_details)


if __name__ == "__main__":
  exit(main())
