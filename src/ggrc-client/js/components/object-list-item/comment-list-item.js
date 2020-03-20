/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {NAVIGATE_TO_TAB} from '../../events/event-types';
import '../person/person-data';
import '../spinner-component/spinner-component';
import template from './comment-list-item.stache';
import {getCommentAuthorRole} from '../../plugins/utils/comments-utils';

const ViewModel = canDefineMap.extend({
  instance: {
    value: () => ({}),
  },
  baseInstance: {
    value: () => ({}),
  },
  handleMarkdown: {
    get() {
      return this.baseInstance.constructor.isChangeableExternally
      || this.instance.constructor.isChangeableExternally;
    },
  },
  showIcon: {
    type: 'boolean',
    value: false,
  },
  iconCls: {
    get() {
      return this.showIcon ?
        'fa-' + this.itemData.attr('title').toLowerCase() :
        '';
    },
  },
  itemData: {
    get() {
      return this.instance;
    },
  },
  commentText: {
    get() {
      return this.itemData.attr('description');
    },
  },
  commentCreationDate: {
    get() {
      return this.itemData.attr('created_at');
    },
  },
  commentAuthor: {
    get() {
      return this.itemData.attr('modified_by') || false;
    },
  },
  commentAuthorType: {
    get() {
      const userRolesStr = this.itemData.attr('assignee_type');
      return getCommentAuthorRole(this.baseInstance, userRolesStr);
    },
  },
  hasRevision: {
    get() {
      return this.commentRevision || false;
    },
  },
  commentRevision: {
    get() {
      return this.itemData.attr('custom_attribute_revision');
    },
  },
  customAttributeData: {
    get() {
      return this.commentRevision.attr('custom_attribute.title') +
      ':' + this.commentRevision.attr('custom_attribute_stored_value');
    },
  },
  isProposalHeaderLink: {
    get() {
      return this.itemData.attr('header_url_link') === 'proposal_link';
    },
  },
  openProposalTab() {
    this.baseInstance.dispatch({
      ...NAVIGATE_TO_TAB,
      tabId: 'tab-related-proposals',
    });
  },
});

/**
 * Simple component to show Comment Objects
 */
export default canComponent.extend({
  tag: 'comment-list-item',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
