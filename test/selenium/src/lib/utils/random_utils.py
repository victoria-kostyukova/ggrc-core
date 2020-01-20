# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""Generate random stuff."""
import copy
import datetime
import random
import string

from lib import users
from lib.utils.string_utils import Symbols


def get_title(obj_type):
  """Returns a random title for object with type `obj_type`."""
  return "{}_{}_{}".format(obj_type, _current_time(), get_string())


def get_email(domain=users.DEFAULT_EMAIL_DOMAIN):
  """Returns a random email with domain `domain`."""
  # Only lowercase letters are used as app converts upcase to lowercase in
  # most places.
  email_allowed_chars = string.ascii_lowercase + string.digits
  email_local_part = get_string(chars=email_allowed_chars) + _current_time()
  return "{}@{}".format(email_local_part, domain)


def _current_time():
  """Returns current time, to be included into strings in order to check when
  they were created.
  """
  return datetime.datetime.now().strftime("%H%M%S.%f")[:-3]


def get_string(size=15, chars=Symbols().special_chars):
  """Returns string of size `size` that consists of characters `chars`.
  """
  chars_copy = copy.deepcopy(chars)
  array = []
  for _ in range(size):
    rand_char = random.choice(chars_copy)
    chars_copy = chars_copy.replace(rand_char, "")
    array.append(rand_char)
  return ''.join(array)
