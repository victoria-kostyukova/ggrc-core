# -*- coding: utf-8 -*-
# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Unit tests for google drive file actions"""

import json

import unittest

import ddt
from mock import mock

from werkzeug.exceptions import HTTPException

from ggrc.gdrive import file_actions
from ggrc.gdrive import errors


@ddt.ddt
class TestFileActions(unittest.TestCase):
  """Tests for utility functions"""
  @mock.patch('ggrc.app.init_views')
  @ddt.data(
      # original_file_name, postfix, expected
      ('orig_file_name', '_ggrc_assessment-1',
       'orig_file_name_ggrc_assessment-1'),
      ('orig_file_name.doc', '_ggrc_assessment-1',
       'orig_file_name_ggrc_assessment-1.doc'),
      ('orig_f', '_ggrc_assessment-1', 'orig_f_ggrc_assessment-1'),
      ('or*ig_fi/le_name', '_ggrc_assessment-1',
       'or-ig_fi-le_name_ggrc_assessment-1'),
      ('orig_file_name', '_ggrc_!@#%$&^*', 'orig_file_name_ggrc_--------'),
      ('file_ggrc_control-1', '_ggrc_control-1', 'file_ggrc_control-1'),
      ("GGRC's (automation process)_ggrc", '_ggrc_control-2',
       "GGRC's (automation process)_ggrc_control-2"),
      (u'嘗試使用這個名字', '_ggrc_control-1',
       u'嘗試使用這個名字_ggrc_control-1'),
      (u'försök använda det här namnet', '_ggrc_control-1',
       u'försök använda det här namnet_ggrc_control-1'),
      (u'zkuste použít toto jméno', '_ggrc_control-1',
       u'zkuste použít toto jméno_ggrc_control-1'),
      (u'попробуйте использовать это имя', '_ggrc_control-1',
       u'попробуйте использовать это имя_ggrc_control-1'),

  )
  @ddt.unpack
  def test_generate_file_name(self, original_file_name, postfix, expected, _):
    """Test of generate_file_name function

    Copied file name should be alfanumeric + "_ ()-'"
    Copied file name should have postfix e.g (assessment-1)
    Copied file name should have file extension of the original file
    Copied file name should't have 'old' postfix e.g (assessment-1)
    """
    from ggrc.gdrive.file_actions import generate_file_name
    result = generate_file_name(original_file_name, postfix, separator='_ggrc')
    self.assertEquals(expected, result)

  @mock.patch('ggrc.app.init_views')
  @ddt.data(
      # folder_id, file_name, expected
      ('some_folder_id', 'name1', {'name': 'name1',
                                   'parents': ['some_folder_id']}),
      ('', 'name1', {'name': 'name1'}),
  )
  @ddt.unpack
  def test_build_request_body(self, folder_id, file_name, expected, _):
    """Test of _build_request_body function"""
    from ggrc.gdrive.file_actions import _build_request_body
    result = _build_request_body(folder_id, file_name)
    self.assertEquals(expected, result)

  @ddt.data(400, 401, 403, 404)
  def test_handle_http_error(self, code):
    """Test for handle http errors when {code} code"""

    ex = mock.Mock()
    ex.resp.status = code
    ex.content = json.dumps({
        "error": {"message": "message"}
    })

    with self.assertRaises(HTTPException):
      file_actions.handle_http_error(ex)

  @ddt.idata(errors.GOOGLE_API_MESSAGE_MAP.iteritems())
  @ddt.unpack
  def test_handle_http_error_403(self, message, map_message):
    """Test for handle http error when 403 code"""
    ex = mock.Mock()
    ex.resp.status = 403
    ex.content = json.dumps({
        "error": {"message": message}
    })
    with self.assertRaises(HTTPException) as raised_ex:
      file_actions.handle_http_error(ex)

    exception = raised_ex.exception
    self.assertEqual(exception.description, map_message)

  def test_handle_http_error_404(self):
    """Test for handle http error when 404 code"""
    error_message = errors.GOOGLE_API_V3_404_MESSAGE
    ex = mock.Mock()
    ex.resp.status = 404
    ex.content = json.dumps({
        "error": {"message": error_message}
    })
    with self.assertRaises(HTTPException) as raised_ex:
      file_actions.handle_http_error(ex)

    exception = raised_ex.exception
    self.assertEqual(exception.description, error_message)
