/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {connectionLostNotifier} from '../plugins/utils/notifiers-utils';
import {
  isConnectionLost,
  handleAjaxError,
  getAjaxErrorInfo,
  isExpectedError,
} from './utils/errors-utils';
import tracker from '../tracker';

$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
  // setup timezone offset header in each ajax request
  // it should be setup in minutes

  jqXHR.setRequestHeader(
    'X-UserTimezoneOffset',
    String(-1 * new Date().getTimezoneOffset())
  );
});

// Set up all PUT requests to the server to respect ETags, to ensure that
// we are not overwriting more recent data than was viewed by the user.
const etags = {};

function setupEtag(url, xhr) {
  etags[url] = [
    xhr.getResponseHeader('ETag'),
    xhr.getResponseHeader('Last-Modified'),
  ];
}

$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
  let data = originalOptions.data;
  let resourceUrl = originalOptions.url.split('?')[0];

  if (/^\/api\//.test(options.url)
    && /PUT|POST|DELETE/.test(options.type.toUpperCase())) {
    options.dataType = 'json';
    options.contentType = 'application/json';
    jqXHR.setRequestHeader('If-Match', (etags[resourceUrl] || [])[0]);
    jqXHR.setRequestHeader('If-Unmodified-Since',
      (etags[resourceUrl] || [])[1]);

    options.data = options.type.toUpperCase() === 'DELETE' ? ''
      : JSON.stringify(data);
  }
  if (/^\/api\//.test(options.url) && (options.type.toUpperCase() === 'GET')) {
    options.cache = false;
  }
  if (/^\/api\/\w+/.test(options.url)) {
    jqXHR.setRequestHeader('X-Requested-By', 'GGRC');
    jqXHR.done(function (data, status, xhr) {
      if (!/^\/api\/\w+\/\d+/.test(options.url)
        && options.type.toUpperCase() === 'GET') {
        return;
      }
      switch (options.type.toUpperCase()) {
        case 'GET':
        case 'PUT':
          setupEtag(originalOptions.url, xhr);
          break;
        case 'POST':
          for (let field in data) {
            if (data.hasOwnProperty(field) && data[field]
              && data[field].selfLink) {
              setupEtag(data[field].selfLink, xhr);
            }
          }
          break;
        case 'DELETE':
          delete etags[originalOptions.url];
          break;
      }
    }).fail((xhr) => {
      if (xhr.status === 409 && options.type.toUpperCase() === 'PUT') {
        setupEtag(originalOptions.url, xhr);
      }
    });
  }
});

// Set up default failure callbacks if nonesuch exist.
let _oldAjax = $.ajax; // eslint-disable-line no-restricted-properties

// Here we break the deferred pattern a bit by piping back to original AJAX deferreds when we
// set up a failure handler on a later transformation of that deferred.  Why?  The reason is that
//  we have a default failure handler that should only be called if no other one is registered,
//  unless it's also explicitly asked for.  If it's registered in a transformed one, though (after
//  then() or pipe()), then the original one won't normally be notified of failure.
const ggrcAjax = function () {
  let _ajax = _oldAjax.apply($, arguments);

  function setup(newAjax, oldAjax) {
    let oldThen = newAjax.then;
    let oldFail = newAjax.fail;
    let oldPipe = newAjax.pipe;
    oldAjax && (newAjax.hasFailCallback = oldAjax.hasFailCallback);
    newAjax.then = function () {
      let _newAjax = oldThen.apply(this, arguments);
      if (arguments.length > 1) {
        this.hasFailCallback = true;
        if (oldAjax) {
          oldAjax.fail(function () {});
        }
      }
      setup(_newAjax, this);
      return _newAjax;
    };
    newAjax.fail = function () {
      this.hasFailCallback = true;
      if (oldAjax) {
        oldAjax.fail(function () {});
      }
      return oldFail.apply(this, arguments);
    };
    newAjax.pipe = function () {
      let _newAjax = oldPipe.apply(this, arguments);
      setup(_newAjax, this);
      return _newAjax;
    };
  }

  setup(_ajax);
  return _ajax;
};

const jqueryRequest = (type, url, data) => {
  return ggrcAjax({
    type,
    url,
    data,
  });
};

const ggrcGet = jqueryRequest.bind(null, 'get');
const ggrcPost = jqueryRequest.bind(null, 'post');

$(document).ajaxError(function (event, jqxhr, settings, exception) {
  if (!isExpectedError(jqxhr)) {
    tracker.trackError(getAjaxErrorInfo(jqxhr, exception));
  }

  if (!jqxhr.hasFailCallback) {
    if (isConnectionLost()) {
      connectionLostNotifier();
    } else {
      handleAjaxError(jqxhr, exception);
    }
  }
});

export {
  ggrcAjax,
  ggrcGet,
  ggrcPost,
};
