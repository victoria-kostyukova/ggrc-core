/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import canModel from 'can-model';
import Component from './delete-button';
import {getComponentVM} from '../../../js_specs/spec-helpers';
import {Snapshot} from '../../models/service-models';
import * as ErrorsUtils from '../../plugins/utils/errors-utils';
import * as ModalsUtils from '../../plugins/utils/modals';
import * as TemplatesUtils from '../../plugins/utils/template-utils';
import * as AjaxUtils from '../../plugins/ajax-extensions';

describe('delete-button component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('setter of "instance"', () => {
    let cacheBackup;
    let instance;

    beforeAll(() => {
      cacheBackup = Object.assign({}, Snapshot.cache);
    });

    afterAll(() => {
      Snapshot.cache = cacheBackup;
    });

    it('returns new instance of Snapshot if it is not instance of canModel ' +
      'and it is type is "Snapshot"', () => {
      instance = new canMap({
        id: 1,
        type: 'Snapshot',
      });
      vm.attr('instance', instance);

      expect(instance instanceof canModel).toBe(false);
      expect(vm.attr('instance')).toEqual(jasmine.any(Snapshot));
      expect(vm.attr('instance')).toEqual(jasmine.objectContaining({
        id: 1,
        type: 'Snapshot',
      }));
    });

    it('returns setted instance if it is not instance of canModel ' +
      'and it is type is not "Snapshot"', () => {
      instance = new canMap({
        id: 2,
        type: 'mockType',
      });
      vm.attr('instance', instance);

      expect(instance instanceof canModel).toBe(false);
      expect(vm.attr('instance')).toEqual(instance);
    });

    it('returns setted instance if it is instance of canModel ' +
      'and it is type is "Snapshot"', () => {
      instance = new canModel({
        id: 3,
        type: 'Snapshot',
      });
      vm.attr('instance', instance);

      expect(instance instanceof canModel).toBe(true);
      expect(vm.attr('instance')).toEqual(instance);
    });

    it('returns setted instance if it is instance of canModel ' +
      'and it is not type of "Snapshot"', () => {
      instance = new canModel({
        id: 4,
        type: 'mockType',
      });
      vm.attr('instance', instance);

      expect(instance instanceof canModel).toBe(true);
      expect(vm.attr('instance')).toBe(instance);
    });
  });

  describe('onConfirm() method', () => {
    let instance;
    let refreshDfd;
    let destroyDfd;

    beforeEach(() => {
      refreshDfd = $.Deferred();
      destroyDfd = $.Deferred();
      instance = new canMap({
        refresh: jasmine.createSpy('refresh').and.returnValue(refreshDfd),
        destroy: jasmine.createSpy('destroy').and.returnValue(destroyDfd),
      });
      vm.attr('instance', instance);

      spyOn(vm, 'fetchRelatedObjects');
      spyOn(ErrorsUtils, 'handleAjaxError');
    });

    it('refreshes instance', () => {
      vm.onConfirm();

      expect(instance.refresh).toHaveBeenCalled();
    });

    describe('after refresh of instance', () => {
      beforeEach(() => {
        refreshDfd.resolve();
      });

      it('calls destroy of instance', (done) => {
        vm.onConfirm();

        refreshDfd.then(() => {
          expect(instance.destroy).toHaveBeenCalled();
          done();
        });
      });

      describe('after destroy of instance in case of error', () => {
        it('calls "fetchRelatedObjects" if error.status is 409', (done) => {
          let onConfirmChain = vm.onConfirm();
          destroyDfd.reject({status: 409});

          onConfirmChain.then(() => {
            destroyDfd.fail(() => {
              expect(vm.fetchRelatedObjects).toHaveBeenCalled();
              done();
            });
          });
        });

        it('calls handleAjaxError if error.status is not 409', (done) => {
          const error = {};
          let onConfirmChain = vm.onConfirm();
          destroyDfd.reject(error);

          onConfirmChain.then(() => {
            destroyDfd.fail(() => {
              expect(ErrorsUtils.handleAjaxError).toHaveBeenCalledWith(error);
              done();
            });
          });
        });
      });
    });

    it('returns Deferred object', () => {
      const result = vm.onConfirm();
      expect(result.always).toEqual(jasmine.any(Function));
    });
  });

  describe('fetchRelatedObjects() method', () => {
    let getDfd;

    beforeEach(() => {
      getDfd = $.Deferred();
      spyOn(AjaxUtils, 'ggrcGet').and.returnValue(getDfd);
    });

    it('fetches related objects for instance', () => {
      const instance = {id: 1};
      vm.attr('instance', instance);
      const url = `/api/snapshots/${instance.id}/related_objects`;
      vm.fetchRelatedObjects();

      expect(AjaxUtils.ggrcGet).toHaveBeenCalledWith(url);
    });

    describe('after data fetch', () => {
      let rawData;
      let composedData;

      beforeEach(() => {
        rawData = {};
        getDfd.resolve(rawData);

        spyOn(ModalsUtils, 'confirm');
        composedData = {
          relatedToOriginal: [1, 2, 3],
          relatedToSnapshot: [4, 5, 6],
        };
        spyOn(vm, 'composeData').and.returnValue(composedData);
      });

      it('calls confirm modal with specified settings', (done) => {
        let originalObject = 'mockContent';
        vm.attr('instance', {
          revision: {content: originalObject},
        });
        let expectedSettings = {
          modal_title: 'Warning',
          originalObject,
          relatedToOriginal: composedData.relatedToOriginal,
          relatedToSnapshot: composedData.relatedToSnapshot,
          content_view: '/modals/snapshot-related-objects.stache',
          button_view: TemplatesUtils.BUTTON_VIEW_CLOSE,
        };
        vm.fetchRelatedObjects();

        getDfd.then(() => {
          expect(ModalsUtils.confirm).toHaveBeenCalledWith(expectedSettings);
          done();
        });
      });
    });
  });

  describe('composeData(rawData) method', () => {
    describe('returns object with "relatedToSnapshot" array', () => {
      it('which contains issues from rawData if they are present', () => {
        const rawData = {
          Issue: [1, 2, 3],
        };
        const expectedResult = [...rawData.Issue];
        const result = vm.composeData(rawData).relatedToSnapshot;

        expect(result).toEqual(expectedResult);
      });

      it('which contains assessments from rawData if they are present', () => {
        const rawData = {
          Assessment: [4, 5, 6],
        };
        const expectedResult = [...rawData.Assessment];
        const result = vm.composeData(rawData).relatedToSnapshot;

        expect(result).toEqual(expectedResult);
      });

      it('which contains assessments and issues from rawData ' +
      'if they both are present', () => {
        const rawData = {
          Issue: [1, 2, 3],
          Assessment: [4, 5, 6],
        };
        const expectedResult = [...rawData.Assessment, ...rawData.Issue];
        const result = vm.composeData(rawData).relatedToSnapshot;

        expect(result).toEqual(expectedResult);
      });
    });

    it('returns object with empty "relatedToSnapshot" array ' +
    'if assessments and issues are not present in rawData', () => {
      const rawData = {
        Snapshot: [7, 8, 9],
      };
      const result = vm.composeData(rawData).relatedToSnapshot;

      expect(result).toEqual([]);
    });

    describe('returns object with "relatedToOriginal" array', () => {
      it('which contains snapshots from rawData ' +
      'if they are present', () => {
        const rawData = {
          Snapshot: [7, 8, 9],
        };
        const expectedResult = [...rawData.Snapshot];
        const result = vm.composeData(rawData).relatedToOriginal;

        expect(result).toEqual(expectedResult);
      });
    });

    it('returns object with empty "relatedToOriginal" array ' +
    'if snapshots are not present in rawData', () => {
      const rawData = {
        Issue: [1, 2, 3],
        Assessment: [4, 5, 6],
      };
      const result = vm.composeData(rawData).relatedToOriginal;

      expect(result).toEqual([]);
    });
  });

  describe('click() handler', () => {
    let method;
    let viewModel;

    beforeEach(() => {
      viewModel = {
        confirmDelete: jasmine.createSpy('confirmDelete'),
      };
      method = Component.prototype.events.click.bind({viewModel});
    });

    it('calls confirmDelete method of viewModel', () => {
      method();

      expect(viewModel.confirmDelete).toHaveBeenCalled();
    });
  });
});
