/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as modelsUtils from '../utils/models-utils';
import {getMappingList} from '../../models/mappers/mappings';

describe('groupTypes() method', () => {
  const EXPECTED_GROUPS = ['entities', 'scope', 'governance'];

  it('returns grouped mappable types', () => {
    let types = getMappingList('MultitypeSearch');
    let result = modelsUtils.groupTypes(types);
    let resultGroups = Object.keys(result);

    expect(EXPECTED_GROUPS).toEqual(resultGroups);
    expect(result.entities.items.length).toBe(1);
    expect(result.scope.items.length).toBe(15);
    expect(result.governance.items.length).toBe(20);
  });

  it('adds type to governance group if no group with category of this type',
    () => {
      let result = modelsUtils.groupTypes(['Audit']);

      expect(result.governance.items.length).toBe(1);
      expect(result.governance.items[0]).toEqual({
        category: 'programs',
        name: 'Audits',
        value: 'Audit',
      });
    });

  it('adds type to group of category of this type if this group exist',
    () => {
      spyOn(modelsUtils, 'getModelByType').and.returnValue({
        category: 'scope',
        title_singular: 'Model',
        title_plural: 'Models',
        model_singular: 'Model',
      });

      let result = modelsUtils.groupTypes(['TechnologyEnvironment']);

      expect(result.scope.items.length).toBe(1);
      expect(result.scope.items[0]).toEqual({
        category: 'scope',
        name: 'Technology Environments',
        value: 'TechnologyEnvironment',
      });
    });

  it('does nothing if cmsModel is not defined', () => {
    let result = modelsUtils.groupTypes(['Model']);

    expect(result.entities.items.length).toBe(0);
    expect(result.scope.items.length).toBe(0);
    expect(result.governance.items.length).toBe(0);
  });

  it('sorts models in groups', () => {
    spyOn(modelsUtils, 'getModelByType').and.callFake((modelName) => ({
      category: 'scope',
      title_singular: modelName,
      title_plural: `${modelName}s`,
      model_singular: modelName,
    }));

    let result = modelsUtils.groupTypes(['Product', 'Process', 'ProductGroup']);

    expect(result.scope.items.map((i) => i.name))
      .toEqual(['Processes', 'Product Groups', 'Products']);
  });
});
