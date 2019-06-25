/*
Copyright (C) 2019 Google Inc.
Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loEvery from 'lodash/every';
import loFind from 'lodash/find';
import canList from 'can-list';
import canMap from 'can-map';
import CustomAttributeAccess from '../custom-attribute-access';
import CustomAttributeObject from '../custom-attribute-object';
import {CUSTOM_ATTRIBUTE_TYPE} from '../custom-attribute-config';
import {hasGCAErrors} from '../custom-attribute-validations';

describe('CustomAttributeAccess module', () => {
  let origCaAttrDefs;
  let caAccess;
  let instance;

  beforeEach(function () {
    origCaAttrDefs = GGRC.custom_attr_defs;
    instance = new canMap();
    caAccess = new CustomAttributeAccess(instance);
  });

  afterEach(function () {
    GGRC.custom_attr_defs = origCaAttrDefs;
  });

  describe('constructor', () => {
    let instance;

    beforeEach(function () {
      instance = new canMap({
        custom_attribute_values: [],
      });
    });

    it('sets _instance to passed instance', function () {
      const caAccess = new CustomAttributeAccess(instance);
      expect(caAccess._instance).toBe(instance);
    });

    it('calls _setupCaDefinitions method', function () {
      let caAccess;
      spyOn(
        CustomAttributeAccess.prototype,
        '_setupCaDefinitions'
      ).and.callThrough();
      caAccess = new CustomAttributeAccess(instance);
      expect(caAccess._setupCaDefinitions).toHaveBeenCalled();
    });

    it('calls _setupCaValues method', function () {
      let caAccess;
      spyOn(
        CustomAttributeAccess.prototype,
        '_setupCaValues'
      );
      caAccess = new CustomAttributeAccess(instance);
      expect(caAccess._setupCaValues).toHaveBeenCalled();
    });

    it('calls _setupCaObjects method', function () {
      let caAccess;
      spyOn(
        CustomAttributeAccess.prototype,
        '_setupCaObjects'
      );
      caAccess = new CustomAttributeAccess(instance);
      expect(caAccess._setupCaObjects).toHaveBeenCalled();
    });
  });

  describe('write() method', () => {
    let caObject;

    beforeEach(function () {
      const caDef = new canMap();
      caObject = new CustomAttributeObject(instance, caDef);
      spyOn(caAccess, '_findCaObjectByCaId').and.returnValue(caObject);
    });

    it('finds caObject by custom attribute id', function () {
      const change = {
        caId: 1,
        value: 'Some text...',
      };
      caAccess.write(change);
      expect(caAccess._findCaObjectByCaId).toHaveBeenCalledWith(change.caId);
    });

    it('applies passed change to the appopriate caObject', function () {
      const change = {
        caId: 1,
        value: 'Some text...',
      };
      const apply = spyOn(caAccess, '_applyChangeToCaObject');
      caAccess.write(change);
      expect(apply).toHaveBeenCalledWith(caObject, change);
    });
  });

  describe('read() method', () => {
    describe('when was specified 0 params', () => {
      it('returns all custom attribute objects', function () {
        const caDefs = [{id: 1}, {id: 2}];
        instance.attr('custom_attribute_definitions', caDefs);
        caAccess._setupCaObjects();
        const caObjects = caAccess.read();
        caObjects.each((caObject, i) => {
          expect(caObject.customAttributeId).toEqual(caDefs[i].id);
        });
      });
    });

    describe('when was specified 1 param', () => {
      describe('if param is an object', () => {
        it('returns filtered custom attribute objects', function () {
          const options = {type: CUSTOM_ATTRIBUTE_TYPE.GLOBAL};
          const gcas = [
            {id: 1, definition_id: null},
            {id: 3, definition_id: null},
          ];
          const caDefs = [
            {id: 2, definition_id: 109},
            ...gcas,
          ];
          instance.attr('custom_attribute_definitions', caDefs);
          caAccess._setupCaObjects();
          const caObjects = caAccess.read(options);
          expect(caObjects.length).toBe(gcas.length);
          gcas.forEach((gca) => {
            const caObject = loFind(caObjects,
              (caObject) => caObject.customAttributeId === gca.id);
            expect(caObject).not.toBeUndefined();
          });
        });

        it('returns an empty canList if there are no custom attribute objects',
          function () {
            const options = {type: CUSTOM_ATTRIBUTE_TYPE.GLOBAL};
            const result = caAccess.read(options);
            expect(result.attr()).toEqual([]);
          });
      });

      it('returns a custom attribute object with certain ca id', function () {
        const caId = 1234;
        const expectedResult = new CustomAttributeObject(
          new canMap(),
          new canMap()
        );
        let result;
        spyOn(caAccess, '_findCaObjectByCaId').and.returnValue(
          expectedResult
        );
        result = caAccess.read(caId);
        expect(caAccess._findCaObjectByCaId).toHaveBeenCalledWith(caId);
        expect(result).toBe(expectedResult);
      });
    });
  });

  describe('updateCaObjects() method', () => {
    describe('when there are custom attribute objects for passed CA values',
      () => {
        let newCaValues;

        beforeEach(function () {
          const caDefs = [{id: 1}, {id: 2}];
          newCaValues = caDefs.map((caDef) => ({
            custom_attribute_id: caDef.id,
            attribute_value: `Some value ${caDef.id}`,
          }));
          instance.attr('custom_attribute_definitions', caDefs);
          caAccess._setupCaObjects();
        });

        it('updates them with help CA values', function () {
          const update = spyOn(CustomAttributeObject.prototype,
            'updateCaValue');
          caAccess.updateCaObjects(newCaValues);
          newCaValues.forEach((newCaValue) => {
            expect(update).toHaveBeenCalledWith(newCaValue);
          });
        });
      });

    it('recalculates the custom attribute value for CA object if passed CA ' +
    'values are not appropriate for them', () => {
      const newCaValues = [
        {custom_attribute_id: 3, attribute_value: 'V3'},
        {custom_attribute_id: 4, attribute_value: 'V4'},
      ];
      const caDefs = [
        {id: 1},
        {id: 2},
        {id: 5},
      ];
      const update = spyOn(CustomAttributeObject.prototype, 'updateCaValue');
      instance.attr('custom_attribute_definitions', caDefs);
      caAccess._setupCaObjects();
      caAccess.updateCaObjects(newCaValues);
      expect(update.calls.count()).toBe(caDefs.length);
      expect(update).toHaveBeenCalledWith({}, true);
    });
  });

  describe('_setupCaObjects() method', () => {
    describe('for the built CA objects', () => {
      beforeEach(function () {
        spyOn(caAccess, '_buildCaObjects');
      });

      it('setups validations for CA objects', function () {
        const builtCaObjects = new Map();
        caAccess._buildCaObjects.and.returnValue(builtCaObjects);
        spyOn(caAccess, '_setupValidations');
        caAccess._setupCaObjects();
        expect(caAccess._setupValidations).toHaveBeenCalledWith(builtCaObjects);
      });

      it('validates each CA object', function () {
        const caDefs = [1, 3, 5].map((id) => new canMap({id}));
        const builtCaObjects = new Map(caDefs.map((caDef) =>
          [caDef.attr('id'), new CustomAttributeObject(new canMap(), caDef)]
        ));
        caAccess._buildCaObjects.and.returnValue(builtCaObjects);
        const validate = spyOn(CustomAttributeObject.prototype, 'validate');
        caAccess._setupCaObjects();
        expect(validate.calls.count()).toBe(caDefs.length);
      });
    });
  });

  describe('_buildCaObjects() method', () => {
    it('built ca objects from appropriate ca definitions and values',
      function () {
        const caDefs = [
          {
            id: 1,
            title: 'Some title 1...',
          },
          {
            id: 3,
            title: 'Some title 2...',
          },
          {
            id: 5,
            title: 'Some title 3...',
          },
        ];
        const caValues = [
          {
            custom_attribute_id: 5,
            attribute_value: 'Some text 3...',
          },
          {
            custom_attribute_id: 3,
            attribute_value: 'Some text 2...',
          },
          {
            custom_attribute_id: 1,
            attribute_value: 'Some text 1...',
          },
        ];
        instance.attr({
          custom_attribute_definitions: caDefs,
          custom_attribute_values: caValues,
        });
        const caObjects = caAccess._buildCaObjects();
        expect(caObjects.size).toBe(caDefs.length);
        caObjects.forEach((caObject) => {
          const caId = caObject.customAttributeId;
          const caDef = caDefs.find((caDef) => caDef.id === caId);
          const caValue = caValues.find((caValue) =>
            caValue.custom_attribute_id === caId
          );
          expect(caObject.title).toBe(caDef.title);
          expect(caObject.value).toBe(caValue.attribute_value);
        });
      });

    it('builds an empty custom attribute value objects for ca definitions' +
    'if these values do not exist', () => {
      const caDefs = [
        {id: 1, default_value: ''},
        {id: 2, default_value: '0'},
        {id: 3, default_value: null},
      ];
      instance.attr('custom_attribute_definitions', caDefs);
      const caObjects = caAccess._buildCaObjects();
      expect(caObjects.size).toBe(caDefs.length);
      caObjects.forEach((caObject) => {
        const caId = caObject.customAttributeId;
        const caDef = caDefs.find((caDef) => caDef.id === caId);
        expect(caObject.value).toBe(caDef.default_value);
      });
    });
  });

  describe('_setupValidations() method', () => {
    let caObjects;

    beforeEach(function () {
      caObjects = new canList();
    });

    describe('for each caObject', () => {
      beforeEach(function () {
        const objects = Array.from(
          {length: 2},
          () => new CustomAttributeObject(new canMap(), new canMap())
        );
        caObjects.push(...objects);
      });

      describe('if caObject has CUSTOM_ATTRIBUTE_TYPE.GLOBAL type', () => {
        it('builds default validations for it', function () {
          const build = spyOn(caAccess, '_buildDefaultValidations');
          caAccess._setupValidations(caObjects);
          caObjects.forEach((caObject) => {
            expect(build).toHaveBeenCalledWith(caObject);
          });
        });
      });

      it('builds default validations by default', function () {
        const build = spyOn(caAccess, '_buildDefaultValidations');
        caAccess._setupValidations(caObjects);
        caObjects.forEach((caObject) => {
          expect(build).toHaveBeenCalledWith(caObject);
        });
      });
    });
  });

  describe('_buildDefaultValidations() method', () => {
    let caObject;

    beforeEach(function () {
      caObject = new CustomAttributeObject(
        new canMap(),
        new canMap()
      );
    });

    it('adds validations for GCA', function () {
      const add = spyOn(caObject.validator, 'addValidationActions');
      caAccess._buildDefaultValidations(caObject);
      expect(add).toHaveBeenCalledWith(hasGCAErrors);
    });
  });

  describe('_getFilteredCaObjects() method', () => {
    let options;

    beforeEach(function () {
      options = {};
    });

    it('returns an empty list if there are no custom attribute objects',
      function () {
        const result = caAccess._getFilteredCaObjects(options);
        expect(result).toEqual([]);
      });

    it('returns a list with the filtered custom attribute objects by type',
      function () {
        let result;
        let isLocal;
        const caDefs = [
          {
            id: 1,
            definition_id: 345435,
          },
          {
            id: 2,
            definition_id: null,
          },
          {
            id: 3,
            definition_id: 234324,
          },
        ];
        const expectedResult = caDefs.filter((caDef) => caDef.definition_id);

        instance.attr('custom_attribute_definitions', caDefs);
        caAccess._setupCaObjects();
        result = caAccess._getFilteredCaObjects({
          type: CUSTOM_ATTRIBUTE_TYPE.LOCAL,
        });
        isLocal = loEvery(result, (caObject) =>
          caObject.type === CUSTOM_ATTRIBUTE_TYPE.LOCAL
        );
        expect(result.length).toBe(expectedResult.length);
        expect(isLocal).toBe(true);
      });
  });

  describe('_setupCaValues() method', () => {
    describe('when there are no custom attribute values', () => {
      beforeEach(function () {
        instance.removeAttr('custom_attribute_values');
      });

      it('sets an empty list for them', () => {
        caAccess._setupCaValues();
        expect(instance.attr('custom_attribute_values').attr()).toEqual([]);
      });
    });
  });

  describe('_setupCaDefinitions() method', () => {
    describe('when there are no custom attribute definitions', () => {
      beforeEach(function () {
        instance.removeAttr('custom_attribute_definitions');
      });

      it('sets global custom attributes depending on definition type',
        function () {
          const caDefs = [{id: 234}, {id: 236}];
          const rootObject = 'Name of root object';
          const getGlobalCa = spyOn(caAccess, '_getGlobalCustomAttributes')
            .and.returnValue(caDefs);
          instance.constructor.root_object = rootObject;
          caAccess._setupCaDefinitions();
          expect(
            instance.attr('custom_attribute_definitions').attr()
          ).toEqual(caDefs);
          expect(getGlobalCa).toHaveBeenCalledWith(rootObject);
        });
    });
  });

  describe('_getGlobalCustomAttributes() method', () => {
    it('returns an empty list if there are no gca', function () {
      const result = caAccess._getGlobalCustomAttributes();
      expect(result).toEqual([]);
    });

    it('returns a list with global custom attributes which have certain type',
      function () {
        const definitionType = 'Type 1';
        const defs = [
          {
            definition_id: null,
            definition_type: definitionType,
          },
          {
            definition_id: null,
            definition_type: 'Type 2',
          },
          {
            definition_id: 453,
            definition_type: 'Type 2',
          },
          {
            definition_id: 123,
            definition_type: definitionType,
          },
        ];
        const expectedResult = defs.filter((gca) =>
          gca.definition_type === definitionType &&
          gca.definition_id === null
        );
        GGRC.custom_attr_defs.push(...defs);
        const result = caAccess._getGlobalCustomAttributes(definitionType);
        expect(result).toEqual(expectedResult);
      });
  });

  describe('_applyChangeToCaObject() method', () => {
    it('sets value for passed caObject from passed change object', function () {
      const caObject = new CustomAttributeObject(
        new canMap(),
        new canMap()
      );
      const change = {
        caId: 123,
        value: 'Some text...',
      };
      caAccess._applyChangeToCaObject(caObject, change);
      expect(caObject.value).toBe(change.value);
    });
  });

  describe('_findCaValueByCaId() method', () => {
    it('returns undefined if there is no needed caValue object', function () {
      const caValue = caAccess._findCaValueByCaId(1234);
      expect(caValue).toBeUndefined();
    });

    describe('returns found caValue with passed custom attribute id', () => {
      let caValues;

      beforeEach(function () {
        caValues = [
          {
            custom_attribute_id: 1,
            attribute_value: 123,
          },
          {
            custom_attribute_id: 3,
            attribute_value: 345,
          },
        ];
      });

      it('when a plain array was passed', function () {
        const caId = 2;
        const value = 234;
        caValues.push({
          custom_attribute_id: caId,
          attribute_value: value,
        });
        const caValue = caAccess._findCaValueByCaId(caId, caValues);
        expect(caValue.attribute_value).toBe(value);
      });

      it('when a canList instance was passed', function () {
        const caId = 2;
        const value = 234;
        caValues.push({
          custom_attribute_id: caId,
          attribute_value: value,
        });
        const caValue = caAccess._findCaValueByCaId(
          caId,
          new canList(caValues)
        );
        expect(caValue.attr('attribute_value')).toBe(value);
      });
    });
  });

  describe('_findCaObjectByCaId() method', () => {
    it('returns undefined if there is no needed caObject object', function () {
      const caObject = caAccess._findCaObjectByCaId(1234);
      expect(caObject).toBeUndefined();
    });

    it('returns found caValue with passed custom attribute id', function () {
      const caId = 2;
      const title = 234;
      let caObject;
      instance.attr('custom_attribute_definitions', [
        {
          id: 1,
          title: 123,
        },
        {
          id: caId,
          title: title,
        },
        {
          id: 3,
          title: 345,
        },
      ]);
      caAccess._setupCaObjects();
      caObject = caAccess._findCaObjectByCaId(caId);
      expect(caObject.title).toBe(title);
    });
  });

  describe('_caObjects getter', () => {
    it('returns an array of ca objects', function () {
      const caDefs = [
        {id: 123},
        {id: 43},
      ];
      instance.attr('custom_attribute_definitions', caDefs);
      caAccess._setupCaObjects();

      const caObjects = caAccess._caObjects;
      expect(caObjects.length).toBe(caDefs.length);
      caDefs.forEach((caDef) => {
        const result = loFind(caObjects, (caObject) =>
          caObject.customAttributeId === caDef.id
        );
        expect(result).toBeDefined();
      });
    });
  });
});
