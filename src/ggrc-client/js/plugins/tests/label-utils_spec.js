/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {sortByName} from '../utils/label-utils';

describe('Label utils sortByName() method', () => {
  let labels;

  beforeAll(() => {
    labels = [
      {id: 8, name: 'gg'},
      {id: 1, name: 'gl'},
      {id: 2, name: 'GJ'},
      {id: 9, name: 'dev'},
      {id: 3, name: 'ux'},
    ];
  });

  it('should return the same number of labels', () => {
    const sortedLabels = sortByName(labels);
    expect(sortedLabels.length).toBe(labels.length);
  });

  it('labels should be sorted by name', () => {
    const sortedLabels = sortByName(labels);
    expect(sortedLabels[0].name).toEqual('dev');
    expect(sortedLabels[1].name).toEqual('gg');
    expect(sortedLabels[2].name).toEqual('GJ');
    expect(sortedLabels[3].name).toEqual('gl');
    expect(sortedLabels[4].name).toEqual('ux');
  });

  it('should correct sort labels without names', () => {
    let labels = [
      {id: 8, name: ''},
      {id: 1, name: 'gl'},
      {id: 2},
      {id: 3, name: 'ux'},
    ];

    const sortedLabels = sortByName(labels);
    expect(sortedLabels[0].id).toBe(8);
    expect(sortedLabels[1].id).toBe(1);
    expect(sortedLabels[2].id).toBe(3);
    expect(sortedLabels[3].id).toBe(2);
  });
});
