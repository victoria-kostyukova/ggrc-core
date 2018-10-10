# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""List of all error and warning messages for gdrive."""

GDRIVE_UNAUTHORIZED = u"Unable to get valid credentials."

UNABLE_GET_TOKEN = u"Unable to get token. {}"

BROKEN_OAUTH_FLOW = u"Broken OAuth2 flow, go to /auth_gdrive first."

WRONG_FLASK_STATE = u"Wrong state."

WRONG_FILE_FORMAT = (u"The file is not in a recognized format. Please import "
                     u"a Google sheet or a file in .csv format.")

INTERNAL_SERVER_ERROR = (u"Processing of the file failed due "
                         u"to internal server error.")

MISSING_KEYS = (u"Unable to validate gdrive api "
                u"response: missed keys {}.")

GOOGLE_API_MESSAGE_MAP = {
    u"The user does not have sufficient permissions for this file.":
        (u"You do not have access to create or edit in the attach folder, "
         u"please request edit access from folder owner.")
}
