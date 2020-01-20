# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""A stub for urlfetch with Issue Tracker special handling

This class mocks responses from Issue Tracker
so it can be properly tested on FE and leaves all other stub functions as is.
"""
import os
import json
from google.appengine.ext.remote_api import remote_api_stub


class RemoteStub(remote_api_stub.RemoteStub):
  """Stub for urlfetch serice for Issue Tracker endpoint."""

  def __init__(self, server, path, _test_stub_map=None):
    super(RemoteStub, self).__init__(server, path, _test_stub_map)
    dirname = os.path.dirname(os.path.realpath(__file__))
    json_file = os.path.join(dirname, 'response.json')
    with open(json_file) as issue_mock:
      self.mock_response_issue = issue_mock.read()

  def MakeSyncCall(self, service, call, request, response):
    """We override this method of base class to add special
    handling for Issue Tracker endpoints."""
    self._PreHookHandler(service, call, request, response)
    try:
      test_stub = self._test_stub_map and self._test_stub_map.GetStub(service)

      if request.url().startswith('/api/issues'):
        new_header = response.add_header()
        new_header.set_key('Content-type')
        new_header.set_value('application/json')
        if request.url().endswith('/search'):
          issue_count = len(json.loads(request.payload())['issue_ids'])
          issues_list = [json.loads(self.mock_response_issue)] * issue_count
          response.set_content(json.dumps({'issues': issues_list}))
        else:
          response.set_content(self.mock_response_issue)
        response.set_statuscode(200)

        response.set_finalurl(request.url)
        response.set_contentwastruncated(False)

        # allow to query the object after it is used
        # pylint: disable=attribute-defined-outside-init
        self.request = request
        self.response = response

      elif test_stub:

        test_stub.MakeSyncCall(service, call, request, response)
      else:
        self._MakeRealSyncCall(service, call, request, response)
    finally:
      self._PostHookHandler(service, call, request, response)
