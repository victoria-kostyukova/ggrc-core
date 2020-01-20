# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""A stub for Issue Tracker urlfetch

Setup is done in ggrc/app.py
This class mocks responses from Issue Tracker
so it can be properly tested on FE.
"""

import os
from google.appengine.api import apiproxy_stub
from google.appengine.api import apiproxy_stub_map


class FetchServiceMock(apiproxy_stub.APIProxyStub):
  """Mock for urlfetch serice"""

  def __init__(self, service_name='urlfetch'):
    super(FetchServiceMock, self).__init__(service_name)
    dirname = os.path.dirname(os.path.realpath(__file__))
    json_file = os.path.join(dirname, 'response.json')
    with open(json_file) as issue_mock:
      self.mock_response_issue = issue_mock.read()

  # pylint: disable=invalid-name
  def _Dynamic_Fetch(self, request, response):
    """Process request to urlfetch serice"""
    print "Request:"
    print ("Request: {}").format(request)
    response.set_content(self.mock_response_issue)
    response.set_statuscode(200)
    new_header = response.add_header()
    new_header.set_key('Content-type')
    new_header.set_value('application/json')

    response.set_finalurl(request.url)
    response.set_contentwastruncated(False)

    # allow to query the object after it is used
    # pylint: disable=attribute-defined-outside-init
    self.request = request
    self.response = response


def init_issue_tracker_mock():
  """Initialize stub for Issue Tracker response mocking"""
  fetch_mock = FetchServiceMock()
  apiproxy_stub_map.apiproxy.RegisterStub('urlfetch', fetch_mock)


def init_gae_issue_tracker_mock():
  """Initialize stub for Issue Tracker response mocking
  when launched using 'launch_gae_ggrc'."""
  # pylint: disable=protected-access

  from ggrc.utils.issue_tracker_mock import remote_stub

  urlfetch_stub = apiproxy_stub_map.apiproxy.GetStub('urlfetch')
  issue_tracker_stub = remote_stub.RemoteStub(
      urlfetch_stub._server,
      urlfetch_stub._path,
      urlfetch_stub._test_stub_map
  )
  apiproxy_stub_map.apiproxy.ReplaceStub('urlfetch', issue_tracker_stub)
