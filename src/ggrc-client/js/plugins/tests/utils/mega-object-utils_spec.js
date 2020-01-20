/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/
import * as megaObjectUtils from '../../utils/mega-object-utils';
import {businessObjects} from '../../../plugins/models-types-collections';

describe('getRelatedWidgetNames method', () => {
  it('should return composed mega object specific widget names', () => {
    const result = megaObjectUtils.getRelatedWidgetNames('Program');
    expect(result).toEqual(['Program_child', 'Program_parent']);
  });
});

describe('isMegaObjectRelated method', () => {
  it('should return true if widget name has relation to Mega object as parent',
    () => {
      const result = megaObjectUtils.isMegaObjectRelated('Program_parent');
      expect(result).toBeTruthy();
    });

  it('should return true if widget name has relation to Mega object as child',
    () => {
      const result = megaObjectUtils.isMegaObjectRelated('Program_child');
      expect(result).toBeTruthy();
    });

  it('should return false if widget name has not relation to Mega object',
    () => {
      const result = megaObjectUtils.isMegaObjectRelated('Program');
      expect(result).toBeFalsy();
    });
});

describe('isMegaMapping method', () => {
  it('should return true if models are equal and they are a megaObject',
    () => {
      const megaObjects = ['Program'];
      businessObjects.forEach((obj1) => {
        businessObjects.forEach((obj2) => {
          const result = megaObjectUtils.isMegaMapping(obj1, obj2);
          if (obj1 === obj2 && megaObjects.includes(obj1)) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        });
      });
    });
});

describe('getMegaObjectConfig method', () => {
  it('should return config for mega object', () => {
    const result = megaObjectUtils.getMegaObjectConfig('Program_parent');
    expect(result).toEqual({
      name: 'Program',
      originalModelName: 'Program',
      widgetId: 'Program_parent',
      widgetName: 'Programs (Parent)',
      relation: 'parent',
      isMegaObject: true,
    });
  });
});

describe('getMegaObjectRelation method', () => {
  it('should return object with original model name as source ' +
  'and relation parsed from modelName', () => {
    const result = megaObjectUtils.getMegaObjectRelation('Program_parent');
    expect(result).toEqual({
      source: 'Program',
      relation: 'parent',
    });
  });
});

describe('transformQueryForMega method', () => {
  it('should return transformed query if query.filters.expression and ' +
  'query.fields are not defined', () => {
    const result = megaObjectUtils.transformQueryForMega({
      object_name: 'Program',
      filters: {},
    }, 'parent');
    expect(result).toEqual({
      object_name: 'Program',
      filters: {},
    });
  });

  it('should return transformed query if query.filters.expression is defined',
    () => {
      const result = megaObjectUtils.transformQueryForMega({
        object_name: 'Program',
        filters: {
          expression: {},
        },
      }, 'parent');
      expect(result).toEqual({
        object_name: 'Program',
        filters: {
          expression: {
            op: {
              name: 'parent',
            },
          },
        },
      });
    });

  it('should return transformed query if query.fields is defined ' +
  'and does not contain "is_mega"', () => {
    const result = megaObjectUtils.transformQueryForMega({
      object_name: 'Program',
      filters: {},
      fields: 'field',
    }, 'parent');
    expect(result).toEqual({
      object_name: 'Program',
      filters: {},
      fields: 'fieldis_mega',
    });
  });

  it('should return transformed query if query.filters.expression, ' +
  'query.fields are defined and does not contain "is_mega"', () => {
    const result = megaObjectUtils.transformQueryForMega({
      object_name: 'Program',
      filters: {
        expression: {},
      },
      fields: 'field',
    }, 'parent');
    expect(result).toEqual({
      object_name: 'Program',
      filters: {
        expression: {
          op: {
            name: 'parent',
          },
        },
      },
      fields: 'fieldis_mega',
    });
  });
});
