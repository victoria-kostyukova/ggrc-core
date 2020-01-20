/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canComponent from 'can-component';
import {loadComments} from '../../plugins/utils/comments-utils';
import {
  REFRESH_COMMENTS,
  REFRESH_MAPPED_COUNTER,
} from '../../events/event-types';
import Relationship from '../../models/service-models/relationship';
import Context from '../../models/service-models/context';

export default canComponent.extend({
  tag: 'comment-data-provider',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      commentObjectName: {
        get() {
          return this.attr('instance').constructor.isChangeableExternally
            ? 'ExternalComment'
            : 'Comment';
        },
      },
    },
    instance: null,
    comments: [],
    pageSize: 10,
    totalCount: 0,
    newCommentsCount: 0,
    isLoading: false,
    hideComments() {
      // remain only first comments
      this.attr('comments').splice(this.attr('pageSize'));
    },
    async loadFirstComments(count) {
      let instance = this.attr('instance');
      let modelName = this.attr('commentObjectName');
      let newCommentsCount = this.attr('newCommentsCount');

      // load more comments as they can be added by other users before or after current user's new comments
      let pageSize = (count || this.attr('pageSize')) + newCommentsCount;

      let response = await loadComments(instance, modelName, 0, pageSize);
      let {values: comments, total} = response[modelName];

      this.attr('comments').splice(0, newCommentsCount);
      this.attr('comments').unshift(...comments);

      this.attr('totalCount', total);
      this.attr('newCommentsCount', 0);
    },
    async loadMoreComments(startIndex) {
      this.attr('isLoading', true);

      let instance = this.attr('instance');
      let modelName = this.attr('commentObjectName');
      let index = startIndex || this.attr('comments').length;
      let pageSize = this.attr('pageSize');

      try {
        let response = await loadComments(instance, modelName, index, pageSize);
        let {values: comments, total} = response[modelName];

        let totalCount = this.attr('totalCount');
        if (totalCount !== total) {
          // new comments were added by other users
          let newCommentsCount = total - totalCount;
          await Promise.all([
            this.loadFirstComments(newCommentsCount),
            this.loadMoreComments(index + newCommentsCount)]);
        } else {
          this.attr('comments').push(...comments);
        }
      } finally {
        this.attr('isLoading', false);
      }
    },
    addComment(event) {
      let newComment = event.items[0];
      return this.attr('comments').unshift(newComment);
    },
    removeComment(commentToRemove) {
      let comments = this.attr('comments');
      comments.replace(comments.filter((comment) => {
        return comment !== commentToRemove;
      }));
    },
    processComment(event) {
      if (event.success) {
        this.attr('totalCount', this.attr('totalCount') + 1);
        this.attr('newCommentsCount', this.attr('newCommentsCount') + 1);

        this.mapToInstance(event.item).then(() => {
          const instance = this.attr('instance');
          instance.dispatch({
            ...REFRESH_MAPPED_COUNTER,
            modelType: 'Comment',
          });
          instance.refresh();
        });
      } else {
        this.removeComment(event.item);
      }
    },
    mapToInstance(comment) {
      return (new Relationship({
        context: this.attr('instance.context') || new Context({id: null}),
        source: this.attr('instance'),
        destination: comment,
      }))
        .save()
        .fail(() => {
          this.removeComment(comment);
        });
    },
  }),
  async init() {
    this.viewModel.attr('isLoading', true);
    try {
      await this.viewModel.loadFirstComments();
    } finally {
      this.viewModel.attr('isLoading', false);
    }
  },
  events: {
    [`{viewModel.instance} ${REFRESH_COMMENTS.type}`]() {
      this.viewModel.attr('comments').replace([]);
      this.viewModel.loadFirstComments();
    },
  },
});
