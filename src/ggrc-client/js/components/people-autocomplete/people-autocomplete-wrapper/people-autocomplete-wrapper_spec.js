/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import component from './people-autocomplete-wrapper';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import * as AjaxUtils from '../../../plugins/ajax-extensions';

describe('people-autocomplete-wrapper component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(component);
  });

  describe('currentValue set method', () => {
    beforeEach(() => {
      spyOn(vm, 'getResult');
    });

    it('sets correct value', () => {
      const values = ['ara', null, undefined];

      values.forEach((value) => {
        vm.attr('currentValue', value);

        expect(vm.attr('currentValue')).toBe(value);
      });
    });

    it('calls getResult method if newValue is not null', () => {
      const value = 'mockValue';

      vm.attr('currentValue', value);

      expect(vm.getResult).toHaveBeenCalledWith(value);
    });

    it('assigns false to "showResults" attribute if newValue is null', () => {
      vm.attr('showResults', true);

      vm.attr('currentValue', null);

      expect(vm.attr('showResults')).toBe(false);
    });
  });

  describe('getResult() method', () => {
    let originalValue;

    beforeAll(() => {
      originalValue = GGRC.config.external_services;
      GGRC.config.external_services = {};
    });

    afterAll(() => {
      GGRC.config.external_services = originalValue;
    });

    describe('if externalServiceUrl is defined', () => {
      let getDfd;
      let modelName;

      beforeEach(() => {
        modelName = 'mockName';
        vm.attr('modelName', modelName);
        GGRC.config.external_services[modelName] = 'externalServiceUrlMock';

        getDfd = $.Deferred();
        spyOn(AjaxUtils, 'ggrcGet').and.returnValue(getDfd);
        spyOn(vm, 'processItems');
      });

      it('calls AjaxUtils.ggrcGet with specified settings', () => {
        const value = 'ara';

        vm.getResult(value);

        expect(AjaxUtils.ggrcGet).toHaveBeenCalledWith(
          GGRC.config.external_services[modelName],
          {
            prefix: value,
            limit: 10,
          },
        );
      });

      it('calls processItems with passed value and received data after get',
        (done) => {
          const value = 'ara';
          const data = {};
          getDfd.resolve(data);

          vm.getResult(value);

          getDfd.then(() => {
            expect(vm.processItems).toHaveBeenCalledWith(value, data);
            done();
          });
        });
    });

    describe('if externalServiceUrl is not defined', () => {
      let requestDfd;

      beforeEach(() => {
        requestDfd = $.Deferred();

        spyOn(vm, 'requestItems').and.returnValue(requestDfd);
        spyOn(vm, 'processItems');
      });

      it('calls requestItems with passed value', () => {
        const value = 'ara';

        vm.getResult(value);

        expect(vm.requestItems).toHaveBeenCalledWith(value);
      });

      it('calls processItems with passed value and with data ' +
      'from response returned by modelName', (done) => {
        const modelName = 'someModel';
        vm.attr('modelName', modelName);
        const value = 'ara';
        const data = {};
        data[modelName] = {
          values: [1, 2, 3],
        };
        requestDfd.resolve(data);

        const getResultChain = vm.getResult(value);

        requestDfd.then(() => {
          getResultChain.then(() => {
            expect(vm.processItems)
              .toHaveBeenCalledWith(value, data[modelName].values);
            done();
          });
        });
      });
    });
  });

  describe('processItems(value, data) method', () => {
    let value;

    beforeEach(() => {
      spyOn(vm, 'getResult');
    });

    describe('if passed "value" equal to "currentValue" attribute',
      () => {
        beforeEach(() => {
          value = 'someValue';
          vm.attr('currentValue', value);
        });

        describe('if length of data is not 0', () => {
          let data;

          beforeEach(() => {
            data = new canList([1, 2, 3]);
          });

          it('assigns passed data to "result" attribute', () => {
            vm.processItems(value, data);

            expect(vm.attr('result')).toBe(data);
          });

          it('assigns true to "showResults" attribute', () => {
            vm.attr('showResults', false);

            vm.processItems(value, data);

            expect(vm.attr('showResults')).toBe(true);
          });
        });

        it('assigns false to "showResults" attribute if length of data is 0',
          () => {
            vm.attr('showResults', true);

            vm.processItems(value, []);

            expect(vm.attr('showResults')).toBe(false);
          });
      });

    it('does not change viewModel if passed value does not equal ' +
    'to "currentValue" attribute', () => {
      vm.attr('currentValue', 'someValue');
      const originalVm = vm.serialize();

      vm.processItems('otherValue', []);

      expect(originalVm).toEqual(vm.serialize());
    });
  });
});
