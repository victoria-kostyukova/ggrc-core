/*
 * Copyright (C) 2019 Google Inc.
 * Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loRange from 'lodash/range';
const unitOptions = [
  {title: 'Weekday', value: 'day', plural: 'weekdays', singular: 'weekday'},
  {title: 'Weekly', value: 'week', plural: 'weeks', singular: 'week'},
  {title: 'Monthly', value: 'month', plural: 'months', singular: 'month'},
];

const repeatOptions = loRange(1, 31)
  .map(function (option) {
    return {
      value: option,
    };
  });

const defaultRepeatValues = {
  unit: 'month',
  repeatEvery: 1,
};

export {
  unitOptions,
  repeatOptions,
  defaultRepeatValues,
};

