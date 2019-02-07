/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  getCommentFormUrl,
  getInfoUrl,
  getReviewUrl,
  isChangeableExternally,
} from '../../plugins/utils/ggrcq-utils';
import template from './questionnaire-link.stache';

export default can.Component.extend({
  tag: 'questionnaire-link',
  template,
  leakScope: true,
  viewModel: {
    define: {
      url: {
        type: String,
        get: function () {
          const instance = this.attr('instance');
          const linkType = this.attr('linkType');

          switch (linkType) {
            case 'comment':
              return getCommentFormUrl(instance);
            case 'review':
              return getReviewUrl(instance);
            default:
              return getInfoUrl(instance);
          }
        },
      },
      isChangeableExternally: {
        type: Boolean,
        get: function () {
          const instance = this.attr('instance');

          return isChangeableExternally(instance);
        },
      },
    },
    instance: null,
    iconPosition: 'left',
    linkType: 'info',
    showIcon: false,
    viewType: 'link',
  },
});
