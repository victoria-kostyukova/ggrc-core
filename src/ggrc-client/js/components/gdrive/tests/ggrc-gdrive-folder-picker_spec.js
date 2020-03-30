/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../ggrc-gdrive-folder-picker';
import * as ajaxExtensions from '../../../plugins/ajax-extensions';

describe('ggrc-gdrive-folder-picker component', () => {
  let viewModel;
  let folderId = 'folder id';

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('viewModel', () => {
    describe('setRevisionFolder() method', () => {
      it('sets current folder if selected', () => {
        viewModel.instance = new canMap({
          folder: folderId,
        });

        spyOn(viewModel, 'setCurrent');

        viewModel.setRevisionFolder();
        expect(viewModel.setCurrent).toHaveBeenCalled();
      });

      it('doesnt set current folder if not selected', () => {
        viewModel.instance = new canMap({
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
        const instance = new canMap({
          refresh: jasmine.createSpy(),
        });
        ggrcAjaxSpy = spyOn(ajaxExtensions, 'ggrcAjax');

        viewModel._folder_change_pending = false;
        viewModel.current_folder = defaultFolder;
        viewModel.folder_error = defaultFolderError;
        viewModel.instance = instance;

        method = viewModel.unlinkFolder.bind(viewModel);
      });

      it('should set "_folder_change_pending" to true', () => {
        ggrcAjaxSpy.and.returnValue($.Deferred().resolve());

        method();
        expect(viewModel._folder_change_pending).toBe(true);
      });

      it('should set "current_folder" to NULL', () => {
        ggrcAjaxSpy.and.returnValue($.Deferred().resolve());

        method();
        expect(viewModel.current_folder).toBeNull();
      });

      it('should set "folder_error" to null when request was successful',
        (done) => {
          const dfd = $.Deferred();
          ggrcAjaxSpy.and.returnValue(dfd);

          method().then(() => {
            expect(viewModel.folder_error).toBeNull();
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
            expect(viewModel.folder_error).toEqual(defaultFolderError);
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
            expect(viewModel.instance.refresh).toHaveBeenCalled();
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
            expect(viewModel.current_folder.serialize())
              .toEqual(defaultFolder);
            done();
          });

          dfd.reject();
        }
      );
    });

    describe('detachFolder() method', () => {
      beforeEach(() => {
        viewModel.deferred = true;
        viewModel.instance = new canMap({
          folder: 123,
        });
        spyOn(viewModel, 'unlinkFolder');
      });

      it('unsets current_folder', () => {
        viewModel.current_folder = 123;

        viewModel.detachFolder();

        expect(viewModel.current_folder).toBe(null);
      });

      it('unsets instace.folder', () => {
        viewModel.detachFolder();

        expect(viewModel.instance.attr('folder')).toBe(null);
      });

      it('calls unlinkFolder() method', () => {
        viewModel.deferred = false;

        viewModel.detachFolder();

        expect(viewModel.unlinkFolder).toHaveBeenCalled();
      });
    });

    describe('unsetFocus() method', () => {
      let event;
      let element;
      beforeEach(() => {
        const ESCAPE_KEY_CODE = 27;
        element = $('<div></div>');
        event = {
          keyCode: ESCAPE_KEY_CODE,
          stopPropagation: jasmine.createSpy('stopPropagation'),
          target: element,
        };
      });

      it('calls stopPropagation for passed event', () => {
        viewModel.unsetFocus(event);

        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('unsets focus for element', function (done) {
        const blur = () => {
          done();
          element.off('blur', blur);
        };
        element.on('blur', blur);
        viewModel.unsetFocus(event);
      });
    });
  });

  describe('events', () => {
    let events;

    beforeAll(() => {
      events = Component.prototype.events;
    });

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

      it('calls setRevisionFolder()', () => {
        viewModel.instance = new canMap({
          folder: folderId,
        });
        viewModel.readonly = true;
        spyOn(viewModel, 'setRevisionFolder');

        method();
        expect(viewModel.setRevisionFolder).toHaveBeenCalled();
      });
    });

    describe('".entry-attachment picked" handler', () => {
      let method;
      let that;
      let element;
      let pickedFolders;

      beforeEach(() => {
        element = $('<div></div>').data('type', 'folders');
        viewModel.instance = new canMap({
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

      it('notifies when selected not a folder', () => {
        let data = {
          files: [{mimeType: 'not a folder mime type'}],
        };
        spyOn($.fn, 'trigger').and.callThrough();

        method(element, jasmine.any(Object), data);
        expect($.fn.trigger).toHaveBeenCalledWith('ajax:flash',
          {error: [jasmine.any(String)]});
      });

      it('set folder id for deferred instance', () => {
        viewModel.deferred = true;

        spyOn(viewModel, 'setCurrent');
        spyOn(viewModel, 'linkFolder');

        method(element, jasmine.any(Object), pickedFolders);
        expect(viewModel.instance.attr('folder')).toEqual(folderId);
        expect(viewModel.setCurrent).toHaveBeenCalledWith(folderId);
        expect(viewModel.linkFolder).not.toHaveBeenCalled();
      });

      it('calls linkFolder() for existing instance', () => {
        viewModel.deferred = false;

        spyOn(viewModel, 'setCurrent');
        spyOn(viewModel, 'linkFolder').and.returnValue($.Deferred());

        method(element, jasmine.any(Object), pickedFolders);
        expect(viewModel.setCurrent).toHaveBeenCalledWith(folderId);
        expect(viewModel.linkFolder).toHaveBeenCalledWith(folderId);
      });
    });
  });
});
