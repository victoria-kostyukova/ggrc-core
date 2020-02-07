/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../../../models/cacheable';
import Component from '../tree-item-custom-attribute';
import {
  makeFakeInstance,
  getComponentVM,
} from '../../../../js_specs/spec-helpers';
import * as DateUtils from '../../../plugins/utils/date-utils';
import * as MarkdownUtils from '../../../plugins/utils/markdown-utils';

describe('tree-item-custom-attribute component', () => {
  let fakeInstance;
  let origValue;
  let viewModel;

  beforeAll(() => {
    origValue = GGRC.custom_attr_defs;
  });

  afterAll(() => {
    GGRC.custom_attr_defs = origValue;
  });

  beforeEach(() => {
    const fakeCustomAttrDefs = [{
      definition_type: 'control',
      title: 'Type',
      attribute_type: '',
      id: 3,
    },
    {
      definition_type: 'control',
      title: 'CheckBox',
      attribute_type: 'Checkbox',
      id: 4,
    },
    {
      definition_type: 'control',
      title: 'Start Date',
      attribute_type: 'Date',
      id: 5,
    },
    {
      definition_type: 'control',
      title: 'Text',
      attribute_type: 'Text',
      id: 6,
    },
    {
      definition_type: 'control',
      title: 'Rich Text',
      attribute_type: 'Rich Text',
      id: 7,
    },
    {
      definition_type: 'control',
      title: 'Date',
      attribute_type: 'Date',
      id: 9,
    },
    {
      definition_type: 'control',
      title: 'Dropdown',
      attribute_type: 'Dropdown',
      id: 10,
    },
    {
      definition_type: 'control',
      title: 'Multiselect',
      attribute_type: 'Multiselect',
      id: 11,
    }];

    fakeInstance = makeFakeInstance({
      model: Cacheable,
      staticProps: {
        is_custom_attributable: true,
        isChangeableExternally: false,
      },
    })({
      custom_attribute_definitions: fakeCustomAttrDefs,
    });

    GGRC.custom_attr_defs = fakeCustomAttrDefs;

    viewModel = getComponentVM(Component);
    viewModel.instance = fakeInstance;
  });

  describe('value getter', () => {
    it('return correct value if there is ca value with certain caId',
      function () {
        const caId = 3;
        const value = 'correctValue';
        fakeInstance.customAttr(caId, value);
        viewModel.customAttributeId = caId;

        expect(viewModel.value).toBe(value);
      });

    describe('return an empty string', () => {
      it('if ca value is empty', function () {
        const caId = 3;
        fakeInstance.customAttr(caId, null);
        viewModel.customAttributeId = caId;

        expect(viewModel.value).toBe('');
      });

      it('if caObject was not found', function () {
        const caId = 10000;
        viewModel.customAttributeId = caId;

        expect(viewModel.value).toBe('');
      });
    });

    describe('for caObject of Checkbox type', () => {
      it('returns "Yes" if ca value is true',
        function () {
          const caId = 4;
          fakeInstance.customAttr(caId, true);
          viewModel.customAttributeId = caId;

          expect(viewModel.value).toEqual('Yes');
        });

      it('returns "No" if ca value is false',
        function () {
          const caId = 4;
          fakeInstance.customAttr(caId, false);
          viewModel.customAttributeId = caId;

          expect(viewModel.value).toEqual('No');
        });
    });

    describe('for caObject of Multiselect type', () => {
      it('returns caObject value', function () {
        const caId = 11;
        const value = 'Option 1, Option 2';
        fakeInstance.customAttr(caId, value);
        viewModel.customAttributeId = caId;
        expect(viewModel.value).toBe(value);
      });
    });

    describe('for caObject of Date type', () => {
      it('returns formatted date when CAD was found', function () {
        const caId = 9;
        const expected = 'expected date';
        const attrValue = '2017-09-30';
        spyOn(DateUtils, 'formatDate')
          .and.returnValue(expected);

        fakeInstance.customAttr(caId, attrValue);
        viewModel.customAttributeId = caId;

        expect(viewModel.value).toBe(expected);
        expect(DateUtils.formatDate)
          .toHaveBeenCalledWith(attrValue, true);
      });
    });

    describe('for caObject of Dropdown type', () => {
      it('returns caObject value', function () {
        const caId = 10;
        const value = 'Choice 1';
        fakeInstance.customAttr(caId, value);
        viewModel.customAttributeId = caId;

        expect(viewModel.value).toBe(value);
      });
    });

    describe('for caObject of Text type', () => {
      it('returns caObject value', function () {
        const caId = 6;
        const value = 'Some text';
        fakeInstance.customAttr(caId, value);
        viewModel.customAttributeId = caId;

        expect(viewModel.value).toBe(value);
      });
    });

    describe('for caObject of Rich Text type', () => {
      it('returns caObject value', function () {
        const caId = 7;
        const value = '<strong>some text</strong>';
        fakeInstance.customAttr(caId, value);
        viewModel.customAttributeId = caId;

        expect(viewModel.value).toBe(value);
      });
    });

    describe('if isMarkdown is true', () => {
      it('returns converted value', () => {
        spyOn(MarkdownUtils, 'convertMarkdownToHtml')
          .and.returnValue('some markdown');
        const caId = 7;
        const value = '<strong>some text</strong>';
        fakeInstance.constructor.isChangeableExternally = true;
        fakeInstance.customAttr(caId, value);
        viewModel.customAttributeId = caId;

        expect(viewModel.value).toBe('some markdown');
        expect(MarkdownUtils.convertMarkdownToHtml)
          .toHaveBeenCalledWith(value);
      });
    });
  });
});
