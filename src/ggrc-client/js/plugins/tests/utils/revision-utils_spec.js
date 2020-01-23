/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import canMap from 'can-map';
import * as RevisionUtils from '../../utils/revision-utils';

describe('revision-utils', () => {
  describe('setActualGCAs', () => {
    let instance;
    let setActualGCAs;

    beforeEach(() => {
      instance = new canMap({
        custom_attribute_definitions: new canList([
          {
            id: 1,
          },
          {
            id: 2,
          },
        ]),
        custom_attribute_values: new canList([
          {
            id: 1,
          },
          {
            id: 2,
          },
        ]),
      });

      setActualGCAs = RevisionUtils.setActualGCAs;
    });

    it('sets missed GCA\'s to content', () => {
      const content = new canMap({
        custom_attribute_definitions: new canList([{
          id: 1,
        }]),
        custom_attribute_values: new canList([{
          id: 1,
        }]),
      });

      setActualGCAs(content, instance);

      expect(content.custom_attribute_definitions.attr()).toEqual(
        instance.custom_attribute_definitions.attr());
    });

    it('remove extra GCA\'s from content', () => {
      const content = new canMap({
        custom_attribute_definitions: new canList([
          {
            id: 1,
          },
          {
            id: 3,
          },
        ]),
        custom_attribute_values: new canList([
          {
            id: 1,
          },
          {
            id: 3,
          },
        ]),
      });

      setActualGCAs(content, instance);

      expect(content.custom_attribute_definitions.attr()).toEqual(
        instance.custom_attribute_definitions.attr());
    });
  });
});
