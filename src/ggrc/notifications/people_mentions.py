# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

""" Module with methods for notifications on people mentions."""

import re
from collections import defaultdict
from collections import namedtuple
from logging import getLogger
from email.utils import parseaddr
from urlparse import urljoin

import flask
from sqlalchemy.orm import load_only

from ggrc import models
from ggrc import settings
from ggrc import utils
from ggrc.app import db
from ggrc.gcalendar import utils as calendar_utils
from ggrc.notifications.common import send_mentions_bg
from ggrc.notifications import data_handlers
from ggrc.utils import user_generator, get_url_root


logger = getLogger(__name__)

EMAIL_REGEXP = r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
EMAIL_LINK_REGEXP = r"mailto:" + EMAIL_REGEXP
DEFAULT_PERSON = u"Unknown"

CommentData = namedtuple("CommentData",
                         ["comment_text", "author", "created_at"])


def handle_comment_mapped(obj, comments):
  """Send mentions in the comments in the bg task.

  Args:
      obj: object for which comments were created,
      comments: A list of comment objects.
  """
  comments_data = _fetch_comments_data(comments)

  if obj.__class__.__name__ == "CycleTaskGroupObjectTask":
    url = calendar_utils.get_cycle_tasks_url_by_slug(obj.slug)
  else:
    url = urljoin(get_url_root(), utils.view_url_for(obj))

  models.background_task.create_task(
      name="send_mentions_bg",
      url=flask.url_for("send_mentions_bg"),
      parameters={
          "comments_data": comments_data,
          "object_name": obj.title,
          "href": url,
      },
      queued_callback=send_mentions_bg,
  )


def _fetch_comments_data(comments):
  """Fetches comments and people data from db and creates list of
     CommentsData tuples.

   Args:
     comments - list of Comment objects

   Returns:
     a list of CommentData named tuples.
  """
  comments_loaded = db.session.query(models.Comment).options(
      load_only(
          models.Comment.description,
          models.Comment.created_at,
          models.Comment.modified_by_id,
      )
  ).filter(
      models.Comment.id.in_([comment.id for comment in comments])
  ).all()

  people = db.session.query(models.Person).filter(
      models.Person.id.in_([comment.modified_by_id
                            for comment in comments_loaded])
  ).all()
  people_dict = {person.id: person.email for person in people}

  comments_data = [
      CommentData(
          comment_text=comment.description,
          author=people_dict.get(comment.modified_by_id, DEFAULT_PERSON),
          created_at=comment.created_at
      )
      for comment in comments_loaded
  ]
  return comments_data


def send_mentions(object_name, href, comments_data):
  """Send emails for people mentions.

    Params:
      object_name: object title,
      href: link to the object,
      comments_data: set of CommentData named tuples.
  """
  from ggrc.notifications.common import send_email

  email_mentions = _find_email_mentions(comments_data)

  for email, related_comments_data in email_mentions.iteritems():
    title, email_comments = _generate_mention_email(
        object_name, related_comments_data
    )
    body = settings.EMAIL_MENTIONED_PERSON.render(person_mention={
        "comments": email_comments,
        "url": href,
    })
    send_email(email, title, body)
  db.session.commit()


def _extract_email(email_match):
  """Extracts email address from regexp match.

    Params:
      email_match: Match of EMAIL_REGEXP regexp.

    Returns:
      Email address from the match.
  """
  email_parsed = parseaddr(email_match.group())[1]
  return email_parsed


def _find_email_mentions(comments_data):
  """Find mentions of user email in the comment data.
     If a user email is not registered in the app, the user will be created
     via external service and a Creator role would be granted to this user.

    Params:
      comments_data: list of CommentData named tuples.

    Returns:
      a default dict with keys equals to mentioned user email and values
      equals to a set of related CommentData.
  """
  link_pattern = re.compile(EMAIL_LINK_REGEXP)

  email_mentions = defaultdict(list)
  for comment in comments_data:
    comment_email_mentions = dict()
    for match in link_pattern.finditer(comment.comment_text):
      email = _extract_email(match)
      person = user_generator.find_user(email)
      if not person:
        continue
      comment_email_mentions[email] = comment
    for email, matched_comment in comment_email_mentions.iteritems():
      email_mentions[email].append(matched_comment)
  return email_mentions


def _generate_mention_email(object_name, comments_data):
  """Generate title and body of the email.

   Params:
      object_name: name of the object in which person was mentioned,
      comments_data: a set of CommentData named tuples.

   Returns:
       title: email title
       body: email body
  """

  # The only way to pass the list of different comments here - is via import.
  # All comments created via import are authored by one user. This is why
  # it is safe to use any author in the email title.
  author = next(iter(comments_data)).author
  title = u"{author} mentioned you on a comment within {object_name}".format(
      author=author,
      object_name=object_name,
  )

  body_template = (
      u"{author} mentioned you on a comment within {object_name} "
      u"at {created_at}:\n"
      u"{comment_text}\n"
  )

  body = []
  for comment in sorted(comments_data):
    body.append(body_template.format(
        author=comment.author,
        object_name=flask.escape(object_name),
        created_at=data_handlers.as_user_time(comment.created_at),
        comment_text=comment.comment_text,
    ))
  return title, body
