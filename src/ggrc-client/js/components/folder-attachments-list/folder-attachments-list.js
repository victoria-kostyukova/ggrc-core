/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../object-list-item/editable-document-object-list-item';
import {
  BEFORE_MAPPING,
  REFRESH_MAPPING,
  BEFORE_DOCUMENT_CREATE,
  DOCUMENT_CREATE_FAILED,
} from '../../events/event-types';
import {isAllowedFor} from '../../permission';
import template from './folder-attachments-list.stache';

const ViewModel = canDefineMap.extend({
  showSpinner: {
    get() {
      return this.isUnmapping || this.isListLoading || this.isMapping;
    },
  },
  readonly: {
    value: false,
    get() {
      let instance = this.instance;

      if (!instance) {
        return true;
      }

      let isSnapshot = this.isSnapshot;
      return isSnapshot || !isAllowedFor('update', instance);
    },
  },
  showMore: {
    get() {
      return !this.isSnapshot;
    },
  },
  tooltip: {
    value: null,
    get() {
      let instance = this.instance;
      if (instance) {
        return 'No copy will be created. Original files will be added to ' +
          'the destination ' + instance.constructor.title_singular +
          ' folder.';
      }
    },
  },
  title: {
    value: null,
  },
  instance: {
    value: null,
  },
  isSnapshot: {
    value: false,
  },
  folderError: {
    value: null,
  },
  isAttaching: {
    value: false,
  },
  isUnmapping: {
    value: false,
  },
  isListLoading: {
    value: false,
  },
  isMapping: {
    value: false,
  },
});

/**
 * Wrapper Component for rendering and managing of folder and
 * attachments lists
 */
export default canComponent.extend({
  tag: 'folder-attachments-list',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    [`{viewModel.instance} ${BEFORE_DOCUMENT_CREATE.type}`]() {
      this.viewModel.isMapping = true;
    },
    [`{viewModel.instance} ${DOCUMENT_CREATE_FAILED.type}`]() {
      this.viewModel.isMapping = false;
    },
    [`{viewModel.instance} ${BEFORE_MAPPING.type}`](scope, ev) {
      if (ev.destinationType === 'Document') {
        this.viewModel.isMapping = true;
      }
    },
    [`{viewModel.instance} ${REFRESH_MAPPING.type}`]() {
      this.viewModel.isMapping = false;
    },
  },
});
