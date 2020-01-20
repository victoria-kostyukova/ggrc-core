/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {
  hasQuestions,
  getQuestionsUrl,
} from '../../plugins/utils/ggrcq-utils';
import template from './questions-link.stache';

export default canComponent.extend({
  tag: 'questions-link',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      hasQuestions: {
        type: Boolean,
        get: function () {
          let instance = this.attr('instance');

          if (instance.attr('status') === 'Deprecated') {
            return false;
          }

          return hasQuestions(instance);
        },
      },
      questionsUrl: {
        type: String,
        get: function () {
          let instance = this.attr('instance');
          return getQuestionsUrl(instance);
        },
      },
    },
    instance: null,
  }),
  events: {
    '.question-link click': function (el, ev) {
      ev.stopPropagation();
    },
  },
});
