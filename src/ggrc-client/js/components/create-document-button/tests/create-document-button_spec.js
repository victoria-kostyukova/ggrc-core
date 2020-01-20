/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../create-document-button';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import * as pickerUtils from '../../../plugins/utils/gdrive-picker-utils';
import {
  BEFORE_DOCUMENT_CREATE,
  DOCUMENT_CREATE_FAILED,
} from '../../../events/event-types';
import Document from '../../../models/business-models/document';

describe('create-document-button component', () => {
  let viewModel;
  beforeEach(() => {
    viewModel = getComponentVM(Component);
    viewModel.attr('parentInstance', {});
  });

  describe('viewModel', () => {
    describe('mapDocuments() method', () => {
      it('should check wheteher documents already exist', () => {
        let file = {};

        spyOn(viewModel, 'checkDocumentsExist').and
          .returnValue(Promise.resolve());
        spyOn(viewModel, 'createDocuments')
          .and.returnValue(Promise.resolve([]));
        spyOn(viewModel, 'useExistingDocuments')
          .and.returnValue(Promise.resolve([]));

        viewModel.mapDocuments(file);

        expect(viewModel.checkDocumentsExist).toHaveBeenCalledWith(file);
      });

      it('should create a new documents if they are not exist', (done) => {
        let file = {id: 1};

        spyOn(viewModel, 'checkDocumentsExist').and
          .returnValue(Promise.resolve([{
            exists: false,
            gdrive_id: 1,
          }]));
        spyOn(viewModel, 'createDocuments')
          .and.returnValue(Promise.resolve([]));
        spyOn(viewModel, 'useExistingDocuments')
          .and.returnValue(Promise.resolve([]));

        viewModel.mapDocuments([file]).then(() => {
          expect(viewModel.createDocuments).toHaveBeenCalledWith([file]);
          done();
        });
      });

      it('should attach existing documents if they are already exists',
        (done) => {
          let file = {};
          let response = [{
            exists: true,
            object: {},
          }];

          spyOn(viewModel, 'checkDocumentsExist')
            .and.returnValue(Promise.resolve(response));
          spyOn(viewModel, 'createDocuments')
            .and.returnValue(Promise.resolve([]));
          spyOn(viewModel, 'useExistingDocuments')
            .and.returnValue(Promise.resolve([]));

          viewModel.mapDocuments([file]).then(() => {
            expect(viewModel.useExistingDocuments)
              .toHaveBeenCalledWith(response);
            done();
          });
        });

      it('should create new and attach existing documents', (done) => {
        let file1 = {id: 1};
        let file2 = {id: 2};
        let files = [file1, file2];

        let existingDocument = {
          gdrive_id: 1,
          exists: true,
          object: {},
        };
        let notExistingDocument = {
          gdrive_id: 2,
          exists: false,
        };

        spyOn(viewModel, 'checkDocumentsExist')
          .and.returnValue(Promise.resolve([
            existingDocument,
            notExistingDocument,
          ]));
        spyOn(viewModel, 'createDocuments')
          .and.returnValue(Promise.resolve([]));
        spyOn(viewModel, 'useExistingDocuments')
          .and.returnValue(Promise.resolve([]));

        viewModel.mapDocuments(files).then(() => {
          expect(viewModel.useExistingDocuments)
            .toHaveBeenCalledWith([existingDocument]);
          expect(viewModel.createDocuments)
            .toHaveBeenCalledWith([file2]);
          done();
        });
      });

      it('should refresh permissions and map documents', (done) => {
        let document1 = {};
        let document2 = {};
        spyOn(viewModel, 'refreshPermissionsAndMap');
        spyOn(viewModel, 'checkDocumentsExist')
          .and.returnValue(Promise.resolve([]));
        spyOn(viewModel, 'createDocuments')
          .and.returnValue([Promise.resolve(document1)]);
        spyOn(viewModel, 'useExistingDocuments')
          .and.returnValue([Promise.resolve(document2)]);

        viewModel.mapDocuments([]).then(() => {
          expect(viewModel.refreshPermissionsAndMap)
            .toHaveBeenCalledWith([document1, document2]);
          done();
        });
      });

      it('should dispatch documentCreateFailed event if save failed',
        (done) => {
          let parentInstance = viewModel.attr('parentInstance');
          spyOn(parentInstance, 'dispatch');
          spyOn(viewModel, 'checkDocumentsExist')
            .and.returnValue(Promise.resolve([]));
          spyOn(viewModel, 'createDocuments')
            .and.returnValue([Promise.reject()]);
          spyOn(viewModel, 'useExistingDocuments')
            .and.returnValue(Promise.resolve([]));

          viewModel.mapDocuments([]).then(() => {
            expect(parentInstance.dispatch)
              .toHaveBeenCalledWith(DOCUMENT_CREATE_FAILED);
            done();
          });
        });
    });

    describe('createDocuments() method', () => {
      it('should dispatch beforeDocumentCreate event before saving document',
        () => {
          let parentInstance = viewModel.attr('parentInstance');
          spyOn(parentInstance, 'dispatch');
          spyOn(Document.prototype, 'save').and.returnValue({});

          viewModel.createDocuments([{}]);

          expect(parentInstance.dispatch)
            .toHaveBeenCalledWith(BEFORE_DOCUMENT_CREATE);
        });

      it('should return array of new documents after saving', () => {
        let newDocument = {};
        spyOn(Document.prototype, 'save').and.returnValue(newDocument);

        const promisesArray = viewModel.createDocuments([{}, {}]);

        promisesArray.forEach((doc) => {
          expect(doc).toBe(newDocument);
        });
      });
    });

    describe('useExistingDocuments() method', () => {
      it('should show confirm modal', () => {
        spyOn(viewModel, 'showConfirm');

        viewModel.useExistingDocuments([{}]);

        expect(viewModel.showConfirm).toHaveBeenCalled();
      });

      it('should add current user to document admins', (done) => {
        let document = {};
        spyOn(viewModel, 'makeAdmin');
        spyOn(viewModel, 'showConfirm').and.returnValue(Promise.resolve());

        viewModel.useExistingDocuments([document]).then(() => {
          expect(viewModel.makeAdmin).toHaveBeenCalledWith([document]);
          done();
        });
      });

      it('should return empty array if confirm modal was closed', (done) => {
        let document = {};
        spyOn(viewModel, 'makeAdmin');
        spyOn(viewModel, 'showConfirm').and.returnValue(Promise.reject());

        viewModel.useExistingDocuments([document]).then((array) => {
          expect(array.length).toBe(0);
          expect(viewModel.makeAdmin).not.toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('openPicker() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'mapDocuments');
      spyOn(viewModel, 'dispatch');
    });

    it('should call uploadFiles method', () => {
      spyOn(pickerUtils, 'uploadFiles').and.returnValue(Promise.resolve());

      viewModel.openPicker();

      expect(pickerUtils.uploadFiles).toHaveBeenCalled();
    });

    it('should call mapDocuments method if file is picked', (done) => {
      let file = {};
      let files = [file];

      spyOn(pickerUtils, 'uploadFiles').and.returnValue(Promise.resolve(files));

      viewModel.openPicker().then(() => {
        expect(viewModel.mapDocuments).toHaveBeenCalledWith([file]);
        done();
      });
    });

    it('should trigger "cancel" event if file is not picked', (done) => {
      spyOn(pickerUtils, 'uploadFiles').and.returnValue(Promise.reject());

      viewModel.openPicker().then(() => {
        expect(viewModel.mapDocuments).not.toHaveBeenCalled();
        expect(viewModel.dispatch).toHaveBeenCalledWith('cancel');
        done();
      });
    });
  });
});
