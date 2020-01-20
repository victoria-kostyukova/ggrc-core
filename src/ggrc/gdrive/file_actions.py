# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""File action utitlities for GDrive module"""

from StringIO import StringIO
from logging import getLogger
from os import path

from apiclient import discovery
from apiclient import http
from apiclient.errors import HttpError
from flask import json
from oauth2client.client import HttpAccessTokenRefreshError

from werkzeug.exceptions import (
    abort,
    BadRequest,
    InternalServerError
)

from ggrc.converters.import_helper import read_csv_file
from ggrc.gdrive import get_http_auth
from ggrc.gdrive import handle_token_error
from ggrc.gdrive import errors

API_SERVICE_NAME = 'drive'
API_VERSION = 'v3'

ALLOWED_FILENAME_CHARS = "_ ()-'"

logger = getLogger(__name__)


def handle_http_error(ex):
  """Helper for http error handling"""
  code = ex.resp.status
  message = json.loads(ex.content).get("error").get("message")

  if code == 403:
    message = errors.GOOGLE_API_MESSAGE_MAP.get(message, message)
  if code == 400:
    logger.warning(message)
    message = errors.WRONG_FILE_FORMAT
  if code == 404:
    message = errors.GOOGLE_API_V3_404_MESSAGE

  raise abort(code, description=message)


def create_gdrive_file(csv_string, filename):
  """Post text/csv data to a gdrive file"""
  http_auth = get_http_auth()
  try:
    drive_service = discovery.build(API_SERVICE_NAME, API_VERSION,
                                    http=http_auth)
    # make export to sheets
    file_metadata = {
        'name': filename,
        'mimeType': 'application/vnd.google-apps.spreadsheet'
    }
    media = http.MediaInMemoryUpload(csv_string,
                                     mimetype='text/csv',
                                     resumable=True)
    result = drive_service.files().create(body=file_metadata,
                                          media_body=media,
                                          fields='id, name, parents').execute()
    return result
  except HttpAccessTokenRefreshError:
    handle_token_error()
  except HttpError as ex:
    handle_http_error(ex)


def get_gdrive_file(file_data):
  """Get text/csv data from gdrive file"""
  csv_data, _, _ = get_gdrive_file_data(file_data)
  return csv_data


def get_gdrive_file_data(file_data):
  """Get text/csv data from gdrive file"""
  http_auth = get_http_auth()
  try:
    drive_service = discovery.build(API_SERVICE_NAME, API_VERSION,
                                    http=http_auth)
    # check file type
    file_meta = drive_service.files().get(fileId=file_data['id']).execute()
    if file_meta.get('mimeType') == 'text/csv':
      file_data = drive_service.files().get_media(
          fileId=file_data['id']).execute()
    else:
      file_data = drive_service.files().export_media(
          fileId=file_data['id'], mimeType='text/csv').execute()
    csv_data = read_csv_file(StringIO(file_data))
  except AttributeError:
    # when file_data has no splitlines() method
    raise BadRequest(errors.WRONG_FILE_FORMAT)
  except HttpAccessTokenRefreshError:
    handle_token_error('Try to reload /import page')
  except HttpError as ex:
    handle_http_error(ex)
  except Exception as ex:
    logger.error(ex.message)
    raise InternalServerError(errors.INTERNAL_SERVER_ERROR)
  return csv_data, file_data, file_meta.get('name')


def copy_file_request(drive_service, file_id, body):
  """Send copy request to gdrive"""
  response = drive_service.files().copy(
      fileId=file_id,
      body=body,
      fields='id,webViewLink,name'
  ).execute()
  return response


def rename_file_request(drive_service, file_id, body):
  """Send rename request to gdrive"""
  return drive_service.files().update(
      fileId=file_id,
      body=body,
      fields='id,webViewLink,name'
  ).execute()


def add_folder_request(drive_service, file_id, folder_id):
  """Send add folder request to gdrive"""
  return drive_service.files().update(
      fileId=file_id,
      addParents=folder_id,
      fields='webViewLink'
  ).execute()


