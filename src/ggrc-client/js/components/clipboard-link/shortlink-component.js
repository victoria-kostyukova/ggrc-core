/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import './clipboard-link';

export default canComponent.extend({
  tag: 'shortlink-component',
  view: canStache(
    '<clipboard-link text:from="text">' +
    '<i class="fa fa-google"/>Get Short Url</clipboard-link>'
  ),
  leakScope: true,
  viewModel: canMap.extend({
    instance: null,
    define: {
      text: {
        type: String,
        get() {
          let instance = this.attr('instance');
          let prefix = GGRC.config.ASSESSMENT_SHORT_URL_PREFIX;
          if (prefix && !prefix.endsWith('/')) {
            prefix += '/';
          }

          return (prefix && instance.id) ? `${prefix}${instance.id}` : '';
        },
      },
    },
  }),
});
