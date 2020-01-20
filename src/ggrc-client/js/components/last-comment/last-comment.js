/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './last-comment.stache';
import RefreshQueue from '../../models/refresh-queue';
import {peopleWithRoleName} from '../../plugins/utils/acl-utils.js';
import {COMMENT_CREATED} from '../../events/event-types';
import {formatDate} from '../../plugins/utils/date-utils';
import Comment from '../../models/service-models/comment';
import {getOnlyAnchorTags} from '../../plugins/ggrc-utils';

export default canComponent.extend({
  tag: 'last-comment',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      instance: {
        set(instance) {
          const comment = new Comment({
            id: instance.last_comment_id,
            description: instance.last_comment,
          });

          this.attr('comment', comment);
          return instance;
        },
      },
      commentText: {
        get() {
          const html = this.attr('comment.description') || '';

          let lines = getOnlyAnchorTags(html);
          return lines;
        },
      },
    },
    comment: null,
    author: null,
    getAuthor() {
      const person = peopleWithRoleName(this.attr('comment'), 'Admin')[0];

      this.attr('author', person);
    },
    tooltip() {
      const date = formatDate(this.attr('comment.created_at'), true);
      const authorEmail = this.attr('author.email');

      if (date && authorEmail) {
        return `${date}, ${authorEmail}`;
      }
      return '';
    },
  }),
  events: {
    ['{this} mouseover']() {
      const vm = this.viewModel;

      new RefreshQueue()
        .enqueue(vm.attr('comment'))
        .trigger()
        .done((response) => {
          vm.attr('comment', response[0]);
          if (!vm.attr('author')) {
            vm.getAuthor();
          }
        });
    },
    [`{instance} ${COMMENT_CREATED.type}`]([instance], {comment}) {
      this.viewModel.attr('comment', comment);
      this.viewModel.getAuthor();
    },
  },
});
