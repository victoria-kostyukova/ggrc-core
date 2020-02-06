/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import * as TreeViewUtils from '../../../plugins/utils/tree-view-utils';
import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../advanced-search-mapping-criteria';
import * as Mappings from '../../../models/mappers/mappings';
import Audit from '../../../models/business-models/audit';

describe('advanced-search-mapping-criteria component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('criteria set() method', () => {
    it('initializes "criteria.filter" property with new attribute model',
      () => {
        viewModel.criteria = canMap();

        expect(viewModel.criteria.attr('filter').type).toBe('attribute');
      });

    it('does not intialize "criteria.filter" when it is already initialized',
      () => {
        viewModel.criteria = new canMap({
          filter: {
            type: 'test',
          },
        });

        expect(viewModel.criteria.attr('filter').type).toBe('test');
      });
  });

  describe('remove() method', () => {
    it('dispatches "remove" event', () => {
      spyOn(viewModel, 'dispatch');

      viewModel.remove();

      expect(viewModel.dispatch).toHaveBeenCalledWith('remove');
    });
  });

  describe('addRelevant() method', () => {
    it('adds mapping criteria', () => {
      viewModel.criteria = canMap();

      viewModel.addRelevant();

      expect(viewModel.criteria.attr('mappedTo').type).toBe('mappingCriteria');
    });
  });

  describe('removeRelevant() method', () => {
    it('removes mapping criteria', () => {
      viewModel.criteria = new canMap({
        mappedTo: {},
      });

      viewModel.removeRelevant();

      expect(viewModel.criteria.attr('mappedTo')).toBe(undefined);
    });
  });

  describe('createGroup() method', () => {
    it('dispatches "createGroup" event', () => {
      spyOn(viewModel, 'dispatch');

      viewModel.createGroup();

      expect(viewModel.dispatch).toHaveBeenCalledWith('createGroup');
    });
  });

  describe('relevantToGroup() method', () => {
    it('transforms criteria to group with 2 criteria and operator inside',
      () => {
        viewModel.criteria.attr('mappedTo',
          AdvancedSearch.create.mappingCriteria()
        );

        viewModel.relevantToGroup();

        let relevant = viewModel.criteria.attr('mappedTo');
        expect(relevant.type).toBe('group');
        expect(relevant.value[0].type).toBe('mappingCriteria');
        expect(relevant.value[1].type).toBe('operator');
        expect(relevant.value[2].type).toBe('mappingCriteria');
      });
  });

  describe('mappingTypes() method', () => {
    beforeEach(() => {
      spyOn(Mappings, 'getAvailableMappings').and.returnValue({
        type1: {
          model_singular: '3',
        },
        type2: {
          model_singular: '1',
        },
        type3: {
          model_singular: '2',
        },
      });
    });

    describe('if it is in clone modal', () => {
      let modelName;

      beforeEach(() => {
        viewModel.isClone = true;
      });

      it('returns only model with name as modelName attribute', () => {
        viewModel.modelName = 'Audit';

        expect(viewModel.mappingTypes()).toEqual([Audit]);
      });

      it('sets modelName attribute to criteria.objectName', () => {
        modelName = 'Audit';

        viewModel.criteria = new canMap();
        viewModel.modelName = modelName;
        viewModel.mappingTypes();

        expect(viewModel.criteria.attr('objectName')).toBe(modelName);
      });
    });

    it('retrieves available mappings for correct model', () => {
      viewModel.modelName = 'testModel';

      viewModel.mappingTypes();

      expect(Mappings.getAvailableMappings)
        .toHaveBeenCalledWith('testModel');
    });

    it('returns correct filtered and sorted types', () => {
      let result = viewModel.mappingTypes();

      expect(result).toEqual([
        {
          model_singular: '1',
        },
        {
          model_singular: '2',
        },
        {
          model_singular: '3',
        },
      ]);
    });

    it('sets criteria.objectName if objectName is not defined', () => {
      viewModel.criteria.attr('objectName', undefined);

      viewModel.mappingTypes();

      expect(viewModel.criteria.attr('objectName')).toBe('1');
    });

    it('does not set criteria.objectName if objectName is defined',
      () => {
        viewModel.criteria.attr('objectName', 'test');

        viewModel.mappingTypes();

        expect(viewModel.criteria.attr('objectName')).toBe('test');
      });
  });

  describe('availableAttributes() method', () => {
    it('returns available attributes', () => {
      let attributes = ['attr1', 'attr2'];
      spyOn(TreeViewUtils, 'getAvailableAttributes')
        .and.returnValue(attributes);
      viewModel.criteria.attr('objectName', 'test');

      expect(viewModel.availableAttributes()).toBe(attributes);
      expect(TreeViewUtils.getAvailableAttributes).toHaveBeenCalledWith('test');
    });
  });
});
