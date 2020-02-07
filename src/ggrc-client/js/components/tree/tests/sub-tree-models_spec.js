/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
  */

import loEvery from 'lodash/every';
import canDefineList from 'can-define/list/list';
import canMap from 'can-map';
import {ViewModel, events} from '../sub-tree-models';
import childModelsMap from '../child-models-map';
import * as TreeViewUtils from '../../../plugins/utils/tree-view-utils';
import {
  getWidgetConfig,
} from '../../../plugins/utils/widgets-utils';

describe('sub-tree-models component', () => {
  let vm;
  let originalInit;

  beforeEach(() => {
    originalInit = ViewModel.prototype.init;
    vm = ViewModel.extend({seal: false}, {
      init: undefined,
      originalInit: originalInit,
    })();
  });

  describe('setter for selectedModels', () => {
    let selectedModels;
    let modelsList;
    let expectedResult;

    beforeEach(() => {
      modelsList = [
        {name: 'Audit', display: false},
        {name: 'Control', display: false},
        {name: 'Objective', display: false},
        {name: 'Market', display: false},
      ];
      vm.modelsList = new canDefineList(modelsList);
    });
    it('updates values of modelsList', () => {
      selectedModels = ['Audit', 'Market'];
      expectedResult = modelsList.map((item) => {
        item.display = (selectedModels.indexOf(item.name) !== -1);
        return item;
      });
      vm.selectedModels = selectedModels;
      expect(vm.modelsList.serialize()).toEqual(expectedResult);
    });
  });

  describe('init() method', () => {
    let modelsList = 'mockList';
    let defaultModels = {selected: 'mockDefaultModels'};

    beforeEach(() => {
      spyOn(vm, 'getDisplayModels').and.returnValue(modelsList);
      spyOn(TreeViewUtils, 'getModelsForSubTier')
        .and.returnValue(defaultModels);
      spyOn(childModelsMap.container, 'bind');
    });

    it('sets modelsList', () => {
      vm.type = 'Program';
      vm.modelsList = undefined;
      vm.originalInit();
      expect(vm.modelsList).toEqual(modelsList);
    });

    it('subscribes for changes of childModelsMap.container for its type',
      () => {
        vm.originalInit();
        expect(childModelsMap.container.bind)
          .toHaveBeenCalledWith(vm.type, jasmine.any(Function));
      });
  });

  describe('get() of displayModelsList', () => {
    it('splits widgetNames', () => {
      let result;
      vm.modelsList = new canDefineList([
        {widgetName: 'Child Programs'},
        {widgetName: 'MockName'},
        {widgetName: 'Singlelinename'},
      ]);

      result = vm.displayModelsList;

      expect(result[0].displayName).toEqual('Child Programs');
      expect(result[1].displayName).toEqual('Mock Name');
      expect(result[2].displayName).toEqual('Singlelinename');
    });

    it('sorts model names', () => {
      let result;
      vm.modelsList = new canDefineList([
        {widgetName: 'Metrics'},
        {widgetName: 'Control'},
        {widgetName: 'Risk'},
        {widgetName: 'Audit'},
        {widgetName: 'Child Programs'},
      ]);

      result = vm.displayModelsList;

      expect(result[0].displayName).toEqual('Audit');
      expect(result[1].displayName).toEqual('Child Programs');
      expect(result[2].displayName).toEqual('Control');
      expect(result[3].displayName).toEqual('Metrics');
      expect(result[4].displayName).toEqual('Risk');
    });
  });

  describe('activate() method', () => {
    it('sets true to ViewModel.isActive', () => {
      vm.isActive = false;

      vm.activate();
      expect(vm.isActive).toBe(true);
    });
  });

  describe('setVisibility() method', () => {
    let event;
    let selectedModels;

    beforeEach(() => {
      selectedModels = 'models';
      event = {
        stopPropagation: jasmine.createSpy(),
      };
      spyOn(vm, 'getSelectedModels')
        .and.returnValue(selectedModels);
      vm.type = 'Program';
      spyOn(childModelsMap, 'setModels');
    });

    it('sets selectedModels to childModelsMap', () => {
      vm.setVisibility(event);

      expect(childModelsMap.setModels)
        .toHaveBeenCalledWith(vm.type, selectedModels);
    });

    it('sets false to ViewModel.isActive', () => {
      vm.isActive = true;

      vm.setVisibility(event);
      expect(vm.isActive).toBe(false);
    });
  });

  describe('getDisplayModels() method', () => {
    let defaultModels;
    let expectedResult;
    let savedModels;
    let spy;
    function generateResult(availableModels, selectedModels) {
      return availableModels.map((model) => {
        return {
          widgetName: getWidgetConfig(model).widgetName,
          name: model,
          display: selectedModels.indexOf(model) !== -1,
        };
      });
    }

    beforeEach(() => {
      defaultModels = {
        available: ['Audit', 'Control', 'Objective', 'Market'],
        selected: ['Audit'],
      };
      vm.type = 'Program';
      spyOn(TreeViewUtils, 'getModelsForSubTier')
        .and.returnValue(defaultModels);
      spy = spyOn(childModelsMap, 'getModels');
    });

    it('returns generated displayList using savedModels if it is defined',
      () => {
        savedModels = ['Objective', 'Market'];
        spy.and.returnValue(savedModels);
        expectedResult = generateResult(defaultModels.available, savedModels);
        expect(vm.getDisplayModels()).toEqual(expectedResult);
      });

    it('returns generated displayList using defaultModels' +
    ' if savedModels is undefined', () => {
      spy.and.returnValue(null);
      expectedResult =
        generateResult(defaultModels.available, defaultModels.selected);
      expect(vm.getDisplayModels()).toEqual(expectedResult);
    });
  });

  describe('getSelectedModels() method', () => {
    beforeEach(() => {
      const modelsList = new canDefineList([
        {name: 'Audit', display: true},
        {name: 'Control', display: true},
        {name: 'Objective', display: false},
        {name: 'Market', display: true},
      ]);
      vm.modelsList = modelsList;
    });

    it('returns selected models widgetIds', () => {
      const expectedResult = ['Audit', 'Control', 'Market'];
      expect(vm.getSelectedModels().serialize()).toEqual(expectedResult);
    });
  });

  describe('selectAll(), selectNone() methods', () => {
    let modelsList;
    let event;

    beforeEach(() => {
      modelsList = new canDefineList([
        {name: 'Audit', display: true},
        {name: 'Control', display: true},
        {name: 'Objective', display: false},
        {name: 'Market', display: true},
      ]);
      vm.modelsList = modelsList;
      event = {
        stopPropagation: jasmine.createSpy(),
      };
    });

    it('selectAll() sets display true to all models in list', () => {
      let result;

      vm.selectAll(event);
      result = loEvery(vm.modelsList, (item) => {
        return item.display === true;
      });
      expect(result).toBe(true);
    });

    it('selectNone() sets display false to all models in list', () => {
      let result;

      vm.selectNone(event);
      result = loEvery(vm.modelsList, (item) => {
        return item.display === false;
      });
      expect(result).toBe(true);
    });
  });

  describe('".sub-tree-models mouseleave" handler', () => {
    let handler;
    let ViewModel;

    beforeEach(() => {
      ViewModel = new canMap();
      handler = events['.sub-tree-models mouseleave'].bind({
        viewModel: ViewModel,
      });
    });

    it('sets false to ViewModel.isActive', () => {
      ViewModel.isActive = true;

      handler();
      expect(ViewModel.isActive = false);
    });
  });
});
