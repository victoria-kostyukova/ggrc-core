/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canModel from 'can-model/src/can-model';

describe('validateUniqueTitle extension', () => {
  let TestModel;

  beforeAll(() => {
    TestModel = canModel.extend({}, {
      define: {
        title: {
          value: '',
          validate: {
            validateUniqueTitle: true,
          },
        },
        _transient_title: {
          value: '',
          validate: {
            validateUniqueTitle: true,
          },
        },
      },
    });
  });

  it('should return FALSE. transient_title - not empty', () => {
    const instance = new TestModel();
    instance.attr('_transient_title', 'title must be unique');
    expect(instance.validate()).toBeFalsy();
  });

  it('should return TRUE. transient_title - empty', () => {
    const instance = new TestModel();
    instance.attr('_transient_title', '');
    expect(instance.validate()).toBeTruthy();
  });

  it('should return TRUE. transient_title - empty, title - not empty', () => {
    const instance = new TestModel();
    instance.attr('_transient_title', '');
    instance.attr('title', 'test title');
    expect(instance.validate()).toBeTruthy();
  });

  it('should return FALSE. transient_title - not empty, title - not empty',
    () => {
      const instance = new TestModel();
      instance.attr('_transient_title', 'title must be unique');
      instance.attr('title', 'test title');
      expect(instance.validate()).toBeFalsy();
    }
  );
});
