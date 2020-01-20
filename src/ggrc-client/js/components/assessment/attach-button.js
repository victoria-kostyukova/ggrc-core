/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {isAllowedFor} from '../../permission';
import template from './attach-button.stache';
import {
  getGDriveItemId,
  findGDriveItemById,
} from '../../plugins/utils/gdrive-picker-utils';
import pubSub from '../../pub-sub';

export default canComponent.extend({
  tag: 'attach-button',
  view: canStache(template),
  confirmationCallback: '',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      hasPermissions: {
        get: function (prevValue, setValue) {
          let instance = this.attr('instance');
          if (isAllowedFor('update', instance) &&
            !instance.attr('archived')) {
            this.checkFolder().finally(() => {
              setValue(true);
            });
          } else {
            setValue(false);
          }
        },
      },
      folderId: {
        type: String,
        get() {
          return getGDriveItemId(this.attr('error.message'));
        },
      },
    },
    canAttach: false,
    isFolderAttached: false,
    error: {},
    instance: null,
    isAttachActionDisabled: false,
    onBeforeCreate: function (event) {
      pubSub.dispatch({
        type: 'relatedItemBeforeSave',
        itemType: 'files',
        items: event.items,
      });
    },
    created: function (event) {
      pubSub.dispatch({
        ...event,
        type: 'relatedItemSaved',
        itemType: 'files',
      });
    },
    async checkFolder() {
      try {
        const folder = await this.findFolder();
        /*
          during processing of the request to GDrive instance can be updated
          and folder can become null. In this case isFolderAttached value
          should not be updated after request finishing.
        */
        if (folder && this.attr('instance.folder')) {
          this.attr('isFolderAttached', true);
        } else {
          this.attr('isFolderAttached', false);
        }
        this.attr('canAttach', true);
      } catch (err) {
        this.attr('error', err);
        this.attr('canAttach', false);
      }
    },
    findFolder: function () {
      let folderId = this.attr('instance.folder');

      if (!folderId) {
        return Promise.resolve();
      }

      return findGDriveItemById(folderId);
    },
  }),
});
