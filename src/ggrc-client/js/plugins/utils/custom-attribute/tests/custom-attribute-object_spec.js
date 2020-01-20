/*
Copyright (C) 2020 Google Inc.
Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import CustomAttributeObject from '../custom-attribute-object';
import {caDefTypeName} from '../custom-attribute-config';
import {CONTROL_TYPE} from '../../control-utils.js';
import {CUSTOM_ATTRIBUTE_TYPE} from './../custom-attribute-config';
import StateValidator from '../../state-validator-utils';

describe('CustomAttributeObject module', () => {
  let caObject;
  let instance;
  let caDef;
  let caValue;

  beforeEach(function () {
    instance = new canMap();
    caDef = new canMap();
    caValue = new canMap();
    caObject = new CustomAttributeObject(instance, caDef, caValue);
  });

  describe('constructor', () => {
    it('sets instance for caObject', function () {
      const instance = new canMap();
      const caObject = new CustomAttributeObject(
        instance,
        new canMap()
      );
      expect(caObject._instance).toBe(instance);
    });

    it('sets custom attribute definition for caObject', function () {
      const caDef = new canMap();
      const caObject = new CustomAttributeObject(
        new canMap(),
        caDef
      );
      expect(caObject._caDefinition).toBe(caDef);
    });

    describe('calls _initCaValue() method', () => {
      beforeEach(function () {
        spyOn(CustomAttributeObject.prototype, '_setupCaValue');
      });

      it('with empty canMap if caValue was not passed via params',
        function () {
          let caObject;
          let caValue;

          caObject = new CustomAttributeObject(
            new canMap(),
            new canMap()
          );
          caValue = caObject._setupCaValue.calls.argsFor(0)[0];

          expect(caValue).toEqual(jasmine.any(canMap));
          expect(caValue.attr()).toEqual({});
        });

      it('with passed caValue if it was provided', function () {
        const caValue = new canMap({
          field1: 1,
          field2: 2,
        });
        const caObject = new CustomAttributeObject(
          new canMap(),
          new canMap(),
          caValue
        );
        expect(caObject._setupCaValue).toHaveBeenCalledWith(caValue);
      });
    });

    it('calls _buildStateValidator() method', function () {
      let caObject;
      spyOn(CustomAttributeObject.prototype, '_buildStateValidator');
      caObject = new CustomAttributeObject(
        new canMap(),
        new canMap()
      );
      expect(caObject._buildStateValidator).toHaveBeenCalled();
    });
  });

  describe('value getter', () => {
    describe('when caObject has checkbox type', function () {
      it('returns true if custom attribute value equals to "1"', function () {
        caDef.attr('attribute_type', caDefTypeName.Checkbox);
        caObject.value = '1';
        expect(caObject.value).toBe(true);
      });

      it('returns false if custom attribute value does not equal to "1"',
        function () {
          caDef.attr('attribute_type', caDefTypeName.Checkbox);
          caObject.value = '0';
          expect(caObject.value).toBe(false);
        });
    });

    describe('when caObject has Person type', function () {
      it('returns person id if custom attribute object has "id"', function () {
        caDef.attr('attribute_type', caDefTypeName.MapPerson);
        const id = 345;
        caValue.attr('attribute_object', {id});
        expect(caObject.value).toBe(id);
      });

      it('returns "null" if custom attribute object doesn\'t have "id"',
        function () {
          caDef.attr('attribute_type', caDefTypeName.MapPerson);
          caValue.attr('attribute_object', {email: 345});
          expect(caObject.value).toBeNull();
        });
    });

    it('returns custom attribute value', function () {
      const value = 'Some ca value';
      caValue.attr('attribute_value', value);
      expect(caObject.value).toBe(value);
    });
  });

  describe('value setter', () => {
    it('sets custom attribute value to prepared value from param ' +
    'method', function () {
      const value = 'Value before preparing';
      const preparedValue = 'Value after preparing';
      const prepare = spyOn(caObject, '_prepareAttributeValue')
        .and.returnValue(preparedValue);
      caObject.value = value;
      expect(prepare).toHaveBeenCalledWith(value);
      expect(caValue.attr('attribute_value')).toBe(preparedValue);
    });
  });

  describe('customValueId getter', () => {
    it('returns custom attribute id', function () {
      const id = 100;
      caValue.attr('id', id);
      expect(caObject.customValueId).toBe(id);
    });
  });

  describe('title getter', () => {
    it('returns custom attribute title', function () {
      const title = 'Title';
      caDef.attr('title', title);
      expect(caObject.title).toBe(title);
    });
  });

  describe('placeholder getter', () => {
    it('returns custom attribute placeholder', function () {
      const placeholder = 'Some placeholder...';
      caDef.attr('placeholder', placeholder);
      expect(caObject.placeholder).toBe(placeholder);
    });
  });

  describe('helptext getter', () => {
    it('returns custom attribute help text', function () {
      const helptext = 'Some help text...';
      caDef.attr('helptext', helptext);
      expect(caObject.helptext).toBe(helptext);
    });
  });

  describe('customAttributeId getter', () => {
    it('returns custom attribute id', function () {
      const id = 12345;
      caDef.attr('id', id);
      expect(caObject.customAttributeId).toBe(id);
    });
  });

  describe('mandatory getter', () => {
    it('returns custom attribute mandatory state', function () {
      const mandatory = true;
      caDef.attr('mandatory', mandatory);
      expect(caObject.mandatory).toBe(mandatory);
    });
  });

  describe('attributeType getter', () => {
    it('returns custom attribute control type', function () {
      const attributeType = caDefTypeName.RichText;
      caDef.attr('attribute_type', attributeType);
      expect(caObject.attributeType).toBe(CONTROL_TYPE.TEXT);
    });
  });

  describe('attributeObject getter', () => {
    it('returns custom attribute object', function () {
      const attributeObject = new canMap();
      caValue.attr('attribute_object', attributeObject);
      expect(caObject.attributeObject).toBe(attributeObject);
    });
  });

  describe('type getter', () => {
    it('returns CUSTOM_ATTRIBUTE_TYPE.GLOBAL if custom attribute is global',
      function () {
        caDef.attr('definition_id', null);
        expect(caObject.type).toBe(CUSTOM_ATTRIBUTE_TYPE.GLOBAL);
      });

    it('returns CUSTOM_ATTRIBUTE_TYPE.LOCAL if custom attribute is local',
      function () {
        caDef.attr('definition_id', 123);
        expect(caObject.type).toBe(CUSTOM_ATTRIBUTE_TYPE.LOCAL);
      });
  });

  describe('multiChoiceOptions getter', () => {
    it('returns an empty array if custom attribute does not have multi ' +
    'choice options', function () {
      caDef.attr('multi_choice_options', null);
      expect(caObject.multiChoiceOptions).toEqual([]);
    });

    it('returns a list with options if custom attribute has multi choice ' +
    'options', function () {
      const options = '1,2,3';
      const expectedOptions = options.split(',');
      caDef.attr('multi_choice_options', options);
      expect(caObject.multiChoiceOptions).toEqual(expectedOptions);
    });
  });

  describe('validator getter', () => {
    it('returns StateValidator object', function () {
      const sv = caObject.validator;
      expect(sv).toEqual(jasmine.any(StateValidator));
    });
  });

  describe('validationState getter', () => {
    it('returns validation state', function () {
      const state = new canMap();
      caObject._validationState = state;
      expect(caObject.validationState).toBe(state);
    });
  });

  describe('updateCaValue() method', () => {
    describe('setups CAV object', () => {
      beforeEach(function () {
        spyOn(caObject, '_setupCaValue');
      });

      it('though passed canMap instance', function () {
        const caValue = new canMap({prop: 1});
        caObject.updateCaValue(caValue);
        const wrappedCaValue = caObject._setupCaValue.calls.argsFor(0)[0];
        expect(wrappedCaValue.attr())
          .toEqual(caValue.attr());
      });

      it('though passed plain object', function () {
        const caValue = {prop: 1};
        caObject.updateCaValue(caValue);
        const wrappedCaValue = caObject._setupCaValue.calls.argsFor(0)[0];
        expect(wrappedCaValue.attr())
          .toEqual(caValue);
      });
    });

    it('updates current CAV object', function () {
      const caValue = new canMap({attribute_value: 'Some value'});
      caObject.updateCaValue(caValue);
      expect(caObject.value).toBe(caValue.attr('attribute_value'));
    });
  });

  describe('validate() method', () => {
    it('updates validation state', function () {
      const {validator} = caObject;
      validator.addValidationActions(() => ({a: 1}));
      validator.addValidationActions(() => ({b: 2}));
      caObject.validate();
      expect(caObject.validationState.attr()).toEqual({
        a: 1,
        b: 2,
      });
    });
  });

  describe('_setupCaValue() method', () => {
    describe('when passed caValue does not have required', () => {
      let caValue;

      beforeEach(function () {
        caValue = new canMap();
      });

      it('attribute_object field then set it to null', function () {
        caObject._setupCaValue(caValue);
        expect(caValue.attr('attribute_object')).toBeNull();
      });

      it('attribute_value field then set it to result ' +
      'of _prepareAttributeValue method', function () {
        const preparedValue = '12345';
        const prepareValue = spyOn(caObject, '_prepareAttributeValue')
          .and.returnValue(preparedValue);

        caValue.attr({attribute_value: '12345'});
        caObject._setupCaValue(caValue);

        expect(prepareValue).toHaveBeenCalledWith(
          caValue.attr('attribute_value')
        );
        expect(caValue.attr('attribute_value')).toBe(preparedValue);
      });

      it('context field then set it to context owned by instance which ' +
      'contains current caObject data', function () {
        const context = new canMap();
        instance.attr('context', context);
        caObject._setupCaValue(caValue);
        expect(caValue.attr('context')).toBe(context);
      });

      it('custom_attribute_id field then set it to id from custom attribute' +
      'definition', function () {
        const caId = 12345;
        caDef.attr('id', caId);
        caObject._setupCaValue(caValue);
        expect(caValue.attr('custom_attribute_id')).toBe(caId);
      });
    });
  });

  describe('_initCaValue() method', () => {
    it('setups passed CAV object', function () {
      const caValue = new canMap({prop: 1});
      spyOn(caObject, '_setupCaValue');
      caObject._initCaValue(caValue);
      expect(caObject._setupCaValue).toHaveBeenCalledWith(caValue);
    });

    it('sets CAV object', function () {
      const caValue = new canMap({attribute_value: 'Some value'});
      caObject.updateCaValue(caValue);
      expect(caObject.value).toBe(caValue.attr('attribute_value'));
    });
  });

  describe('_prepareAttributeValue() method', () => {
    it('returns "Person" string if custom attribute has ' +
    'caDefTypeName.MapPerson type', function () {
      let result;
      caDef.attr('attribute_type', caDefTypeName.MapPerson);
      result = caObject._prepareAttributeValue();
      expect(result).toBe('Person');
    });

    describe('when custom attribute has caDefTypeName.Checkbox type',
      () => {
        beforeEach(function () {
          caDef.attr('attribute_type', caDefTypeName.Checkbox);
        });

        describe('returns "1"', () => {
          it('if passed value equals to true', function () {
            const result = caObject._prepareAttributeValue(true);
            expect(result).toBe('1');
          });

          it('if passed value equals to "1"', function () {
            const result = caObject._prepareAttributeValue('1');
            expect(result).toBe('1');
          });
        });

        it('returns "0"', function () {
          const result = caObject._prepareAttributeValue();
          expect(result).toBe('0');
        });
      });

    it('returns passed value by default if custom attribute type is ' +
    'not caDefTypeName.MapPerson or caDefTypeName.CheckBox', () => {
      const attrTypes = [
        caDefTypeName.Text, caDefTypeName.RichText, caDefTypeName.Input,
        caDefTypeName.Dropdown, caDefTypeName.Date,
      ];
      const value = {};
      attrTypes.forEach((attrType) => {
        caDef.attr('attribute_type', attrType);
        const result = caObject._prepareAttributeValue(value);
        expect(result).toBe(value);
      });
    });

    it('returns default value for custom attribute type from ' +
    'attribute definitions if no value was passed', () => {
      const attrDefs = [
        {type: caDefTypeName.Text, value: 'text'},
        {type: caDefTypeName.RichText, value: 'rich text'},
        {type: caDefTypeName.Input, value: 'input'},
        {type: caDefTypeName.Dropdown, value: 'dropdown'},
        {type: caDefTypeName.Multiselect, value: 'multiselect'},
        {type: caDefTypeName.Date, value: 'date'},
      ];
      attrDefs.forEach((attrDef) => {
        caDef.attr('attribute_type', attrDef.type);
        caDef.attr('default_value', attrDef.value);
        const result = caObject._prepareAttributeValue();
        expect(result).toBe(attrDef.value);
      });
    });
  });

  describe('_prepareAttributeObject() method', () => {
    it('returns a stub for the person if custom attribute has ' +
    'caDefTypeName.MapPerson type', function () {
      const stub = {
        id: 12345,
        type: 'Person',
      };
      caDef.attr('attribute_type', caDefTypeName.MapPerson);
      const result = caObject._prepareAttributeObject(stub.id);
      expect(result).toEqual(stub);
    });

    it('returns default value if custom attribute has ' +
    'caDefTypeName.MapPerson type but value is not recognized', () => {
      const defValue = 'default value';
      caDef.attr('attribute_type', caDefTypeName.MapPerson);
      caDef.attr('default_value', defValue);
      const result = caObject._prepareAttributeObject();
      expect(result).toEqual(defValue);
    });

    it('returns null by default if custom attribute type is ' +
    'not recognizable', function () {
      const result = caObject._prepareAttributeObject();
      expect(result).toBeNull();
    });

    it('returns null by default if custom attribute type is ' +
      'not caDefTypeName.MapPerson', function () {
      const attrTypes = [
        caDefTypeName.Text, caDefTypeName.RichText, caDefTypeName.Input,
        caDefTypeName.Dropdown, caDefTypeName.Date, caDefTypeName.Checkbox,
        caDefTypeName.Multiselect,
      ];
      attrTypes.forEach((attrType) => {
        caDef.attr('attribute_type', attrType);
        const result = caObject._prepareAttributeObject();
        expect(result).toBeNull();
      });
    });
  });

  describe('_buildStateValidator() method', () => {
    it('creates inner state validator', function () {
      caObject._buildStateValidator();
      expect(caObject._validator).toEqual(jasmine.any(StateValidator));
    });

    it('injects itself inside created state validator', function (done) {
      const validateAction = ({currentCaObject}) =>
        currentCaObject === caObject
          ? done()
          : done.fail('Incorrect injection');

      caObject._buildStateValidator();
      caObject.validator.addValidationActions(validateAction);
      caObject.validate();
    });

    it('creates _validationState as an empty canMap', function () {
      caObject._buildStateValidator();
      expect(caObject._validationState).toEqual(jasmine.any(canMap));
      expect(caObject._validationState.attr()).toEqual({});
    });
  });
});
