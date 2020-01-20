/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
const messages = {
  'default': 'There was an error!',
  '401': 'The server says you are not authorized. Are you logged in?',
  '403': 'You don\'t have the permission to access the ' +
  'requested resource. It is either read-protected or not ' +
  'readable by the server.',
  '409': 'There was a conflict while saving.' +
  ' Your changes have not been saved yet.' +
  ' Please refresh the page and try saving again',
  '412': 'One of the form fields isn\'t right. ' +
  'Check the form for any highlighted fields.',
  connectionLost: 'Internet connection was lost.',
};

/**
 * Shows flash notification
 * @param  {String} type - Type of notification. error|warning
 * @param  {String} message - Plain text message or template if data is passed
 * @param  {Object} [options={}] - Set of options
 * @param  {Object} [options.data=null] - Data to populate template
 * @param  {String} [options.reloadLink=null] - Redirection link which will be
 * inserted instead of "{reload_link}" locator placed in the message
 */
function notifier(type, message, {data = null, reloadLink = null} = {}) {
  let props = {};

  if ( message && data ) {
    message = canStache(message);
    props.data = data;
  }

  type = type || 'warning';
  props[type] = message || messages.default;
  $('body').trigger('ajax:flash', [props, reloadLink]);
}

function notifierXHR(type, xhr) {
  let message = (xhr.responseJSON && xhr.responseJSON.message) ?
    xhr.responseJSON.message :
    xhr.responseText;

  let status = xhr && xhr.status ? xhr.status : null;

  if (!message && status) {
    message = messages[status];
  }

  notifier(type, message);
}

function connectionLostNotifier() {
  notifier('error', messages.connectionLost);
}

window.addEventListener('error', (event) => {
  notifier('error', event.message);
});

export {
  messages,
  notifier,
  notifierXHR,
  connectionLostNotifier,
};
