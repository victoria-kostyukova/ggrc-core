/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loAssign from 'lodash/assign';
import canMap from 'can-map';
import * as ModalsUtils from '../../../plugins/utils/modals';
import * as WidgetsUtils from '../../../plugins/utils/widgets-utils';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../snapshot-scope-update';

describe('snapshot-scope-update component', function () {
  'use strict';

  let updaterViewModel;
  let containerVM;
  let originalHtml;

  beforeAll(function () {
    originalHtml = document.body.innerHTML;
  });

  afterAll(function () {
    document.body.innerHTML = originalHtml;
  });

  beforeEach(function () {
    updaterViewModel = getComponentVM(Component);
    document.body.innerHTML =
      '<tree-widget-container></tree-widget-container>' +
      '<tree-widget-container></tree-widget-container>';
    containerVM = {
      setRefreshFlag: jasmine.createSpy('setRefreshFlag'),
      display: jasmine.createSpy('display'),
      model: {
        model_singular: 'Control',
      },
    };
    loAssign(updaterViewModel, {
      instance: new canMap({
        title: 'TITLE',
        refresh: jasmine
          .createSpy('refresh'),
        save: jasmine.createSpy('save'),
      }),
    });
    spyOn($.prototype, 'viewModel').and.returnValue(containerVM);
  });

  describe('upsertIt() method', function () {
    let method;

    beforeEach(function () {
      method = updaterViewModel.upsertIt.bind(updaterViewModel);
      spyOn(ModalsUtils, 'confirm').and.callThrough();
    });

    describe('calls confirm method', function () {
      it('one time', function () {
        method(updaterViewModel);

        expect(ModalsUtils.confirm).toHaveBeenCalled();
      });

      it('with given params', function () {
        method(updaterViewModel);

        expect(ModalsUtils.confirm.calls.argsFor(0)).toEqual([
          jasmine.objectContaining({
            instance: updaterViewModel.instance,
            button_view: ModalsUtils.BUTTON_VIEW_CONFIRM_CANCEL,
            skip_refresh: true,
          }),
          jasmine.any(Function),
          jasmine.any(Function),
        ]);
      });
    });
  });

  describe('_refreshContainers() method', function () {
    let method;
    let refreshDfd;

    beforeEach(function () {
      method = updaterViewModel._refreshContainers.bind(updaterViewModel);
      refreshDfd = new $.Deferred().resolve();
      spyOn(WidgetsUtils, 'refreshCounts').and.returnValue(refreshDfd);
    });

    it('refreshes all page counters', function (done) {
      let result = method();
      result.then(
        function () {
          expect(WidgetsUtils.refreshCounts).toHaveBeenCalled();
          done();
        }
      );
    });

    it('sets refresh flag for each tree-widget-container that contains' +
    ' snapshots', function (done) {
      method().then(() => {
        $('tree-widget-container').each(function () {
          let viewModel = $(this).viewModel();
          expect(viewModel.setRefreshFlag).toHaveBeenCalledWith(true);
          done();
        });
      });
    });

    it('does not set refresh flag for each tree-widget-container that does ' +
    'not contain snapshots', async function () {
      loAssign(containerVM.model, {model_singular: 'Something'});
      await method();
      $('tree-widget-container').each(function () {
        let viewModel = $(this).viewModel();
        expect(viewModel.setRefreshFlag).not.toHaveBeenCalled();
      });
    });
  });

  describe('_success() method', function () {
    let method;
    let refreshDfd;

    beforeEach(function () {
      method = updaterViewModel._success.bind(updaterViewModel);
      refreshDfd = new $.Deferred();
      updaterViewModel.instance.refresh.and.returnValue(refreshDfd);
      spyOn(updaterViewModel, '_showSuccessMsg');
      spyOn(updaterViewModel, '_showProgressWindow');
    });

    it('refreshes the instance attached to the component', function () {
      method();
      expect(updaterViewModel.instance.refresh).toHaveBeenCalled();
    });

    describe('after instance refresh', function () {
      it('saves the instance attached to the component', function (done) {
        let methodChain = method();
        refreshDfd.resolve().then(() => {
          methodChain.then(() => {
            expect(updaterViewModel.instance.save).toHaveBeenCalled();
            done();
          });
        });
      });

      it('sets snapshots attr for the instance', function (done) {
        let expectedResult = {
          operation: 'upsert',
        };
        let wrongValue = {
          operation: 'wrongValue',
        };
        updaterViewModel.instance.attr('snapshots', wrongValue);
        let methodChain = method();
        refreshDfd.resolve().then(() => {
          methodChain.then(() => {
            expect(updaterViewModel.instance.attr('snapshots'))
              .toEqual(
                jasmine.objectContaining(expectedResult)
              );
            done();
          });
        });
      });

      it('shows progress message',
        function (done) {
          let methodChain = method();
          refreshDfd.resolve().then(() => {
            methodChain.then(() => {
              expect(updaterViewModel._showProgressWindow).toHaveBeenCalled();
              done();
            });
          });
        });

      it('shows success message',
        function (done) {
          let methodChain = method();
          refreshDfd.resolve().then(() => {
            methodChain.then(() => {
              expect(updaterViewModel._showSuccessMsg).toHaveBeenCalled();
              done();
            });
          });
        });
    });
  });
});
