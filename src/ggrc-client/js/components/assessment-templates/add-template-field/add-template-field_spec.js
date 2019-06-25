/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loIndexOf from 'lodash/indexOf';
import loIncludes from 'lodash/includes';
import canMap from 'can-map';
import Component, * as Validations from './add-template-field';
import {getComponentVM} from '../../../../js_specs/spec_helpers';

describe('add-template-field component', () => {
  describe('addField() method', () => {
    let viewModel;

    beforeEach(() => {
      viewModel = getComponentVM(Component);

      spyOn(viewModel, 'getValidators').and.returnValue([]);
    });

    it('does not require the "values" field to add a field of type Map:Person',
      () => {
        let selectedObj = new canMap({
          title: 'External Reviewer',
          type: 'Map:Person',
          values: '',
        });
        viewModel.attr('selected', selectedObj);
        viewModel.addField();
        expect(viewModel.fields.length).toBe(1);
      }
    );
    it('requires the "values" field to add a field of type Dropdown', () => {
      let selectedObj = new canMap({
        title: 'External Reviewer',
        type: 'Dropdown',
        values: 'value0 value1',
      });
      viewModel.attr('selected', selectedObj);
      viewModel.addField();
      expect(viewModel.fields.length).toBe(1);
    });
    it('requires the "values" field to add a field of type Dropdown', () => {
      let selectedObj = new canMap({
        title: 'External Reviewer',
        type: 'Dropdown',
        values: '',
      });
      viewModel.attr('selected', selectedObj);
      viewModel.addField();
      expect(viewModel.fields.length).toBe(0);
    });
    it('requires the "values" field to add a field of type Text', () => {
      let selectedObj = new canMap({
        title: 'External Reviewer',
        type: 'Text',
        values: '',
      });
      viewModel.attr('selected', selectedObj);
      viewModel.addField();
      expect(viewModel.fields.length).toBe(1);
    });
  });

  describe('isEmptyTitle() method', () => {
    let isEmptyTitle; // the method under test

    beforeAll(() => {
      isEmptyTitle = Validations.isEmptyTitle;
    });

    it('should return error message', () => {
      let selectedTitle = '';
      let result = isEmptyTitle(selectedTitle);

      expect(result).toBe('A custom attribute title cannot be blank');
    });

    it('should not return error message', () => {
      let selectedTitle = 'my title';
      let result = isEmptyTitle(selectedTitle);

      expect(result).toBe('');
    });
  });

  describe('isInvalidTitle() method', () => {
    let isInvalidTitle;

    beforeAll(() => {
      isInvalidTitle = Validations.isInvalidTitle;
    });

    it('should return error message', () => {
      let selectedTitle = 'my * title';
      let result = isInvalidTitle(selectedTitle);

      expect(result).toBe('A custom attribute title cannot contain *');
    });

    it('should not return error message', () => {
      let selectedTitle = 'my title';
      let result = isInvalidTitle(selectedTitle);

      expect(result).toBe('');
    });
  });

  describe('isDublicateTitle() method', () => {
    let isDublicateTitle; // the method under test

    beforeAll(() => {
      isDublicateTitle = Validations.isDublicateTitle;
    });

    it('should return error message', () => {
      const fields = [{
        id: 123,
        title: 'TiTlE',
        attribute_type: 'Text',
        multi_choice_options: '',
      }];
      const selectedTitle = 'title';

      expect(isDublicateTitle(fields, selectedTitle))
        .toBe('A custom attribute with this title already exists');
    });

    it('should not return error message', () => {
      const fields = [{
        id: 123,
        title: 'title',
        attribute_type: 'Text',
        multi_choice_options: '',
      }];
      const selectedTitle = 'new title';

      expect(isDublicateTitle(fields, selectedTitle)).toBe('');
    });
  });

  describe('isReservedByCustomAttr() method', () => {
    let originalAttrDefs;
    let method;

    beforeAll(() => {
      originalAttrDefs = GGRC.custom_attr_defs;
      GGRC.custom_attr_defs = [
        {
          definition_type: 'assessment',
          title: 'New Checkbox',
        },
      ];

      method = Validations.isReservedByCustomAttr;
    });

    afterAll(() => {
      GGRC.custom_attr_defs = originalAttrDefs;
    });

    it('should not return error message', () => {
      expect(method('my title')).toBe('');
    });

    it('should return error message', () => {
      expect(method('new checkbox'))
        .toBe('Custom attribute with such name already exists');
    });
  });

  describe('isReservedByModelAttr() method', () => {
    let originalModelDefs;
    let method;

    beforeAll(() => {
      originalModelDefs = GGRC.model_attr_defs;
      GGRC.model_attr_defs = {
        Assessment: [
          {display_name: 'Code'},
        ],
      };

      method = Validations.isReservedByModelAttr;
    });

    afterAll(() => {
      GGRC.model_attr_defs = originalModelDefs;
    });

    it('should not return error message', () => {
      expect(method('my title')).toBe('');
    });

    it('should return error message', () => {
      expect(method('code'))
        .toBe('Attribute with such name already exists');
    });
  });

  describe('validateValues() method', () => {
    let viewModel;

    beforeEach(() => {
      viewModel = getComponentVM(Component);
    });

    it('has to not allow to input type "Dropdown" with positive ' +
      '"isDisplayValues" & not set values', () => {
      ['Dropdown', 'Multiselect'].forEach((type) => {
        viewModel.attr('selected.type', type);

        viewModel.validateValues('');
        expect(viewModel.attr('selected.invalidValues')).toBeTruthy();
      });
    });

    it('has to allow to input type "Dropdown" with positive ' +
      '"isdisplayValues" & set values', () => {
      viewModel.attr('selected.type', 'Multiselect');

      viewModel.validateValues('some value');
      expect(viewModel.attr('selected.invalidValues')).toBeFalsy();
    });

    it('has to allow to input type "Dropdown" with negative ' +
      '"isDisplayValues" & set value', () => {
      viewModel.attr('selected.type', 'Text');

      viewModel.validateValues('any value');
      expect(viewModel.attr('selected.invalidValues')).toBeFalsy();
    });
  });

  describe('validateTitle() method', () => {
    let viewModel;

    beforeAll(() => {
      viewModel = getComponentVM(Component);
    });

    beforeEach(() => {
      viewModel.attr('selected.invalidTitleError', '');
    });

    function getTitleError() {
      return viewModel.attr('selected.invalidTitleError');
    }

    function setupSpies(caErrorMsg, modelAttrErrorMsg) {
      spyOn(Validations, 'isEmptyTitle').and
        .callFake((title) => !title ? 'empty val message' : '');

      spyOn(Validations, 'isInvalidTitle').and
        .callFake((title) => loIndexOf(title, '*') !== -1 ?
          'invalid val message' :
          '');

      spyOn(Validations, 'isDublicateTitle').and
        .callFake((fields, title) => {
          return loIncludes(fields, title) ?
            'duplicates val message' :
            '';
        });

      spyOn(Validations, 'isReservedByCustomAttr')
        .and.returnValue(caErrorMsg);
      spyOn(Validations, 'isReservedByModelAttr')
        .and.returnValue(modelAttrErrorMsg);

      spyOn(viewModel, 'getValidators').and
        .callFake((title, fields) => {
          return [
            Validations.isEmptyTitle.bind(null, title),
            Validations.isInvalidTitle.bind(null, title),
            Validations.isDublicateTitle.bind(null, fields, title),
            Validations.isReservedByCustomAttr.bind(null, title),
            Validations.isReservedByModelAttr.bind(null, title),
          ];
        });
    }

    it('should not set error message', () => {
      setupSpies('', '');

      let validators = viewModel.getValidators('my title', []);
      viewModel.validateTitle(validators);

      expect(getTitleError()).toBe('');
      expect(Validations.isEmptyTitle).toHaveBeenCalled();
      expect(Validations.isInvalidTitle).toHaveBeenCalled();
      expect(Validations.isDublicateTitle).toHaveBeenCalled();
      expect(Validations.isReservedByCustomAttr).toHaveBeenCalled();
      expect(Validations.isReservedByModelAttr).toHaveBeenCalled();
    });

    it('should set "empty value" error message', () => {
      setupSpies('', '');

      let validators = viewModel.getValidators('', []);
      viewModel.validateTitle(validators);

      expect(getTitleError()).toBe('empty val message');
      expect(Validations.isEmptyTitle).toHaveBeenCalled();
      expect(Validations.isInvalidTitle).not.toHaveBeenCalled();
      expect(Validations.isDublicateTitle).not.toHaveBeenCalled();
      expect(Validations.isReservedByCustomAttr).not.toHaveBeenCalled();
      expect(Validations.isReservedByModelAttr).not.toHaveBeenCalled();
    });

    it('should set "invalid value" error message', () => {
      setupSpies('', '');

      let validators = viewModel.getValidators('my * title', []);
      viewModel.validateTitle(validators);

      expect(getTitleError()).toBe('invalid val message');
      expect(Validations.isEmptyTitle).toHaveBeenCalled();
      expect(Validations.isInvalidTitle).toHaveBeenCalled();
      expect(Validations.isDublicateTitle).not.toHaveBeenCalled();
      expect(Validations.isReservedByCustomAttr).not.toHaveBeenCalled();
      expect(Validations.isReservedByModelAttr).not.toHaveBeenCalled();
    });

    it('should set "duplicated value" error message', () => {
      setupSpies('', '');

      let validators = viewModel.getValidators('my title', ['my title']);
      viewModel.validateTitle(validators);

      expect(getTitleError()).toBe('duplicates val message');
      expect(Validations.isEmptyTitle).toHaveBeenCalled();
      expect(Validations.isInvalidTitle).toHaveBeenCalled();
      expect(Validations.isDublicateTitle).toHaveBeenCalled();
      expect(Validations.isReservedByCustomAttr).not.toHaveBeenCalled();
      expect(Validations.isReservedByModelAttr).not.toHaveBeenCalled();
    });

    it('should set "custom attr" error message', () => {
      const expectedMessage = 'custom attr message';
      setupSpies(expectedMessage, '');

      let validators = viewModel.getValidators('new_checkbox', []);
      viewModel.validateTitle(validators);

      expect(getTitleError()).toBe(expectedMessage);
      expect(Validations.isEmptyTitle).toHaveBeenCalled();
      expect(Validations.isInvalidTitle).toHaveBeenCalled();
      expect(Validations.isDublicateTitle).toHaveBeenCalled();
      expect(Validations.isReservedByCustomAttr).toHaveBeenCalled();
      expect(Validations.isReservedByModelAttr).not.toHaveBeenCalled();
    });

    it('should set "model attr" error message', () => {
      const expectedMessage = 'model attr message';
      setupSpies('', expectedMessage);

      let validators = viewModel.getValidators('code', []);
      viewModel.validateTitle(validators);

      expect(getTitleError()).toBe(expectedMessage);
      expect(Validations.isEmptyTitle).toHaveBeenCalled();
      expect(Validations.isInvalidTitle).toHaveBeenCalled();
      expect(Validations.isDublicateTitle).toHaveBeenCalled();
      expect(Validations.isReservedByCustomAttr).toHaveBeenCalled();
      expect(Validations.isReservedByModelAttr).toHaveBeenCalled();
    });
  });
});
