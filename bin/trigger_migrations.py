# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Triggers db migration."""

from logging import getLogger

import sys
import json
import time
import requests

CUTOFF_TIME = 600

logger = getLogger(__name__)


def trigger(version, appengine_instance, access_token):
  """Triggers db migration."""
  base_url = 'https://{0}-dot-{1}.appspot.com/maintenance'.format(
      version,
      appengine_instance)

  url = base_url + '/migrate'
  post_data = {'access_token': access_token}
  response = requests.post(url, data=post_data)
  response_body = json.loads(response.text)
  logger.info("Response message : %s", response_body.get("message"))
  task_id = response_body.get("migration_task_id")

  if response.status_code == 202 and task_id:
    url = base_url + '/check_migration_status/{}'.format(task_id)
    sleep_time = 1
    while True:
      response = requests.get(url)
      response_body = json.loads(response.text)
      if response.status_code != 202:
        logger.error("Unrecognized http response : %s, %s",
                     response.text,
                     response.status_code)
        sys.exit(1)
      if response_body.get("status") == "Fail":
        print response_body.get("message")
        sys.exit(1)
      if response_body.get("status") == "Complete":
        print "Migration ran successfully"
        break

      if sleep_time > CUTOFF_TIME:
        print "Migration running for too long. Aborting periodic check."
        sys.exit(1)

      print "Migration is in progress. Retrying in {} seconds".format(
          sleep_time)
      time.sleep(sleep_time)

      sleep_time *= 2


if __name__ == "__main__":
  trigger(sys.argv[1], sys.argv[2], sys.argv[3])
