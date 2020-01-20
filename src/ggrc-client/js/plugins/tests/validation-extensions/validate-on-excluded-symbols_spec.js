/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canModel from 'can-model/src/can-model';

describe('validateOnExcludedSymbols extension', () => {
  let TestModel;
  let excludedSymbols = '*;';

  beforeAll(() => {
    TestModel = canModel.extend({}, {
      define: {
        title: {
          value: '',
          validate: {
            validateOnExcludedSymbols: true,
          },
        },
        excludedSymbols: {
          value: excludedSymbols,
        },
      },
    });
  });

  it('should return FALSE. title contains excluded symbol', () => {
    const instance = new TestModel();
    instance.attr('title', 'name*');
    expect(instance.validate()).toBeFalsy();
    expect(instance.errors.title[0])
      .toEqual(`Title cannot contain ${excludedSymbols}`);
  });

  it('should return TRUE. title does not contain excluded symbol', () => {
    const instance = new TestModel();
    instance.attr('title', 'name');
    expect(instance.validate()).toBeTruthy();
    expect(instance.errors.title)
      .toBeUndefined();
  });
});
