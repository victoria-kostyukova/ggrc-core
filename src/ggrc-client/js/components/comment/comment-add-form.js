/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import './comment-input';
import './comment-add-button';
import template from './comment-add-form.stache';
import {COMMENT_CREATED} from '../../events/event-types';
import tracker from '../../tracker';
import {getAssigneeType} from '../../plugins/utils/comments-utils';
import {notifier} from '../../plugins/utils/notifiers-utils';

const ViewModel = canDefineMap.extend({
  notificationsInfo: {
    set(newValue) {
      return this.instance.constructor.category === 'scope' ?
        'Notify Contacts' :
        newValue;
    },
  },
  tooltipTitle: {
    get() {
      const title = 'Comments will be sent as part of daily digest email ' +
      'notification';
      const category = this.instance.constructor.category;
      const recipients = this.instance.recipients;

      if (['scope', 'programs'].includes(category)) {
        return `${title} to ${recipients.replace(/,/g, ', ')}.`;
      }
      return `${title}.`;
    },
  },
  instance: {
    value: () => ({}),
  },
  sendNotifications: {
    value: true,
  },
  isSaving: {
    value: false,
  },
  isLoading: {
    value: false,
  },
  getCommentData() {
    let source = this.instance;

    return {
      send_notification: this.sendNotifications,
      context: source.context,
      assignee_type: getAssigneeType(source),
    };
  },
  updateComment(comment) {
    comment.attr(this.getCommentData());
    return comment;
  },
  afterCreation(comment, wasSuccessful) {
    this.isSaving = false;
    this.dispatch({
      type: 'afterCreate',
      item: comment,
      success: wasSuccessful,
    });
    if (wasSuccessful) {
      this.instance.dispatch({
        ...COMMENT_CREATED,
        comment: comment,
      });
    }
  },
  onCommentCreated(e) {
    let comment = e.comment;

    tracker.start(this.instance.type,
      tracker.USER_JOURNEY_KEYS.INFO_PANE,
      tracker.USER_ACTIONS.INFO_PANE.ADD_COMMENT);

    this.isSaving = true;
    comment = this.updateComment(comment);
    this.dispatch({type: 'beforeCreate', items: [comment]});

    comment.save()
      .done(() => {
        return this.afterCreation(comment, true);
      })
      .fail(() => {
        notifier('error', 'Saving has failed');
        this.afterCreation(comment, false);
      });
  },
});

/**
 * A component that takes care of adding comments
 *
 */
export default canComponent.extend({
  tag: 'comment-add-form',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
