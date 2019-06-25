/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
  */

import loEvery from 'lodash/every';
import canList from 'can-list';
import canMap from 'can-map';
import {viewModel, events} from '../sub-tree-models';
import childModelsMap from '../child-models-map';
import * as TreeViewUtils from '../../../plugins/utils/tree-view-utils';
import {
  getWidgetConfig,
} from '../../../plugins/utils/widgets-utils';

describe('sub-tree-models component', function () {
  let vm;
  let originalInit;

  beforeEach(function () {
    originalInit = viewModel.prototype.init;
    vm = viewModel.extend({
      init: undefined,
      originalInit: originalInit,
    })();
  });

  describe('setter for selectedModels', function () {
    let selectedModels;
    let modelsList;
    let expectedResult;

    beforeEach(function () {
      modelsList = [
        {name: 'Audit', display: false},
        {name: 'Control', display: false},
        {name: 'Objective', display: false},
        {name: 'Market', display: false},
      ];
      vm.attr('modelsList', new canList(modelsList));
    });
    it('updates values of modelsList', function () {
      selectedModels = ['Audit', 'Market'];
      expectedResult = modelsList.map(function (item) {
        item.display = (selectedModels.indexOf(item.name) !== -1);
        return item;
      });
      vm.attr('selectedModels', selectedModels);
      expect(vm.attr('modelsList').serialize()).toEqual(expectedResult);
    });
  });

  describe('init() method', function () {
    let modelsList = 'mockList';
    let defaultModels = {selected: 'mockDefaultModels'};

    beforeEach(function () {
      spyOn(vm, 'getDisplayModels').and.returnValue(modelsList);
      spyOn(TreeViewUtils, 'getModelsForSubTier')
        .and.returnValue(defaultModels);
      spyOn(childModelsMap.attr('container'), 'bind');
    });

    it('sets modelsList', function () {
      vm.attr('type', 'Program');
      vm.attr('modelsList', undefined);
      vm.originalInit();
      expect(vm.attr('modelsList')).toEqual(modelsList);
    });

    it('subscribes for changes of childModelsMap.container for its type',
      function () {
        vm.originalInit();
        expect(childModelsMap.attr('container').bind)
          .toHaveBeenCalledWith(vm.attr('type'), jasmine.any(Function));
      });
  });

  describe('get() of displayModelsList', function () {
    it('splits widgetNames', function () {
      let result;
      vm.attr('modelsList', new canList([
        {widgetName: 'Child Programs'},
        {widgetName: 'MockName'},
        {widgetName: 'Singlelinename'},
      ]));

      result = vm.attr('displayModelsList');

      expect(result[0].displayName).toEqual('Child Programs');
      expect(result[1].displayName).toEqual('Mock Name');
      expect(result[2].displayName).toEqual('Singlelinename');
    });

    it('sorts model names', function () {
      let result;
      vm.attr('modelsList', new canList([
        {widgetName: 'Metrics'},
        {widgetName: 'Control'},
        {widgetName: 'Risk'},
        {widgetName: 'Audit'},
        {widgetName: 'Child Programs'},
      ]));

      result = vm.attr('displayModelsList');

      expect(result[0].displayName).toEqual('Audit');
      expect(result[1].displayName).toEqual('Child Programs');
      expect(result[2].displayName).toEqual('Control');
      expect(result[3].displayName).toEqual('Metrics');
      expect(result[4].displayName).toEqual('Risk');
    });
  });

  describe('activate() method', function () {
    it('sets true to viewModel.isActive', function () {
      vm.attr('isActive', false);

      vm.activate();
      expect(vm.attr('isActive')).toBe(true);
    });
  });

  describe('setVisibility() method', function () {
    let event;
    let selectedModels;

    beforeEach(function () {
      selectedModels = 'models';
      event = {
        stopPropagation: jasmine.createSpy(),
      };
      spyOn(vm, 'getSelectedModels').and.returnValue(selectedModels);
      vm.attr('type', 'Program');
      spyOn(childModelsMap, 'setModels');
    });

    it('sets selectedModels to childModelsMap', function () {
      vm.setVisibility(event);

      expect(childModelsMap.setModels)
        .toHaveBeenCalledWith(vm.attr('type'), selectedModels);
    });

    it('sets false to viewModel.isActive', function () {
      vm.attr('isActive', true);

      vm.setVisibility(event);
      expect(vm.attr('isActive')).toBe(false);
    });
  });

  describe('getDisplayModels() method', function () {
    let defaultModels;
    let expectedResult;
    let savedModels;
    let spy;
    function generateResult(availableModels, selectedModels) {
      return availableModels.map(function (model) {
        return {
          widgetName: getWidgetConfig(model).widgetName,
          name: model,
          display: selectedModels.indexOf(model) !== -1,
        };
      });
    }

    beforeEach(function () {
      defaultModels = {
        available: ['Audit', 'Control', 'Objective', 'Market'],
        selected: ['Audit'],
      };
      vm.attr('type', 'Program');
      spyOn(TreeViewUtils, 'getModelsForSubTier')
        .and.returnValue(defaultModels);
      spy = spyOn(childModelsMap, 'getModels');
    });

    it('returns generated displayList using savedModels if it is defined',
      function () {
        savedModels = ['Objective', 'Market'];
        spy.and.returnValue(savedModels);
        expectedResult = generateResult(defaultModels.available, savedModels);
        expect(vm.getDisplayModels()).toEqual(expectedResult);
      });

    it('returns generated displayList using defaultModels' +
    ' if savedModels is undefined', function () {
      spy.and.returnValue(null);
      expectedResult =
        generateResult(defaultModels.available, defaultModels.selected);
      expect(vm.getDisplayModels()).toEqual(expectedResult);
    });
  });

  describe('getSelectedModels() method', function () {
    beforeEach(function () {
      const modelsList = new canList([
        {name: 'Audit', display: true},
        {name: 'Control', display: true},
        {name: 'Objective', display: false},
        {name: 'Market', display: true},
      ]);
      vm.attr('modelsList', modelsList);
    });

    it('returns selected models widgetIds', function () {
      const expectedResult = ['Audit', 'Control', 'Market'];
      expect(vm.getSelectedModels().serialize()).toEqual(expectedResult);
    });
  });

  describe('selectAll(), selectNone() methods', function () {
    let modelsList;
    let event;

    beforeEach(function () {
      modelsList = new canList([
        {name: 'Audit', display: true},
        {name: 'Control', display: true},
        {name: 'Objective', display: false},
        {name: 'Market', display: true},
      ]);
      vm.attr('modelsList', modelsList);
      event = {
        stopPropagation: jasmine.createSpy(),
      };
    });

    it('selectAll() sets display true to all models in list', function () {
      let result;

      vm.selectAll(event);
      result = loEvery(vm.attr('modelsList'), function (item) {
        return item.display === true;
      });
      expect(result).toBe(true);
    });

    it('selectNone() sets display false to all models in list', function () {
      let result;

      vm.selectNone(event);
      result = loEvery(vm.attr('modelsList'), function (item) {
        return item.display === false;
      });
      expect(result).toBe(true);
    });
  });

  describe('".sub-tree-models mouseleave" handler', function () {
    let handler;
    let viewModel;

    beforeEach(function () {
      viewModel = new canMap();
      handler = events['.sub-tree-models mouseleave'].bind({
        viewModel: viewModel,
      });
    });

    it('sets false to viewModel.isActive', function () {
      viewModel.attr('isActive', true);

      handler();
      expect(viewModel.attr('isActive', false));
    });
  });
});
