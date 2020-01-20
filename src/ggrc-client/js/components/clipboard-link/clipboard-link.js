/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import Clipboard from 'clipboard';
import {notifier} from '../../plugins/utils/notifiers-utils';

export default canComponent.extend({
  tag: 'clipboard-link',
  view: canStache(
    '<a type="button" data-clipboard-text="{{text}}"><content/></a>'
  ),
  leakScope: true,
  viewModel: canMap.extend({
    text: '',
  }),
  events: {
    inserted(el, evnt) {
      new Clipboard(el.find('a')[0]).on('success', () => {
        notifier('info', 'Link has been copied to your clipboard.');
      });
    },
  },
});
