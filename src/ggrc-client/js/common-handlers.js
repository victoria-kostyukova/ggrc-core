/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loSnakeCase from 'lodash/snakeCase';
import loForEach from 'lodash/forEach';
let $body = $('body');
let $window = $(window);

// We remove loading class
$window.on('load', function () {
  $('html').removeClass('no-js');
});

// Make all external links open in new window.
jQuery(function ($) {
  $body.on('click', 'a[href]:not([target])', function (e) {
    if (!e.isDefaultPrevented()) {
      if (/^http/.test(this.protocol)
        && this.hostname !== window.location.hostname) {
        e.preventDefault();
        window.open(this.href);
      }
    }
  });
});

function openMapperByElement(ev, disableMapper) {
  let btn = $(ev.currentTarget);
  let data = {};

  loForEach(btn.data(), function (val, key) {
    data[loSnakeCase(key)] = val;
  });

  if (data.tooltip) {
    data.tooltip.hide();
  }

  if (!data.clickable) {
    ev.preventDefault();
  }

  import(/* webpackChunkName: "mapper" */ './controllers/mapper/mapper')
    .then((mapper) => {
      mapper.ObjectMapper.openMapper(data, disableMapper, btn);
    });
}

$body.on('openMapper', (el, ev, disableMapper) => {
  openMapperByElement(ev, disableMapper);
});

$body.on('click', ['unified-mapper', 'unified-search']
  .map((val) => `[data-toggle="${val}"]`).join(', '), (ev, disable) => {
  openMapperByElement(ev, disable);
});
