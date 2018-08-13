/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import panelModel from '../panel';

describe('panel model', () => {
  let panel;

  beforeEach(() => {
    panel = new panelModel();
  });

  describe('isValidConfiguration prop', () => {
    it('returns TRUE when selected attributes count is equal max allowed',
      () => {
        panel.attr('maxAttributesCount', 3);

        panel.attr('attributes', [
          {isSelected: true},
          {isSelected: false},
        ]);

        panel.attr('localAttributes', [
          {isSelected: false},
          {isSelected: true},
        ]);

        panel.attr('mappings', [
          {isSelected: false},
          {isSelected: true},
        ]);

        expect(panel.attr('isValidConfiguration')).toBeTruthy();
      });

    it('returns TRUE when selected attributes count is less than max allowed',
      () => {
        panel.attr('maxAttributesCount', 3);

        panel.attr('attributes', [
          {isSelected: true},
          {isSelected: false},
        ]);

        panel.attr('localAttributes', [
          {isSelected: false},
          {isSelected: false},
        ]);

        panel.attr('mappings', [
          {isSelected: false},
          {isSelected: true},
        ]);

        expect(panel.attr('isValidConfiguration')).toBeTruthy();
      });

    it('returns FALSE when selected attributes count is more than allowed',
      () => {
        panel.attr('maxAttributesCount', 3);

        panel.attr('attributes', [
          {isSelected: true},
          {isSelected: false},
          {isSelected: true},
        ]);

        panel.attr('localAttributes', [
          {isSelected: false},
          {isSelected: true},
        ]);

        panel.attr('mappings', [
          {isSelected: false},
          {isSelected: true},
        ]);

        expect(panel.attr('isValidConfiguration')).toBeFalsy();
      });
  });
});
