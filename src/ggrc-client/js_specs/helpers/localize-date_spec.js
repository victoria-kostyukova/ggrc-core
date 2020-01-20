/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
describe('canStache.helper.localize_date', () => {
  let helper;
  let testDate;
  let fakeOptions;

  beforeAll(() => {
    helper = canStache.getHelper('localize_date').fn;
    fakeOptions = {};
  });

  it('returns formatted short ISO format', () => {
    testDate = '2017-01-16';
    expect(helper(testDate, fakeOptions)).toEqual('01/16/2017');
  });

  it('returns formatted full ISO format', () => {
    testDate = '2017-01-16T12:36:20';
    expect(helper(testDate, fakeOptions)).toEqual('01/16/2017');
  });

  it('returns Invalid date for incorrect formats', () => {
    expect(helper('01-01-2017', fakeOptions)).toEqual('Invalid date');
    expect(helper('2017/01/16', fakeOptions)).toEqual('Invalid date');
    expect(helper('01/01/2016', fakeOptions)).toEqual('Invalid date');
    expect(helper('2017-01-16 12:36:20', fakeOptions)).toEqual('Invalid date');
    expect(helper('2017-20-01', fakeOptions)).toEqual('Invalid date');
    expect(helper('01.01.2017', fakeOptions)).toEqual('Invalid date');
  });
});
