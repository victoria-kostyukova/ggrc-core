/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import moment from 'moment';
import canStache from 'can-stache';

describe('CanStache.helper.date', () => {
  let helper;
  let testDate;

  beforeAll(() => {
    helper = canStache.getHelper('date').fn;
  });

  it('returns date only when boolean true is passed in', () => {
    testDate = new Date(2015, 4, 3, 7, 34, 56);
    expect(helper(testDate, true)).toEqual('05/03/2015');
  });

  it('returns datetime when stringy truthy value is passed in', () => {
    let timezone = moment(
      '2015-05-03T12:34:45Z').tz(moment.tz.guess()).format('Z');
    testDate = new Date(2015, 4, 3, 7, 34, 56);

    expect(
      helper(testDate, 'true')).toEqual('05/03/2015 07:34:56 AM ' + timezone);
  });

  it('returns datetime when stringy falsey value is passed in', () => {
    let timezone = moment(
      '2015-05-03T12:34:45Z').tz(moment.tz.guess()).format('Z');
    testDate = new Date(2015, 4, 3, 7, 34, 56);

    expect(
      helper(testDate, 'false')).toEqual('05/03/2015 07:34:56 AM ' + timezone);
  });

  it('returns datetime when false value is passed in', () => {
    let timezone = moment(
      '2015-05-03T12:34:45Z').tz(moment.tz.guess()).format('Z');
    testDate = new Date(2015, 4, 3, 7, 34, 56);

    expect(
      helper(testDate, false)).toEqual('05/03/2015 07:34:56 AM ' + timezone);
  });

  it('returns datetime when random values are passed in', () => {
    let timezone = moment(
      '2015-05-03T12:34:45Z').tz(moment.tz.guess()).format('Z');
    testDate = new Date(2015, 4, 3, 7, 34, 56);

    expect(
      helper(testDate, 'asdasd')).toEqual('05/03/2015 07:34:56 AM ' + timezone);
    expect(
      helper(testDate, {a: 1})).toEqual('05/03/2015 07:34:56 AM ' + timezone);
    expect(
      helper(testDate, '{a: 1}')).toEqual('05/03/2015 07:34:56 AM ' + timezone);
    expect(
      helper(testDate, 123)).toEqual('05/03/2015 07:34:56 AM ' + timezone);
  });
});
