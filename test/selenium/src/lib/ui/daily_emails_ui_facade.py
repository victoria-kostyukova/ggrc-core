# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Daily emails UI facade."""
from lib.service import emails_digest_service


def get_emails_by_user_names(user_names):
  """Get emails by user names."""
  emails_service = emails_digest_service.DailyEmailsService()
  emails_service.open_emails_digest()
  user_emails_dict = dict.fromkeys(user_names)
  for user_name in user_names:
    user_emails_dict[user_name] = emails_service.get_email_by_user_name(
        user_name)
  return user_emails_dict
