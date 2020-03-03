/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loEvery from 'lodash/every';
import canDefineMap from 'can-define/map/map';
import ObjectOperationsBaseVM from '../object-operations-base-vm';
import * as Mappings from '../../../models/mappers/mappings';
import * as modelsUtils from '../../../plugins/utils/models-utils';
import Control from '../../../models/business-models/control';

describe('object-operations-base viewModel', () => {
  let baseVM;

  beforeEach(() => {
    ObjectOperationsBaseVM.seal = false;
    baseVM = ObjectOperationsBaseVM();
  });

  describe('availableTypes() method', () => {
    it('returns grouped types if object is not Assessment', () => {
      baseVM.object = 'testObject';

      spyOn(Mappings, 'getMappingList').and.returnValue('list');
      spyOn(modelsUtils, 'groupTypes')
        .withArgs('list')
        .and.returnValue('grouped allowed to map objects');

      expect(baseVM.availableTypes()).toEqual('grouped allowed to map objects');
    });

    it('returns grouped types if object is Assessment', () => {
      baseVM.object = 'Assessment';

      spyOn(modelsUtils, 'groupTypes')
        .withArgs(GGRC.config.snapshotable_objects)
        .and.returnValue('grouped snapshotable objects');

      expect(baseVM.availableTypes()).toEqual('grouped snapshotable objects');
    });
  });

  describe('get() for baseVM.parentInstance', () => {
    beforeEach(() => {
      spyOn(modelsUtils, 'getInstance')
        .and.returnValue('parentInstance');
    });

    it('returns parentInstance', () => {
      let result = baseVM.parentInstance;
      expect(result).toEqual('parentInstance');
    });
  });

  describe('get() for baseVM.model', () => {
    it('returns model based on type attribute', () => {
      baseVM.type = 'Control';

      let result = baseVM.model;
      expect(result).toEqual(Control);
    });
  });

  describe('set() for baseVM.type', () => {
    let vm;

    beforeEach(() => {
      const ViewModel = ObjectOperationsBaseVM.extend({
        config: {
          general: {},
          special: [
            {
              types: ['Type1', 'Type2'],
              config: {},
            },
            {
              types: ['Type1'],
              config: {},
            },
          ],
        },
        update: jasmine.createSpy('update'),
      });

      vm = new ViewModel();
    });

    it('sets passed type', () => {
      let type = 'Type1';
      vm.type = type;
      expect(vm.get('type')).toBe(type);
    });

    it('calls update method',
      () => {
        let type = 'Type1';
        vm.type = type;
        expect(vm.update).toHaveBeenCalled();
      });

    it('removes "type" property from config passed in appropriate ' +
    'config handler', () => {
      let args;
      vm.type = 'Type1';

      args = vm.update.calls.argsFor(0);
      expect(args[0]).not.toEqual(jasmine.objectContaining({
        type: jasmine.any(String),
      }));
    });
  });

  describe('update() method', () => {
    let baseConfig;
    let method;
    let vm;

    beforeEach(() => {
      baseConfig = {
        a: 'a',
        b: {
          c: 'c',
        },
      };
      vm = new canDefineMap(baseConfig);
      method = baseVM.update.bind(vm);
    });

    it('sets new values for VM', () => {
      let config = {
        a: 'new A',
        b: {
          h: 'new H',
        },
        c: [],
      };
      method(config);
      expect(vm.serialize()).toEqual(config);
    });

    it('does not set values for VM from config if appropriate fields from ' +
    'VM and config have the same values', () => {
      let allArgs;
      method(baseConfig);

      spyOn(vm, 'set');
      allArgs = vm.set.calls.allArgs();

      expect(loEvery(allArgs, (args) => {
        return args.length === 1;
      })).toBe(true);
    });
  });

  describe('extractConfig() method', () => {
    let method;
    let config;

    beforeAll(() => {
      method = ObjectOperationsBaseVM.extractConfig;
    });

    beforeEach(() => {
      config = {
        general: {},
        special: [{
          types: ['T1', 'T2'],
          config: {},
        }, {
          types: ['T3'],
          config: {
            field: 1,
            field2: 2,
          },
        }],
      };
    });

    it('extracts general config if there is no special config for type',
      () => {
        let result = method('T0', config);
        expect(result).toBe(config.general);
      });

    it('extracts special config if there is special config for type',
      () => {
        let result = method('T2', config);
        expect(result).toEqual(config.special[0].config);
      });
  });
});
