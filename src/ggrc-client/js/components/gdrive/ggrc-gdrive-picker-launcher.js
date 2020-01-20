/*
 * Copyright (C) 2020 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loIsFunction from 'lodash/isFunction';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import {
  uploadFiles,
  findGDriveItemById,
  GDRIVE_PICKER_ERR_CANCEL,
} from '../../plugins/utils/gdrive-picker-utils.js';
import {backendGdriveClient} from '../../plugins/ggrc-gapi-client';
import {bindXHRToButton} from '../../plugins/utils/modals';
import tracker from '../../tracker';
import template from './templates/ggrc-gdrive-picker-launcher.stache';
import {
  notifier,
  notifierXHR,
  messages,
} from '../../plugins/utils/notifiers-utils';
import Context from '../../models/service-models/context';
import * as businessModels from '../../models/business-models';

export default canComponent.extend({
  tag: 'ggrc-gdrive-picker-launcher',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      isInactive: {
        get: function () {
          return this.attr('disabled');
        },
      },
    },
    modelType: 'Document',
    tooltip: null,
    instance: {},
    click_event: '',
    confirmationCallback: '',
    disabled: false,
    isUploading: false,

    onKeyup(element, event) {
      const ESCAPE_KEY_CODE = 27;
      const escapeKeyWasPressed = event.keyCode === ESCAPE_KEY_CODE;

      if (escapeKeyWasPressed) {
        const $element = $(element);
        event.stopPropagation();
        // unset focus for attach button
        $element.blur();
      }
    },
    onClickHandler: function (scope, el, event) {
      let eventType = this.attr('click_event');
      let handler = this[eventType] || function () {};
      let confirmation = loIsFunction(this.confirmationCallback) ?
        this.confirmationCallback() :
        null;
      let args = arguments;
      let that = this;

      event.preventDefault();
      $.when(confirmation).then(function () {
        handler.apply(that, args);
      });
    },
    trigger_upload: function (scope, el) {
      let $el = $(el);
      let stopFn = () => {};

      this.attr('isUploading', true);
      return uploadFiles({
        parentId: $el.data('folder-id'),
        pickFolder: $el.data('type') === 'folders',
      })
        .then((files) => {
          let filesCount = files && files.length ? files.length : 0;

          stopFn = tracker.start(scope.instance.type,
            tracker.USER_JOURNEY_KEYS.ATTACHMENTS,
            tracker.USER_ACTIONS.ADD_ATTACHMENT(filesCount));
          return files;
        })
        .then((files) => {
          return this.createDocumentModel(files);
        })
        .then(stopFn)
        .catch((err) => {
          stopFn(true);
          if ( err && err.type === GDRIVE_PICKER_ERR_CANCEL ) {
            $el.trigger('rejected');
          }
        })
        .finally(() => {
          this.attr('isUploading', false);
        });
    },

    trigger_upload_parent: function (scope, el) {
      // upload files with a parent folder (audits and workflows)
      let parentFolderDfd;
      let folderId;

      if (this.instance.attr('_transient.folder')) {
        parentFolderDfd = $.when(
          [{instance: this.instance.attr('_transient.folder')}]
        );
      } else {
        folderId = this.instance.attr('folder');

        parentFolderDfd = findGDriveItemById(folderId);
      }
      bindXHRToButton(parentFolderDfd, el);

      return parentFolderDfd
        .done((parentFolder) => this.uploadParentHelper(parentFolder, scope))
        .fail(() => {
          $(el).trigger('ajax:flash', {
            warning: 'Can\'t upload: No GDrive folder found',
          });
        });
    },

    uploadParentHelper(parentFolder, scope) {
      // This case happens when user have no access to write in audit folder
      const readOnlyRoles = [
        'reader',
        'commenter',
      ];
      if (readOnlyRoles.includes(parentFolder.userPermission.role)) {
        notifier('error', messages[403]);
        return;
      }

      let stopFn = () => {};
      this.attr('isUploading', true);
      return uploadFiles({
        parentId: parentFolder.id,
      })
        .then((files) => {
          let filesCount = files && files.length ? files.length : 0;

          stopFn = tracker.start(scope.instance.type,
            tracker.USER_JOURNEY_KEYS.ATTACHMENTS,
            tracker.USER_ACTIONS.ADD_ATTACHMENT_TO_FOLDER(filesCount));
          return files;
        })
        .then((files) => {
          return this.createDocumentModel(files);
        })
        .then(stopFn)
        .catch((error) => {
          stopFn(true);
          if (error && error.type !== GDRIVE_PICKER_ERR_CANCEL) {
            notifier('error', error && error.message);
          }
        })
        .finally(() => {
          this.attr('isUploading', false);
        });
    },

    createDocumentModel: function (files) {
      let instanceId = this.attr('instance.id');
      let instanceType = this.attr('instance.type');
      let contextId = this.attr('instance.context.id') || null;
      let modelType = this.attr('modelType');
      let ModelClass = businessModels[modelType];

      let models = files.map((file) => {
        let model = new ModelClass({
          context: new Context({id: contextId}),
          title: file.title,
          source_gdrive_id: file.id,
          is_uploaded: file.newUpload,
          parent_obj: { // parent object is used for renaming evidence
            id: instanceId,
            type: instanceType,
          },
        });
        return model;
      });

      this.dispatch({
        type: 'beforeAttach',
        items: models,
      });

      let dfdDocs = models.map((model) => {
        return backendGdriveClient.withAuth(() => {
          return model.save();
        })
          .then((doc) => {
            this.dispatch({
              type: 'created',
              item: doc,
            });
          });
      });
      // waiting for all docs promises
      return Promise.all(dfdDocs)
        .then(
          (docs) => docs,
          (xhr) => {
            notifierXHR('error', xhr);
          });
    },
  }),
});
