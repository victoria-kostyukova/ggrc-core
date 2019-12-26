/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {
  hasQuestions,
  getQuestionsUrl,
} from '../../plugins/utils/ggrcq-utils';
import template from './questions-link.stache';

const ViewModel = canDefineMap.extend({
  instance: {
    value: null,
  },
  hasQuestions: {
    get() {
      let instance = this.instance;

      if (instance.attr('status') === 'Deprecated') {
        return false;
      }

      return hasQuestions(instance);
    },
  },
  questionsUrl: {
    get() {
      let instance = this.attr('instance');
      return getQuestionsUrl(instance);
    },
  },
});

export default canComponent.extend({
  tag: 'questions-link',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    '.question-link click'(el, ev) {
      ev.stopPropagation();
    },
  },
});
