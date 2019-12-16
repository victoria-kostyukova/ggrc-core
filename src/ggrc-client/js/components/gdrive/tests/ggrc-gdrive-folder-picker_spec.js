/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../ggrc-gdrive-folder-picker';
import * as ajaxExtensions from '../../../plugins/ajax-extensions';

describe('ggrc-gdrive-folder-picker component', function () {
  'use strict';

  let events;
  let viewModel;
  let folderId = 'folder id';

  beforeAll(function () {
    events = Component.prototype.events;
  });

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('viewModel', () => {
    describe('setRevisionFolder() method', () => {
      it('sets current folder if selected', () => {
        viewModel.attr('instance', {
          folder: folderId,
        });

        spyOn(viewModel, 'setCurrent');

        viewModel.setRevisionFolder();
        expect(viewModel.setCurrent).toHaveBeenCalled();
      });

      it('doesnt set current folder if not selected', () => {
        viewModel.attr('instance', {
          folder: null,
        });

        spyOn(viewModel, 'setCurrent');

        viewModel.setRevisionFolder();
        expect(viewModel.setCurrent).not.toHaveBeenCalled();
      });
    });

    describe('unlinkFolder() method', () => {
      const defaultFolder = {id: 12345};
      const defaultFolderError = 404;
      let ggrcAjaxSpy;
      let method;

      beforeEach(() => {
        const instance = {
          refresh: jasmine.createSpy(),
        };
        ggrcAjaxSpy = spyOn(ajaxExtensions, 'ggrcAjax');

        viewModel.attr('_folder_change_pending', false);
        viewModel.attr('current_folder', defaultFolder);
        viewModel.attr('folder_error', defaultFolderError);
        viewModel.attr('instance', instance);

        method = viewModel.unlinkFolder.bind(viewModel);
      });

      it('should set "_folder_change_pending" to true', () => {
        ggrcAjaxSpy.and.returnValue($.Deferred().resolve());

        method();
        expect(viewModel.attr('_folder_change_pending')).toBe(true);
      });

      it('should set "current_folder" to NULL', () => {
        ggrcAjaxSpy.and.returnValue($.Deferred().resolve());

        method();
        expect(viewModel.attr('current_folder')).toBeNull();
      });

      it('should set "folder_error" to null when request was successful',
        (done) => {
          const dfd = $.Deferred();
          ggrcAjaxSpy.and.returnValue(dfd);

          method().then(() => {
            expect(viewModel.attr('folder_error')).toBeNull();
            done();
          });

          dfd.resolve();
        }
      );

      it('should NOT set "folder_error" to null when request was failed',
        (done) => {
          const dfd = $.Deferred();
          ggrcAjaxSpy.and.returnValue(dfd);

          method().fail(() => {
            expect(viewModel.attr('folder_error')).toEqual(defaultFolderError);
            done();
          });

          dfd.reject();
        }
      );

      it('should call "instance.refresh" when request was successful',
        (done) => {
          const dfd = $.Deferred();
          ggrcAjaxSpy.and.returnValue(dfd);

          method().then(() => {
            expect(viewModel.attr('instance').refresh).toHaveBeenCalled();
            done();
          });

          dfd.resolve();
        }
      );

      it('should set "current_folder" from backup when request was failed',
        (done) => {
          const dfd = $.Deferred();
          ggrcAjaxSpy.and.returnValue(dfd);

          method().fail(() => {
            expect(viewModel.attr('current_folder').serialize())
              .toEqual(defaultFolder);
            done();
          });

          dfd.reject();
        }
      );
    });
  });

  describe('events', function () {
    describe('"init" handler', function () {
      let method;
      let that;

      beforeEach(function () {
        that = {
          viewModel: viewModel,
          element: $('<div></div>'),
        };
        method = events.init.bind(that);
      });

      it('calls setRevisionFolder()', function () {
        viewModel.attr('instance', {
          folder: folderId,
        });
        viewModel.attr('readonly', true);
        spyOn(viewModel, 'setRevisionFolder');

        method();
        expect(viewModel.setRevisionFolder).toHaveBeenCalled();
      });
    });

    describe('"a[data-toggle=gdrive-remover] click" handler', () => {
      let method;
      let that;

      beforeEach(() => {
        viewModel.attr('instance', {
          folder: folderId,
        });

        that = {
          viewModel: viewModel,
          element: $('<div></div>'),
        };
        method = events['a[data-toggle=gdrive-remover] click'].bind(that);
      });

      it('unsets current_folder', (done) => {
        viewModel.attr('deferred', true);

        method().then(() => {
          expect(viewModel.attr('current_folder')).toBeNull();
          done();
        });
      });

      it('unsets folder id for deferred instance', (done) => {
        viewModel.attr('deferred', true);

        method().then(() => {
          expect(viewModel.instance.attr('folder')).toBeNull();
          done();
        });
      });

      it('calls unlinkFolder() for existing instance', (done) => {
        viewModel.attr('deferred', false);

        spyOn(viewModel, 'unlinkFolder')
          .and.returnValue($.Deferred().resolve());

        method().then(() => {
          expect(viewModel.unlinkFolder).toHaveBeenCalled();
          done();
        });
      });
    });

    describe('a[data-toggle=gdrive-picker] keyup', function () {
      let method;
      let that;

      beforeEach(function () {
        that = {};
        method = events['a[data-toggle=gdrive-picker] keyup'].bind(that);
      });

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
          method(element, event);
          expect(event.stopPropagation).toHaveBeenCalled();
        });

        it('unsets focus for element', function (done) {
          const blur = function () {
            done();
            element.off('blur', blur);
          };
          element.on('blur', blur);
          method(element, event);
        });
      });
    });

    describe('".entry-attachment picked" handler', function () {
      let method;
      let that;
      let element;
      let pickedFolders;

      beforeEach(function () {
        element = $('<div></div>').data('type', 'folders');
        viewModel.attr('instance', {
          folder: null,
        });
        pickedFolders = {
          files: [{
            mimeType: 'application/vnd.google-apps.folder',
            id: folderId,
          }],
        };

        that = {
          viewModel: viewModel,
        };
        method = events['.entry-attachment picked'].bind(that);
      });

      it('notifies when selected not a folder', function () {
        let data = {
          files: [{mimeType: 'not a folder mime type'}],
        };
        spyOn($.fn, 'trigger').and.callThrough();

        method(element, jasmine.any(Object), data);
        expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
          {error: [jasmine.any(String)]});
      });

      it('set folder id for deferred instance', function () {
        viewModel.attr('deferred', true);

        spyOn(viewModel, 'setCurrent');
        spyOn(viewModel, 'linkFolder');

        method(element, jasmine.any(Object), pickedFolders);
        expect(viewModel.instance.attr('folder')).toEqual(folderId);
        expect(viewModel.setCurrent).toHaveBeenCalledWith(folderId);
        expect(viewModel.linkFolder).not.toHaveBeenCalled();
      });

      it('calls linkFolder() for existing instance', function () {
        viewModel.attr('deferred', false);

        spyOn(viewModel, 'setCurrent');
        spyOn(viewModel, 'linkFolder').and.returnValue($.Deferred());

        method(element, jasmine.any(Object), pickedFolders);
        expect(viewModel.setCurrent).toHaveBeenCalledWith(folderId);
        expect(viewModel.linkFolder).toHaveBeenCalledWith(folderId);
      });
    });
  });
});
