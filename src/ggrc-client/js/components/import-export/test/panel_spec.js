/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import panelModel from '../panel';

describe('panel model', () => {
  let panel;

  const modelAttributeDefenitions = {
    Assessment: [
      {
        display_name: 'Code',
        type: 'property',
        import_only: false,
      },
      {
        display_name: 'Title',
        type: 'unknowType',
      },
      {
        display_name: 'DisplayName',
        type: 'property',
        // should not be added
        import_only: true,
      },
      {
        display_name: 'map:risk versions',
        type: 'mapping',
      },
      {
        // should not be added
        display_name: 'unmap:vendor versions',
        type: 'mapping',
      },
      {
        display_name: 'LCA #1',
        type: 'object_custom',
      },
    ],
  };

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

  describe('setAttributes() method', () => {
    beforeEach(() => {
      panel.attr('type', 'Assessment');

      spyOn(panel, 'getModelAttributeDefenitions').and
        .returnValue(modelAttributeDefenitions[panel.attr('type')]);
    });

    it('should set attributes', () => {
      panel.attr('attributes', new canList());
      panel.attr('mappings', new canList());
      panel.attr('localAttributes', new canList());

      panel.setAttributes();

      let mappingsItem = panel.attr('mappings')[0];
      let attributesItem = panel.attr('attributes')[0];

      expect(panel.attr('mappings').length).toEqual(1);
      expect(panel.attr('attributes').length).toEqual(2);
      expect(panel.attr('localAttributes').length).toEqual(1);

      expect(mappingsItem.display_name).toEqual('map:risk versions');
      expect(attributesItem.display_name).toEqual('Code');
    });
  });

  describe('filterModelAttributes() method', () => {
    it('should return TRUE when valid attribute', () => {
      let item = modelAttributeDefenitions.Assessment[0];

      expect(panel.filterModelAttributes(item))
        .toBe(true);
    });

    it('should return FALSE when import_only is true', () => {
      let item = modelAttributeDefenitions.Assessment[2];

      expect(panel.filterModelAttributes(item))
        .toBe(false);
    });

    it('should return FALSE when unmapped item', () => {
      let item = modelAttributeDefenitions.Assessment[4];

      expect(panel.filterModelAttributes(item))
        .toBe(false);
    });
  });

  describe('changeType() method', () => {
    it('should reset panel attributes and set type', () => {
      panel.attr({
        type: 'old type',
        relevant: ['relevant'],
        filter: 'any filter',
        snapshot_type: 'snapshot type',
        has_parent: true,
      });

      panel.changeType('new type');

      expect(panel.attr('type')).toBe('new type');
      expect(panel.attr('relevant').length).toBe(0);
      expect(panel.attr('filter')).toBe('');
      expect(panel.attr('snapshot_type')).toBe('');
      expect(panel.attr('has_parent', false));
    });

    it('should set default snapshot_type when type is Snapshot', () => {
      panel.attr('snapshot_type', null);

      panel.changeType('Snapshot');
      expect(panel.attr('snapshot_type')).toBe('Control');
    });

    it('should set attributes for selected type', () => {
      spyOn(panel, 'setAttributes');

      panel.changeType('new type');
      expect(panel.setAttributes).toHaveBeenCalled();
    });
  });
});
