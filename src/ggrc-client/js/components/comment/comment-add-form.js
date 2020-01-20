/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import './comment-input';
import './comment-add-button';
import template from './comment-add-form.stache';
import {COMMENT_CREATED} from '../../events/event-types';
import tracker from '../../tracker';
import {getAssigneeType} from '../../plugins/utils/comments-utils';
import {notifier} from '../../plugins/utils/notifiers-utils';

/**
 * A component that takes care of adding comments
 *
 */
export default canComponent.extend({
  tag: 'comment-add-form',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      notificationsInfo: {
        set(newValue) {
          return this.attr('instance').constructor.category === 'scope' ?
            'Notify Contacts' :
            newValue;
        },
      },
      tooltipTitle: {
        get() {
          const title = 'Comments will be sent as part of daily digest email ' +
          'notification';
          const category = this.attr('instance').constructor.category;
          const recipients = this.attr('instance').recipients;

          if (['scope', 'programs'].includes(category)) {
            return `${title} to ${recipients.replace(/,/g, ', ')}.`;
          }
          return `${title}.`;
        },
      },
    },
    instance: {},
    sendNotifications: true,
    isSaving: false,
    isLoading: false,
    getCommentData: function () {
      let source = this.attr('instance');

      return {
        send_notification: this.attr('sendNotifications'),
        context: source.context,
        assignee_type: getAssigneeType(source),
      };
    },
    updateComment: function (comment) {
      comment.attr(this.getCommentData());
      return comment;
    },
    afterCreation: function (comment, wasSuccessful) {
      this.attr('isSaving', false);
      this.dispatch({
        type: 'afterCreate',
        item: comment,
        success: wasSuccessful,
      });
      if (wasSuccessful) {
        this.attr('instance').dispatch({
          ...COMMENT_CREATED,
          comment: comment,
        });
      }
    },
    onCommentCreated: function (e) {
      let comment = e.comment;
      let self = this;

      tracker.start(self.attr('instance.type'),
        tracker.USER_JOURNEY_KEYS.INFO_PANE,
        tracker.USER_ACTIONS.INFO_PANE.ADD_COMMENT);

      self.attr('isSaving', true);
      comment = self.updateComment(comment);
      self.dispatch({type: 'beforeCreate', items: [comment]});

      comment.save()
        .done(function () {
          return self.afterCreation(comment, true);
        })
        .fail(function () {
          notifier('error', 'Saving has failed');
          self.afterCreation(comment, false);
        });
    },
  }),
});
