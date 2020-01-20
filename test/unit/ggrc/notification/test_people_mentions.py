# -*- coding: utf-8 -*-

# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Test people mentions notifications."""

import datetime
import unittest

import ddt
import mock

from ggrc import settings
from ggrc.notifications import people_mentions


@ddt.ddt
class TestSendMentions(unittest.TestCase):
  """Test people mentions notifications."""

  @ddt.data(
      u"какой-то комментарий",
      u"Some comment",
  )
  def test_generate_mention_email(self, comment_text):
    """Test email generation."""
    comments_data = set()
    comments_data.add(
        people_mentions.CommentData(
            author="other@example.com",
            created_at=datetime.datetime(2017, 07, 10, 7, 31, 42),
            comment_text=comment_text,
        )
    )
    # pylint: disable=protected-access
    title, body = people_mentions._generate_mention_email(
        object_name="Object1",
        comments_data=comments_data,
    )
    expected_title = (u"other@example.com mentioned you "
                      u"on a comment within Object1")
    expected_body = (
        u"other@example.com mentioned you on a comment within Object1 "
        u"at 07/10/2017 00:31:42 PDT:\n" + comment_text + "\n"
    )
    self.assertEquals(title, expected_title)
    self.assertEquals(body, [expected_body])

  def test_find_mentions_one_per_user(self):
    """Test finding of people mentions."""
    comment_text = (
        u"<a href=\"mailto:user@example.com\"></a>"
        u"<a href=\"mailto:user@example.com\"></a>"
        u"<a href=\"mailto:user2@example.com\"></a>"
    )
    comment = people_mentions.CommentData(
        author="author@example.com",
        created_at=datetime.datetime(2017, 1, 10, 7, 31, 42),
        comment_text=comment_text,
    )
    with mock.patch("ggrc.utils.user_generator.find_user", return_value=True):
      # pylint: disable=protected-access
      email_mentions = people_mentions._find_email_mentions([comment])
    self.assertEquals(len(email_mentions), 2)
    self.assertTrue(u"user@example.com" in email_mentions)
    self.assertTrue(u"user2@example.com" in email_mentions)
    self.assertEquals(len(email_mentions[u"user@example.com"]), 1)
    self.assertEquals(len(email_mentions[u"user2@example.com"]), 1)

    first_email_elem = next(iter(email_mentions[u"user@example.com"]))
    self.assertEquals(first_email_elem, comment)

    second_email_elem = next(iter(email_mentions[u"user2@example.com"]))
    self.assertEquals(second_email_elem, comment)

  def test_find_mentions_in_comments(self):
    """Test find people mentions in several comments."""
    comment_text = (
        u"<a href=\"mailto:user@example.com\">one</a>"
        u"<a href=\"mailto:user@example.com\">two</a>"
        u"<a href=\"mailto:user2@example.com\">three</a>"
    )
    first_comment = people_mentions.CommentData(
        author="author@example.com",
        created_at=datetime.datetime(2017, 1, 10, 7, 31, 42),
        comment_text=comment_text,
    )
    second_comment = people_mentions.CommentData(
        author="author@example.com",
        created_at=datetime.datetime(2017, 1, 10, 7, 31, 42),
        comment_text=comment_text,
    )
    with mock.patch("ggrc.utils.user_generator.find_user", return_value=True):
      # pylint: disable=protected-access
      email_mentions = people_mentions._find_email_mentions([first_comment,
                                                             second_comment])
    self.assertEquals(len(email_mentions), 2)
    self.assertEquals(len(email_mentions[u"user@example.com"]), 2)
    self.assertEquals(len(email_mentions[u"user2@example.com"]), 2)

  def test_find_email_mentions_regex(self):
    """Test email regex in find mention function."""
    comment_text = (
        u"<a href=\"mail:{user1@example.com}\"></a>"
        u"<a href=\"mailto:{user2@example.com}\"></a>"
        u"<a url=\"mailto{user3@example.com}\"></a>"
        u"<a href=\"mailto:{user4@example@.com}\"></a>"
    )
    comment = people_mentions.CommentData(
        author="author@example.com",
        created_at=datetime.datetime(2018, 1, 10, 7, 31, 42),
        comment_text=comment_text,
    )
    with mock.patch("ggrc.utils.user_generator.find_user", return_value=True):
      # pylint: disable=protected-access
      email_mentions = people_mentions._find_email_mentions([comment])
    self.assertEquals(len(email_mentions), 0)

  def test_find_email_mentions_mult(self):
    """Test finding several mentions in comments."""
    first_comment = people_mentions.CommentData(
        author="author@example.com",
        created_at=datetime.datetime(2018, 1, 10, 7, 31, 42),
        comment_text=u"One <a href=\"mailto:user@example.com\"></a>",
    )
    second_comment = people_mentions.CommentData(
        author="author@example.com",
        created_at=datetime.datetime(2018, 1, 10, 7, 31, 50),
        comment_text=u"Two <a href=\"mailto:user@example.com\"></a>",
    )
    comments = [first_comment, second_comment]
    with mock.patch("ggrc.utils.user_generator.find_user", return_value=True):
      # pylint: disable=protected-access
      email_mentions = people_mentions._find_email_mentions(comments)
    self.assertEquals(len(email_mentions), 1)
    self.assertTrue(u"user@example.com" in email_mentions)
    self.assertEquals(len(email_mentions[u"user@example.com"]), 2)
    related_comments = sorted(list(email_mentions[u"user@example.com"]))
    comments = sorted(comments)
    self.assertEquals(related_comments[0], comments[0])
    self.assertEquals(related_comments[1], comments[1])

  @mock.patch("ggrc.notifications.common.send_email")
  # pylint: disable=no-self-use
  def test_send_mentions(self, send_email_mock):
    """Test sending mentions emails."""
    comments_data = set()
    comments_data.add(
        people_mentions.CommentData(
            author="author@example.com",
            created_at=datetime.datetime(2018, 1, 10, 7, 31, 42),
            comment_text=u"One <a href=\"mailto:user@example.com\"></a>",
        )
    )
    comments_data.add(
        people_mentions.CommentData(
            author="author@example.com",
            created_at=datetime.datetime(2018, 1, 10, 7, 31, 50),
            comment_text=u"Two <a href=\"mailto:user@example.com\"></a>",
        )
    )
    with mock.patch("ggrc.utils.user_generator.find_user", return_value=True):
      people_mentions.send_mentions(
          object_name="Object",
          href="api/objects/1",
          comments_data=comments_data
      )
    expected_title = (u"author@example.com mentioned you "
                      u"on a comment within Object")
    body = settings.EMAIL_MENTIONED_PERSON.render(person_mention={
        "comments": [
            (u"author@example.com mentioned you on a comment within Object "
             u"at 01/09/2018 23:31:42 PST:\n"
             u"One <a href=\"mailto:user@example.com\"></a>\n"),
            (u"author@example.com mentioned you on a comment within Object "
             u"at 01/09/2018 23:31:50 PST:\n"
             u"Two <a href=\"mailto:user@example.com\"></a>\n"),
        ],
        "url": "api/objects/1",
    })
    send_email_mock.assert_called_once_with(u"user@example.com",
                                            expected_title, body)
