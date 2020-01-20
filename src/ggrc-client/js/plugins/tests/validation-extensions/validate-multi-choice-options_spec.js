/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canModel from 'can-model/src/can-model';

describe('validateMultiChoiceOptions extension', () => {
  let TestModel;

  beforeAll(() => {
    TestModel = canModel.extend({}, {
      define: {
        multi_choice_options: {
          value: '',
          validate: {
            validateMultiChoiceOptions: true,
          },
        },
        attribute_type: {
          value: '',
          validate: {
            validateMultiChoiceOptions: true,
          },
        },
      },
    });
  });

  it('should return TRUE. attribute_type is empty string', () => {
    const instance = new TestModel();
    instance.attr('attribute_type', '');
    expect(instance.validate()).toBeTruthy();
  });

  it('should return TRUE. attribute_type is not dropdown', () => {
    const instance = new TestModel();
    instance.attr('attribute_type', 'test type');
    expect(instance.validate()).toBeTruthy();
  });

  it('should return TRUE. Dropdown has correct values', () => {
    const instance = new TestModel();
    instance.attr('attribute_type', 'Dropdown');
    instance.attr('multi_choice_options', '5 , 51, 52');
    expect(instance.validate()).toBeTruthy();
  });

  it('should return FALSE. Empty string as Dropdown value', () => {
    const instance = new TestModel();
    instance.attr('attribute_type', 'Dropdown');
    instance.attr('multi_choice_options', '');
    expect(instance.validate()).toBeFalsy();
  });

  it('should return FALSE. Null as Dropdown value', () => {
    const instance = new TestModel();
    instance.attr('attribute_type', 'Dropdown');
    instance.attr('multi_choice_options', null);
    expect(instance.validate()).toBeFalsy();
  });

  it('should return FALSE. Dropdown has "Blank" values', () => {
    const instance = new TestModel();
    instance.attr('attribute_type', 'Dropdown');
    instance.attr('multi_choice_options', ' , 1, 2');
    expect(instance.validate()).toBeFalsy();
  });

  it('Should return FALSE. Dropdown has duplicates', () => {
    const instance = new TestModel();
    instance.attr('attribute_type', 'Dropdown');
    instance.attr('multi_choice_options', '2, 1, 2');
    expect(instance.validate()).toBeFalsy();
  });
});