def validate_response(response):
  """Validate response from gdrive API"""
  missed_keys = []
  if 'id' not in response:
    missed_keys.append('id')
  if 'webViewLink' not in response:
    missed_keys.append('webViewLink')
  if 'name' not in response:
    missed_keys.append('name')

  if missed_keys:
    keys = ', '.join(missed_keys)
    raise InternalServerError(errors.MISSING_KEYS.format(keys))


def _generate_new_file_name(files_list, original_name, folder_id, idx=0):
  """
  Generate new file name if file with name {original_name} already exists
  in folder with id {folder_id}

  Examples: If "Name1" already exists in the folder, than "Name1 (1)" will be
  return.

  Args:
    files_list: list if files from GDrive containing {original_name} in name
    original_name: original name of the file to be uploaded
    folder_id: id of folder to upload file
    idx: index applying to file name

  Returns:
    New name for file if {original_name} already exists in folder.
  """
  file_format = "{} ({})"
  for file_ in files_list:
    if folder_id in file_.get('parents'):
      if (not idx and file_.get('name') == original_name) or\
          (idx and
           file_.get('name') == file_format.format(original_name, idx)):
        return _generate_new_file_name(files_list, original_name, folder_id,
                                       idx + 1)
  if idx > 0:
    return file_format.format(original_name, idx)
  return original_name


def process_gdrive_file(file_id, folder_id, is_uploaded=False):
  """Process gdrive file to new folder"""
  http_auth = get_http_auth()
  try:
    drive_service = discovery.build(
        API_SERVICE_NAME, API_VERSION, http=http_auth)
    file_meta = drive_service.files().get(
        fileId=file_id,
        fields='id,webViewLink,name'
    ).execute()
    if is_uploaded:
      response = file_meta
    else:
      response = drive_service.files().list(
          q="name contains '{}'".format(file_meta['name']),
          spaces='drive',
          fields='files(parents, name)').execute()
      file_name = _generate_new_file_name(response.get('files', []),
                                          file_meta['name'],
                                          folder_id)
      body = _build_request_body(folder_id, file_name)
      response = copy_file_request(drive_service, file_id, body)
    validate_response(response)
  except HttpAccessTokenRefreshError:
    handle_token_error()
  except HttpError as ex:
    handle_http_error(ex)
  except Exception as ex:
    logger.error(ex.message)
    raise InternalServerError(errors.INTERNAL_SERVER_ERROR)
  return response


def get_gdrive_file_link(file_id):
  """Returns file link"""
  http_auth = get_http_auth()
  try:
    drive_service = discovery.build(
        API_SERVICE_NAME, API_VERSION, http=http_auth)
    file_meta = drive_service.files().get(fileId=file_id,
                                          fields='webViewLink').execute()
  except HttpAccessTokenRefreshError:
    handle_token_error()
  except HttpError as ex:
    handle_http_error(ex)
  except Exception as ex:
    logger.error(ex.message)
    raise InternalServerError(errors.INTERNAL_SERVER_ERROR)
  return file_meta['webViewLink']


def add_gdrive_file_folder(file_id, folder_id):
  """Add folder to gdrive file"""
  http_auth = get_http_auth()
  try:
    drive_service = discovery.build(
        API_SERVICE_NAME, API_VERSION, http=http_auth)
    response = add_folder_request(drive_service, file_id, folder_id)
  except HttpAccessTokenRefreshError:
    handle_token_error()
  except HttpError as ex:
    handle_http_error(ex)
  except Exception as ex:
    logger.error(ex.message)
    raise InternalServerError(errors.INTERNAL_SERVER_ERROR)
  return response['webViewLink']


def _build_request_body(folder_id, new_file_name):
  """Helper for generate request body"""
  body = {'name': new_file_name}
  if folder_id:
    body['parents'] = [folder_id]
  return body


def generate_file_name(original_name, postfix, separator):
  """Helper for sanitize filename"""
  original_name, extension = path.splitext(original_name)
  # remove an old postfix
  original_name = original_name.split(separator)[0]
  new_name = ''.join([original_name, postfix]).strip('_')
  # sanitize file name
  new_name = ''.join([char if char.isalnum() or char in ALLOWED_FILENAME_CHARS
                      else '-' for char in new_name]
                     )
  return new_name + extension
