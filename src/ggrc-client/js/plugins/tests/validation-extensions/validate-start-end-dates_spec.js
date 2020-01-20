/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canModel from 'can-model/src/can-model';

describe('validateStartEndDates extension', () => {
  let TestModel;

  beforeAll(() => {
    TestModel = canModel.extend({}, {
      define: {
        start_date: {
          value: '2015-05-20T08:17:54',
          validate: {
            validateStartEndDates: true,
          },
        },
        end_date: {
          value: '2015-03-20T08:17:54',
          validate: {
            validateStartEndDates: true,
          },
        },
      },
    });
  });

  it('should return TRUE. daterange is correct', () => {
    const instance = new TestModel();
    instance.attr('start_date', '2015-05-20');
    instance.attr('end_date', '2015-05-23');
    expect(instance.validate()).toBeTruthy();
  });

  it('should return FALSE. end_date is empty', () => {
    const instance = new TestModel();
    instance.attr('start_date', '2015-05-20');
    expect(instance.validate()).toBeFalsy();
  });

  it('should return FALSE. start_date is empty', () => {
    const instance = new TestModel();
    instance.attr('end_date', '2015-05-20');
    expect(instance.validate()).toBeFalsy();
  });

  it('should return FALSE. dates are empty', () => {
    const instance = new TestModel();
    instance.attr('end_date', null);
    instance.attr('start_date', null);
    expect(instance.validate()).toBeFalsy();
  });
});
