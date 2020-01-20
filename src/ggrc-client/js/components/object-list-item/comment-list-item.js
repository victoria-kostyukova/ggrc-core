/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {NAVIGATE_TO_TAB} from '../../events/event-types';
import '../person/person-data';
import '../spinner-component/spinner-component';
import template from './comment-list-item.stache';
import {getCommentAuthorRole} from '../../plugins/utils/comments-utils';

/**
 * Simple component to show Comment Objects
 */
export default canComponent.extend({
  tag: 'comment-list-item',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    instance: {},
    baseInstance: {},
    define: {
      showIcon: {
        type: Boolean,
        value: false,
      },
      iconCls: {
        get() {
          return this.attr('showIcon') ?
            'fa-' + this.attr('itemData.title').toLowerCase() :
            '';
        },
      },
      itemData: {
        get() {
          return this.attr('instance');
        },
      },
      commentText: {
        get() {
          return this.attr('itemData.description');
        },
      },
      commentCreationDate: {
        get() {
          return this.attr('itemData.created_at');
        },
      },
      commentAuthor: {
        get() {
          return this.attr('itemData.modified_by') || false;
        },
      },
      commentAuthorType: {
        get() {
          let userRolesStr = this.attr('itemData.assignee_type');
          return getCommentAuthorRole(this.attr('baseInstance'),
            userRolesStr);
        },
      },
      hasRevision: {
        get() {
          return this.attr('commentRevision') || false;
        },
      },
      commentRevision: {
        get() {
          return this.attr('itemData.custom_attribute_revision');
        },
      },
      customAttributeData: {
        get() {
          return this.attr('commentRevision.custom_attribute.title') +
         ':' + this.attr('commentRevision.custom_attribute_stored_value');
        },
      },
      isProposalHeaderLink: {
        get() {
          return this.attr('itemData.header_url_link') === 'proposal_link';
        },
      },
    },
    openProposalTab() {
      this.attr('baseInstance').dispatch({
        ...NAVIGATE_TO_TAB,
        tabId: 'tab-related-proposals',
      });
    },
  }),
});
