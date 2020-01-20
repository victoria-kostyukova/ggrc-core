/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import * as ModalsUtils from '../../../plugins/utils/modals';
import * as TemplatesUtils from '../../../plugins/utils/template-utils';
import * as WidgetsUtils from '../../../plugins/utils/widgets-utils';
import * as NotifiersUtils from '../../../plugins/utils/notifiers-utils';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../snapshot-scope-update';
import pubSub from '../../../pub-sub';

describe('snapshot-scope-update component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    Object.assign(viewModel, {
      instance: new canMap({
        title: 'TITLE',
        refresh: jasmine.createSpy('refresh'),
        save: jasmine.createSpy('save'),
      }),
    });
  });

  describe('upsertIt() method', () => {
    beforeEach(() => {
      spyOn(ModalsUtils, 'confirm').and.callThrough();
    });

    describe('calls confirm method', () => {
      it('one time', () => {
        viewModel.upsertIt(viewModel);

        expect(ModalsUtils.confirm).toHaveBeenCalled();
      });

      it('with given params', () => {
        viewModel.upsertIt(viewModel);

        expect(ModalsUtils.confirm.calls.argsFor(0)).toEqual([
          jasmine.objectContaining({
            instance: viewModel.instance,
            button_view: TemplatesUtils.BUTTON_VIEW_CONFIRM_CANCEL,
            skip_refresh: true,
          }),
          jasmine.any(Function),
        ]);
      });
    });
  });

  describe('refreshContainers() method', () => {
    beforeEach(() => {
      let refreshDfd = new $.Deferred().resolve();
      spyOn(WidgetsUtils, 'refreshCounts').and.returnValue(refreshDfd);
    });

    it('refreshes all page counters', (done) => {
      let result = viewModel.refreshContainers();
      result.then(
        function () {
          expect(WidgetsUtils.refreshCounts).toHaveBeenCalled();
          done();
        }
      );
    });

    it('sets refresh flag for each tree-widget-container that contains' +
    ' snapshots', () => {
      spyOn(pubSub, 'dispatch');

      viewModel.refreshContainers();

      expect(pubSub.dispatch).toHaveBeenCalledWith({
        type: 'refetchOnce',
        modelNames: GGRC.config.snapshotable_objects,
      });
    });
  });

  describe('success() method', () => {
    beforeEach(function () {
      let refreshDfd = new $.Deferred().resolve();
      viewModel.instance.refresh.and.returnValue(refreshDfd);
      spyOn(NotifiersUtils, 'notifier');
    });

    it('refreshes the instance attached to the component', () => {
      viewModel.success();
      expect(viewModel.instance.refresh).toHaveBeenCalled();
    });

    describe('after instance refresh', () => {
      it('saves the instance attached to the component', (done) => {
        viewModel.success().then(() => {
          expect(viewModel.instance.save).toHaveBeenCalled();
          done();
        });
      });

      it('sets snapshots attr for the instance', (done) => {
        let expectedResult = {
          operation: 'upsert',
        };
        let wrongValue = {
          operation: 'wrongValue',
        };
        viewModel.instance.attr('snapshots', wrongValue);
        viewModel.success().then(() => {
          expect(viewModel.instance.attr('snapshots'))
            .toEqual(
              jasmine.objectContaining(expectedResult)
            );
          done();
        });
      });

      it('shows progress message', () => {
        viewModel.success();
        expect(NotifiersUtils.notifier)
          .toHaveBeenCalledWith('progress', jasmine.any(String));
      });

      it('shows success message', (done) => {
        viewModel.success().then(() => {
          expect(NotifiersUtils.notifier)
            .toHaveBeenCalledWith('success', jasmine.any(String));
          done();
        });
      });
    });
  });
});
