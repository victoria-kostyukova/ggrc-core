# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST API client."""

import json
import urlparse

import requests

from lib import environment, url as url_module, users
from lib.constants import objects
from lib.service.rest import session_pool
from lib.service.rest.template_provider import TemplateProvider


class RestClient(object):
  """Client for HTTP interactions with GGRC's REST API."""

  STATUS_CODES = {'OK': 200,
                  'FAIL': [400, 404, 500]}

  def __init__(self, endpoint=""):
    self.endpoint = endpoint if endpoint == url_module.QUERY else (
        objects.get_singular(endpoint))
    self.is_api = "" if endpoint == url_module.QUERY else url_module.API
    self.endpoint_url = urlparse.urljoin(
        environment.app_url, "/".join([self.is_api, endpoint]))
    self.session = session_pool.get_session(users.current_user())

  def get_session(self, obj_dict):
    """Return newly create session if it is external user needed else
    session from the pool."""
    return session_pool.create_session(
        users.current_user(), is_external=True) if (
        self.is_external_user_needed(obj_dict)) else (
        session_pool.get_session(users.current_user()))

  def is_endpoint_external(self):
    """Checks if endpoint is external."""
    return self.endpoint in objects.EXTERNAL_END_POINTS

  def is_relationship_types_external(self, obj_dict):
    """Check if source or destination objects type is external."""
    return (self.endpoint == objects.get_singular(objects.RELATIONSHIPS) and
            (any(x for x in objects.ALL_SINGULAR_DISABLED_OBJS
                 if x.title() in (obj_dict["source"]["type"],
                                  obj_dict["destination"]["type"]))))

  def is_ca_external(self, obj_dict):
    """Check if custom attribute is external."""
    return (self.endpoint == objects.get_singular(
            objects.CUSTOM_ATTRIBUTES) and
            obj_dict["definition_type"] in objects.ALL_SINGULAR_DISABLED_OBJS)

  def is_external_user_needed(self, obj_dict):
    """Return True if request related to controls or GCAs for controls."""
    # pylint: disable=invalid-name
    if not self.is_api:
      return False

    obj_dict = obj_dict[0][obj_dict[0].keys()[0]] if isinstance(
        obj_dict, list) else obj_dict[obj_dict.keys()[0]]

    return (self.is_endpoint_external() or
            self.is_ca_external(obj_dict) or
            self.is_relationship_types_external(obj_dict))

  def send_get(self, url, **kwargs):
    """Send GET request to `url`"""
    url = urlparse.urljoin(environment.app_url, url)
    return self.session.get(url, **kwargs).json()

  def send_post(self, url, **kwargs):
    """Send POST request to `url`"""
    url = urlparse.urljoin(environment.app_url, url)
    return self.session.post(url, **kwargs).json()

  def create_object(self, **kwargs):
    """Create object or make other operations used POST request and
    return raw response.
    """
    kwargs.pop("type").lower()
    create_obj_req_body = self.generate_body(self.endpoint, **kwargs)
    if (
        self.is_api and self.is_external_user_needed(
            json.loads(create_obj_req_body))
    ):
      return requests.post(
          url=self.endpoint_url,
          data=create_obj_req_body,
          headers=self.get_session(json.loads(create_obj_req_body)).headers)
    else:
      return self.get_session(json.loads(create_obj_req_body)).post(
          url=self.endpoint_url, data=create_obj_req_body)

  def update_object(self, href, **kwargs):
    """Update object used GET, POST requests and return raw response."""
    href_url = urlparse.urljoin(environment.app_url, href)
    obj_resp = self.get_object(href_url)
    obj_resp_dict = json.loads(obj_resp.text)
    session = self.get_session(obj_resp_dict)
    headers_for_updation = self.req_headers_from_resp_headers(
        resp_headers=obj_resp.headers)
    update_obj_req_body = self.update_body(body=obj_resp.text, **kwargs)
    if self.is_api and self.is_external_user_needed(obj_resp_dict):
      headers_for_updation.update(session.headers)
      return requests.put(
          url=href_url, data=update_obj_req_body, headers=headers_for_updation)

    else:
      return session.put(
          url=href_url, data=update_obj_req_body, headers=headers_for_updation)

  def delete_object(self, href):
    """Delete object used GET, POST requests and return raw response."""
    href_url = urlparse.urljoin(environment.app_url, href)
    obj_resp = self.get_object(href_url)
    obj_resp_dict = json.loads(obj_resp.text)
    session = self.get_session(obj_resp_dict)
    headers_for_deleting = self.req_headers_from_resp_headers(
        resp_headers=obj_resp.headers)
    if self.is_api and self.is_external_user_needed(obj_resp_dict):
      headers_for_deleting.update(session.headers)
      return requests.delete(
          url=href_url, headers=headers_for_deleting)
    else:
      return session.delete(
          url=href_url, headers=headers_for_deleting)

  def get_object(self, href):
    """Get object used GET request and return raw response."""
    href_url = urlparse.urljoin(environment.app_url, href)
    get_obj_resp = self.session.get(url=href_url)
    return get_obj_resp

  def generate_body(self, type_name, **kwargs):
    """Generate body of HTTP request based on JSON representation."""
    body = TemplateProvider.generate_template_as_dict(
        json_tmpl_name=type_name, **kwargs)
    if not self.is_api:
      body = body[type_name]
    return json.dumps([body]).encode("string-escape")

  @staticmethod
  def req_headers_from_resp_headers(resp_headers=None):
    """Return request headers from response headers."""
    headers = {}
    if resp_headers:
      headers["If-Match"] = resp_headers["etag"]
      headers["If-Unmodified-Since"] = resp_headers["last-modified"]
    return headers

  @staticmethod
  def update_body(body, **kwargs):
    """Update body of HTTP request based on JSON representation."""
    return json.dumps(TemplateProvider.update_template_as_dict(
        json_data_str=body, **kwargs)).encode("string-escape")
