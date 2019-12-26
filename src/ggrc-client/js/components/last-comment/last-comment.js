/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './last-comment.stache';
import RefreshQueue from '../../models/refresh-queue';
import {peopleWithRoleName} from '../../plugins/utils/acl-utils.js';
import {COMMENT_CREATED} from '../../events/event-types';
import {formatDate} from '../../plugins/utils/date-utils';
import Comment from '../../models/service-models/comment';
import {getOnlyAnchorTags} from '../../plugins/ggrc-utils';

const ViewModel = canDefineMap.extend({
  comment: {
    value: null,
  },
  author: {
    value: null,
  },
  instance: {
    set(instance) {
      const comment = new Comment({
        id: instance.last_comment_id,
        description: instance.last_comment,
      });

      this.comment = comment;
      return instance;
    },
  },
  commentText: {
    get() {
      const html = this.comment && this.comment.attr('description') || '';

      let lines = getOnlyAnchorTags(html);
      return lines;
    },
  },
  getAuthor() {
    const person = peopleWithRoleName(this.comment, 'Admin')[0];
    this.author = person;
  },
  tooltip() {
    const date = formatDate(
      this.comment && this.comment.attr('created_at'),
      true
    );
    const authorEmail = this.author && this.author.email;

    if (date && authorEmail) {
      return `${date}, ${authorEmail}`;
    }
    return '';
  },
});

export default canComponent.extend({
  tag: 'last-comment',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    ['{this} mouseover']() {
      const vm = this.viewModel;

      new RefreshQueue()
        .enqueue(vm.comment)
        .trigger()
        .done((response) => {
          vm.comment = response[0];
          if (!vm.author) {
            vm.getAuthor();
          }
        });
    },
    [`{instance} ${COMMENT_CREATED.type}`]([instance], {comment}) {
      this.viewModel.comment = comment;
      this.viewModel.getAuthor();
    },
  },
});
