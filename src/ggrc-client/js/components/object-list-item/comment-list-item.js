/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {NAVIGATE_TO_TAB} from '../../events/eventTypes';
import '../person/person-data';
import template from './comment-list-item.mustache';

const tag = 'comment-list-item';
/**
 * Simple component to show Comment Objects
 */
export default can.Component.extend({
  tag,
  template,
  viewModel: {
    instance: {},
    baseInstance: {},
    define: {
      showIcon: {
        type: 'boolean',
        value: false,
      },
      iconCls: {
        get: function () {
          return this.attr('showIcon') ?
            'fa-' + this.attr('itemData.title').toLowerCase() :
            '';
        },
      },
      itemData: {
        get: function () {
          return this.attr('instance');
        },
      },
      commentText: {
        get: function () {
          return this.attr('itemData.description');
        },
      },
      commentCreationDate: {
        type: 'date',
        get: function () {
          return this.attr('itemData.created_at');
        },
      },
      commentAuthor: {
        get: function () {
          return this.attr('itemData.modified_by') || false;
        },
      },
      commentAuthorType: {
        get: function () {
          return this.attr('itemData.assignee_type') || false;
        },
      },
      hasRevision: {
        get: function () {
          return this.attr('commentRevision') || false;
        },
      },
      commentRevision: {
        get: function () {
          return this.attr('itemData.custom_attribute_revision');
        },
      },
      customAttributeData: {
        get: function () {
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
  },
});
