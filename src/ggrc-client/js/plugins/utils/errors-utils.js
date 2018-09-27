/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  notifier,
  notifierXHR,
  messages,
} from './notifiers-utils';

function isConnectionLost() {
  return !navigator.onLine;
}

function isExpectedError(jqxhr) {
  return !!jqxhr.getResponseHeader('X-Expected-Error');
}

function handleAjaxError(jqxhr, errorThrown = '') {
  if (!isExpectedError(jqxhr)) {
    let response = jqxhr.responseJSON;

    if (!response) {
      try {
        response = JSON.parse(jqxhr.responseText);
      } catch (e) {
        console.warn('Response not in JSON format');
      }
    }

    let message = jqxhr.getResponseHeader('X-Flash-Error') ||
      messages[jqxhr.status] ||
      (response && response.message) ||
      errorThrown.message || errorThrown;

    if (message) {
      notifier('error', message);
    } else {
      notifierXHR('error')(jqxhr);
    }
  }
}

function getAjaxErrorInfo(jqxhr, errorThrown = '') {
  let name = '';
  let details = '';

  if (jqxhr.status) {
    name += jqxhr.status;
  }

  if (jqxhr.statusText) {
    name += ` ${jqxhr.statusText}`;
  }

  let response = jqxhr.responseJSON;

  if (!response) {
    try {
      response = JSON.parse(jqxhr.responseText);
    } catch (e) {
      response = null;
    }
  }

  details = (response && response.message) || jqxhr.responseText ||
    errorThrown.message || errorThrown;

  if (isConnectionLost()) {
    name = 'Connection Lost Error';
    details = 'Internet connection was lost.';
  }

  return {
    category: 'AJAX Error',
    name,
    details,
  };
}

export {
  isConnectionLost,
  isExpectedError,
  handleAjaxError,
  getAjaxErrorInfo,
};
