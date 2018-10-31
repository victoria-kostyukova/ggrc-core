/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mappings from '../../../models/mappers/mappings';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../assessment-object-type-dropdown';

describe('assessment-object-type-dropdown component', function () {
  'use strict';

  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  it('returns the grouped types', function () {
    let result;

    let objectTypes = {
      groupFoo: {
        name: 'Foo Objects',
        items: [{name: 'Foo1'}, {value: 'Foo2'}],
      },
      groupBar: {
        name: 'Bar Objects',
        items: [{value: 'Bar1'}, {value: 'Bar2'}],
      },
    };

    spyOn(Mappings, 'groupTypes').and.returnValue(objectTypes);
    result = viewModel.attr('objectTypes');
    expect(result).toEqual(objectTypes);
  });
});
