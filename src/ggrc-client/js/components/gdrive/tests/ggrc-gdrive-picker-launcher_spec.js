/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as PickerUtils from '../../../plugins/utils/gdrive-picker-utils';
import * as NotifiersUtils from '../../../plugins/utils/notifiers-utils';
import tracker from '../../../tracker';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../ggrc-gdrive-picker-launcher';

describe('ggrc-gdrive-picker-launcher', function () {
  'use strict';

  let viewModel;
  let eventStub = {
    preventDefault: function () {},
  };

  beforeEach(function () {
    viewModel = getComponentVM(Component);
    spyOn(tracker, 'start').and.returnValue(() => {});
  });

  describe('onClickHandler() method', function () {
    it('call confirmationCallback() if it is provided', function () {
      spyOn(viewModel, 'confirmationCallback');

      viewModel.onClickHandler(null, null, eventStub);

      expect(viewModel.confirmationCallback).toHaveBeenCalled();
    });

    it('pass callbackResult to $.when()', function () {
      let dfd = $.Deferred();
      let thenSpy = jasmine.createSpy('then');
      spyOn(viewModel, 'confirmationCallback').and.returnValue(dfd);
      spyOn($, 'when').and.returnValue({
        then: thenSpy,
      });

      viewModel.onClickHandler(null, null, eventStub);

      expect($.when).toHaveBeenCalledWith(dfd);
      expect(thenSpy).toHaveBeenCalled();
    });

    it('pass null to $.when() when callback is not provided', function () {
      let thenSpy = jasmine.createSpy('then');
      spyOn($, 'when').and.returnValue({
        then: thenSpy,
      });

      viewModel.onClickHandler(null, null, eventStub);

      expect($.when).toHaveBeenCalledWith(null);
      expect(thenSpy).toHaveBeenCalled();
    });
  });

  describe('onKeyup() method', function () {
    describe('if escape key was clicked', function () {
      let event;
      let element;

      beforeEach(function () {
        const ESCAPE_KEY_CODE = 27;
        event = {
          keyCode: ESCAPE_KEY_CODE,
          stopPropagation: jasmine.createSpy('stopPropagation'),
        };
        element = $('<div></div>');
      });

      it('calls stopPropagation for passed event', function () {
        viewModel.onKeyup(element, event);
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('unsets focus for element', function (done) {
        const blur = function () {
          done();
          element.off('blur', blur);
        };
        element.on('blur', blur);
        viewModel.onKeyup(element, event);
      });
    });
  });

  describe('trigger_upload() method', () => {
    let el;
    let files;

    beforeEach(() => {
      el = jasmine.createSpyObj(['data', 'trigger']);
      files = ['file', 'file'];
    });

    it('sets "isUploading" flag to true', () => {
      spyOn(PickerUtils, 'uploadFiles').and.returnValue(Promise.resolve([]));

      viewModel.attr('isUploading', false);

      viewModel.trigger_upload(viewModel, el);
      expect(viewModel.attr('isUploading')).toBe(true);
    });

    it('calls createDocumentModel() method after uploadFiles() success',
      async () => {
        spyOn(PickerUtils, 'uploadFiles')
          .and.returnValue(Promise.resolve(files));
        spyOn(viewModel, 'createDocumentModel');

        await viewModel.trigger_upload(viewModel, el);

        expect(viewModel.createDocumentModel).toHaveBeenCalledWith(files);
      });

    it('triggers rejected if error type equal GDRIVE_PICKER_ERR_CANCEL',
      async () => {
        const error = {
          type: PickerUtils.GDRIVE_PICKER_ERR_CANCEL,
        };

        spyOn(PickerUtils, 'uploadFiles')
          .and.returnValue(Promise.reject(error));
        spyOn(viewModel, 'createDocumentModel');
        spyOn($.fn, 'trigger').and.callThrough();

        await viewModel.trigger_upload(viewModel, el);

        expect(viewModel.createDocumentModel).not.toHaveBeenCalled();
        expect($.fn.trigger).toHaveBeenCalledWith('rejected');
      });

    describe('sets "isUploading" flag to false', () => {
      beforeEach(() => {
        viewModel.attr('isUploading', true);
      });

      it('when uploadFiles() was failed', async () => {
        spyOn(PickerUtils, 'uploadFiles')
          .and.returnValue(Promise.reject());
        spyOn(viewModel, 'createDocumentModel');

        await viewModel.trigger_upload(viewModel, el);

        expect(viewModel.attr('isUploading')).toBe(false);
        expect(viewModel.createDocumentModel).not.toHaveBeenCalled();
      });

      it('after createDocumentModel() success', async () => {
        spyOn(PickerUtils, 'uploadFiles')
          .and.returnValue(Promise.resolve([]));
        spyOn(viewModel, 'createDocumentModel')
          .and.returnValue(Promise.resolve());

        await viewModel.trigger_upload(viewModel, el);

        expect(viewModel.attr('isUploading')).toBe(false);
      });

      it('when createDocumentModel() was failed', async () => {
        spyOn(PickerUtils, 'uploadFiles')
          .and.returnValue(Promise.resolve([]));
        spyOn(viewModel, 'createDocumentModel')
          .and.returnValue(Promise.reject());

        await viewModel.trigger_upload(viewModel, el);

        expect(viewModel.attr('isUploading')).toBe(false);
      });
    });
  });

  describe('trigger_upload_parent() method', () => {
    let parentFolderDfd;
    let parentFolderStub;
    let errorMessage;

    beforeEach(() => {
      parentFolderStub = {id: 'id'};
      parentFolderDfd = $.Deferred();

      spyOn(PickerUtils, 'findGDriveItemById').and.returnValue(parentFolderDfd);
      spyOn(viewModel, 'uploadParentHelper').and.returnValue(Promise.resolve());
      spyOn($.fn, 'trigger').and.callThrough();
    });

    it('uses transient folder as parent folder if it exists', () => {
      viewModel.instance.attr('_transient.folder', 'folder');

      viewModel.trigger_upload_parent(viewModel);
      expect(PickerUtils.findGDriveItemById).not.toHaveBeenCalled();
    });

    it('calls findGDriveItemById() if transient folder doesn\'t exist', () => {
      let folderId = 123;
      viewModel.instance.attr('_transient.folder', undefined);
      viewModel.instance.attr('folder', folderId);

      viewModel.trigger_upload_parent(viewModel);
      expect(PickerUtils.findGDriveItemById).toHaveBeenCalledWith(folderId);
    });


    it('calls uploadParentHelper() method', (done) => {
      parentFolderDfd.resolve(parentFolderStub);

      viewModel.trigger_upload_parent(viewModel).then(() => {
        expect(viewModel.uploadParentHelper).toHaveBeenCalled();
        done();
      });
    });

    it('displays error message if gdrive hasn\'t found', (done) => {
      parentFolderDfd.reject();
      errorMessage = 'Can\'t upload: No GDrive folder found';

      viewModel.trigger_upload_parent(viewModel).fail(() => {
        expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash', {
          warning: errorMessage,
        });
        done();
      });
    });
  });

  describe('uploadParentHelper() method', () => {
    let uploadParentHelper;
    let files;
    let parentFolderStub;
    let scope;
    let error;

    beforeEach(() => {
      parentFolderStub = {
        id: 'id',
        userPermission: {
          role: 'owner',
        },
      };
      files = ['file', 'file'];

      scope = {
        instance: {
          type: 'type',
        },
      };

      spyOn(NotifiersUtils, 'notifier');

      uploadParentHelper = viewModel.uploadParentHelper.bind(viewModel);
    });

    it('calls notifier() if user have no access to write in audit folder',
      () => {
        parentFolderStub.userPermission.role = 'reader';

        uploadParentHelper(parentFolderStub, scope);

        expect(NotifiersUtils.notifier)
          .toHaveBeenCalledWith('error', NotifiersUtils.messages[403]);
      });

    it('sets "isUploading" flag to true', () => {
      viewModel.attr('isUploading', false);
      spyOn(PickerUtils, 'uploadFiles')
        .and.returnValue(Promise.resolve(files));
      spyOn(viewModel, 'createDocumentModel')
        .and.returnValue(Promise.resolve());

      uploadParentHelper(parentFolderStub, scope);

      expect(viewModel.attr('isUploading')).toBe(true);
    });


    it('calls createDocumentModel() method after uploadFiles() success',
      async () => {
        spyOn(PickerUtils, 'uploadFiles')
          .and.returnValue(Promise.resolve(files));
        spyOn(viewModel, 'createDocumentModel')
          .and.returnValue(Promise.resolve());

        await uploadParentHelper(parentFolderStub, scope);

        expect(viewModel.createDocumentModel).toHaveBeenCalledWith(files);
      });

    it('sets "isUploading" flag to false after uploadFiles() success',
      async () => {
        viewModel.attr('isUploading', true);

        spyOn(PickerUtils, 'uploadFiles')
          .and.returnValue(Promise.resolve(files));
        spyOn(viewModel, 'createDocumentModel')
          .and.returnValue(Promise.resolve());

        await uploadParentHelper(parentFolderStub, scope);

        expect(viewModel.attr('isUploading')).toBe(false);
      });

    it('sets "isUploading" flag to false when uploadFiles() was failed',
      async () => {
        viewModel.attr('isUploading', true);

        spyOn(PickerUtils, 'uploadFiles')
          .and.returnValue(Promise.reject());
        spyOn(viewModel, 'createDocumentModel');

        await uploadParentHelper(parentFolderStub, scope);

        expect(viewModel.attr('isUploading')).toBe(false);
        expect(viewModel.createDocumentModel).not.toHaveBeenCalled();
      });

    it('sets "isUploading" flag to false when createDocumentModel() was failed',
      async () => {
        viewModel.attr('isUploading', true);

        spyOn(PickerUtils, 'uploadFiles')
          .and.returnValue(Promise.resolve(files));
        spyOn(viewModel, 'createDocumentModel')
          .and.returnValue(Promise.reject());

        await uploadParentHelper(parentFolderStub, scope);

        expect(viewModel.attr('isUploading')).toBe(false);
      });

    it('calls notifier() if error type not equal GDRIVE_PICKER_ERR_CANCEL',
      async () => {
        error = {
          type: 'SOME_ANOTHER_ERROR',
          message: 'not found',
        };

        spyOn(PickerUtils, 'uploadFiles')
          .and.returnValue(Promise.reject(error));

        await uploadParentHelper(parentFolderStub, scope);

        expect(NotifiersUtils.notifier)
          .toHaveBeenCalledWith('error', error.message);
      });
  });
});
