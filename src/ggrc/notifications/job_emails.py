# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>


"""  Import/Export notifications """

from urlparse import urljoin

from ggrc import settings
from ggrc.notifications import common

IMPORT_COMPLETED = {
    "title": u"{filename} was imported successfully",
    "body": u"Go to import page to check details or submit new import "
            u"request.",
    "url": u"import"
}

IMPORT_BLOCKED = {
    "title": u"Could not import {filename} due to warnings",
    "body": u"Go to import page to check details or submit new import "
            u"request.",
    "url": u"import"
}

IMPORT_FAILED = {
    "title": u"Could not import {filename} due to errors",
    "body": u"Go to import page to check details or submit new import "
            u"request.",
    "url": u"import"
}

EXPORT_COMPLETED = {
    "title": u"{filename} was exported successfully",
    "body": u"Go to export page to download the result.",
    "url": u"export"
}

EXPORT_FAILED = {
    "title": u"Your GGRC export request did not finish due to errors",
    "body": u"Please follow the link to write to sheets or download .csv",
    "url": u"export"
}


def send_email(template, user_email, url_root, filename="", ie_id=None):
  """ Send email """
  subject = template["title"].format(filename=filename)

  url = urljoin(url_root, template["url"])
  if ie_id is not None:
    url = "{}#!&job_id={}".format(url, str(ie_id))

  data = {
      "body": template["body"],
      "url": url,
      "title": subject
  }
  body = settings.EMAIL_IMPORT_EXPORT.render(import_export=data)
  common.send_email(user_email, subject, body)
