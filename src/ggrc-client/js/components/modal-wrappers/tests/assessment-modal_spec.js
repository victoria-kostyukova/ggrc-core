/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../js_specs/spec-helpers';
import Component from '../assessment-modal';
import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import Assessment from '../../../models/business-models/assessment';

describe('<assessment-modal/> component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);

    spyOn(SnapshotUtils, 'toObject').and.returnValue({
      title: 'Foo',
      description: 'Bar',
      originalLink: 'Baz',
    });
  });

  describe('loadData() method', () => {
    it('sets the correct data to mappingsList field', (done) => {
      let model = makeFakeInstance({model: Assessment})();

      spyOn(model, 'getRelatedObjects').and
        .returnValue($.Deferred().resolve({
          Snapshot: [{}, {}, {}],
        }));

      vm.attr('instance', model);
      vm.attr('mappingsList', []);

      vm.loadData().then(() => {
        expect(vm.attr('mappingsList').length).toBe(3);

        done();
      });
    });
  });
});
