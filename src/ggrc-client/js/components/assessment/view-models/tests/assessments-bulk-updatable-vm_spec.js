/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import ViewModel from '../assessments-bulk-updatable-vm';
import * as AdvancedSearchUtils from '../../../../plugins/utils/advanced-search-utils';
import * as TreeViewUtils from '../../../../plugins/utils/tree-view-utils';
import * as NotifierUtils from '../../../../plugins/utils/notifiers-utils';
import * as BackgroundTaskUtils from '../../../../plugins/utils/background-task-utils';
import * as ErrorUtils from '../../../../plugins/utils/errors-utils';

describe('assessments-bulk-updatable-vm component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = new ViewModel();
  });

  describe('initDefaultFilter() method', () => {
    beforeEach(() => {
      spyOn(AdvancedSearchUtils, 'setDefaultStatusConfig').and.returnValue({});
    });

    it('calls setDefaultStatusConfig() with type and statesCollectionKey attrs',
      () => {
        viewModel.attr('type', 'Assessment');
        viewModel.attr('statesCollectionKey', 'fakeStatesCollectionKey');

        viewModel.initDefaultFilter({
          attribute: 'attr',
          options: {},
        });

        expect(AdvancedSearchUtils.setDefaultStatusConfig)
          .toHaveBeenCalledWith('Assessment', 'fakeStatesCollectionKey');
      });

    it('calls create.state() with specified params', () => {
      spyOn(AdvancedSearchUtils.create, 'state')
        .and.returnValue('fakeState');
      viewModel.initDefaultFilter({
        attribute: 'attr',
        options: {},
      });

      expect(AdvancedSearchUtils.create.state)
        .toHaveBeenCalledWith({});
    });

    it('calls create.operator() with specified params', () => {
      spyOn(AdvancedSearchUtils.create, 'operator')
        .and.returnValue('fakeOperator');
      viewModel.initDefaultFilter({
        attribute: 'attr',
        options: {},
      });

      expect(AdvancedSearchUtils.create.operator)
        .toHaveBeenCalledWith('AND', null);
    });

    it('calls create.attribute() with specified params', () => {
      spyOn(AdvancedSearchUtils.create, 'attribute')
        .and.returnValue('fakeAttribute');
      viewModel.initDefaultFilter({
        attribute: 'attr',
        options: {},
      });

      expect(AdvancedSearchUtils.create.attribute)
        .toHaveBeenCalledWith('attr', {});
    });

    it('sets filterItems attr',
      () => {
        viewModel.attr('filterItems', []);
        spyOn(AdvancedSearchUtils.create, 'state')
          .and.returnValue('fakeState');
        spyOn(AdvancedSearchUtils.create, 'operator')
          .and.returnValue('fakeOperator');
        spyOn(AdvancedSearchUtils.create, 'attribute')
          .and.returnValue('fakeAttribute');
        viewModel.initDefaultFilter({
          attribute: 'attr',
          options: {},
        });

        expect(viewModel.attr('filterItems').serialize())
          .toEqual(['fakeState', 'fakeOperator', 'fakeAttribute']);
      });

    it('sets defaultFilterItems attr',
      () => {
        viewModel.attr('defaultFilterItems', []);
        spyOn(AdvancedSearchUtils.create, 'state')
          .and.returnValue('fakeState');
        spyOn(AdvancedSearchUtils.create, 'operator')
          .and.returnValue('fakeOperator');
        spyOn(AdvancedSearchUtils.create, 'attribute')
          .and.returnValue('fakeAttribute');
        viewModel.initDefaultFilter({
          attribute: 'attr',
          options: {},
        });

        expect(viewModel.attr('defaultFilterItems').serialize())
          .toEqual(['fakeState', 'fakeOperator', 'fakeAttribute']);
      });
  });

  describe('initFilterAttributes() method', () => {
    it('calls getAvailableAttributes() with type attr', () => {
      viewModel.attr('type', 'Assessment');
      spyOn(TreeViewUtils, 'getAvailableAttributes').and.returnValue([]);
      viewModel.initFilterAttributes();

      expect(TreeViewUtils.getAvailableAttributes)
        .toHaveBeenCalledWith('Assessment');
    });

    it('sets filtered attributes to filterAttributes attr', () => {
      viewModel.attr('type', 'Assessment');
      viewModel.attr('filterAttributes', []);
      spyOn(TreeViewUtils, 'getAvailableAttributes').and.returnValue([{
        attr_name: 'status',
      }, {
        attr_name: 'fakeAttrName1',
      }, {
        attr_name: 'fakeAttrName2',
      }]);
      viewModel.initFilterAttributes();

      expect(viewModel.attr('filterAttributes').serialize())
        .toEqual([{
          attr_name: 'fakeAttrName1',
        }, {
          attr_name: 'fakeAttrName2',
        }]);
    });
  });

  describe('trackBackgroundTask() method', () => {
    it('calls notifier with specified params', () => {
      spyOn(NotifierUtils, 'notifier');
      viewModel.trackBackgroundTask();

      expect(NotifierUtils.notifier).toHaveBeenCalledWith(
        'progress',
        'Your bulk update is submitted. ' +
        'Once it is done you will get a notification. ' +
        'You can continue working with the app.');
    });

    it('calls trackStatus() with specified params', () => {
      spyOn(BackgroundTaskUtils, 'trackStatus');
      viewModel.trackBackgroundTask(123);

      expect(BackgroundTaskUtils.trackStatus).toHaveBeenCalledWith(
        '/api/background_tasks/123',
        jasmine.any(Function),
        jasmine.any(Function));
    });

    it('checks second param of trackStatus()', () => {
      spyOn(BackgroundTaskUtils, 'trackStatus');
      spyOn(viewModel, 'onSuccessHandler').and.returnValue(1);
      viewModel.trackBackgroundTask(123);

      expect(BackgroundTaskUtils.trackStatus.calls.argsFor(0)[1]()).toBe(1);
    });

    it('checks third param of trackStatus()', () => {
      spyOn(BackgroundTaskUtils, 'trackStatus');
      spyOn(viewModel, 'onFailureHandler').and.returnValue(2);
      viewModel.trackBackgroundTask(123);

      expect(BackgroundTaskUtils.trackStatus.calls.argsFor(0)[2]()).toBe(2);
    });
  });

  describe('handleBulkUpdateErrors() method', () => {
    it('calls connectionLostNotifier() if connection is lost', () => {
      spyOn(ErrorUtils, 'isConnectionLost').and.returnValue(true);
      spyOn(NotifierUtils, 'connectionLostNotifier');
      viewModel.handleBulkUpdateErrors();

      expect(NotifierUtils.connectionLostNotifier).toHaveBeenCalled();
    });

    it('calls notifier() with specified params if connection is not lost',
      () => {
        spyOn(ErrorUtils, 'isConnectionLost').and.returnValue(false);
        spyOn(NotifierUtils, 'notifier');
        viewModel.handleBulkUpdateErrors();

        expect(NotifierUtils.notifier).toHaveBeenCalledWith(
          'error',
          'Bulk update is failed. ' +
        'Please refresh the page and start bulk update again.');
      });
  });

  describe('onSuccessHandler() method', () => {
    it('calls notifier() with specified params', () => {
      spyOn(NotifierUtils, 'notifier');
      viewModel.onSuccessHandler();

      expect(NotifierUtils.notifier).toHaveBeenCalledWith(
        'success',
        'Bulk update is finished successfully. {reload_link}',
        {reloadLink: window.location.href});
    });
  });

  describe('onFailureHandler() method', () => {
    it('calls notifier() with specified params', () => {
      spyOn(NotifierUtils, 'notifier');
      viewModel.onFailureHandler();

      expect(NotifierUtils.notifier).toHaveBeenCalledWith(
        'error',
        'Bulk update is failed.');
    });
  });

  describe('closeModal() method', () => {
    it('calls trigger() with "click" param', () => {
      let modalDismiss = {
        trigger: jasmine.createSpy(),
      };
      let el = {
        find: () => modalDismiss,
      };
      viewModel.attr('element', el);
      viewModel.closeModal();

      expect(modalDismiss.trigger).toHaveBeenCalledWith('click');
    });
  });
});
