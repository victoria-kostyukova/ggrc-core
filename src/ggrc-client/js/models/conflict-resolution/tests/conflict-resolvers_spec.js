/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  buildChangeDescriptor,
  simpleFieldResolver,
  customAttributeResolver,
} from '../conflict-resolvers';

describe('conflict resolvers', () => {
  describe('buildChangeDescriptor method', () => {
    describe('builds "hasConflict"', () => {
      it('positive if value was changed locally and on server differently',
        () => {
          let previousValue = '1';
          let currentValue = '2';
          let remoteValue = '3';

          let {hasConflict} = buildChangeDescriptor(
            previousValue,
            currentValue,
            remoteValue);

          expect(hasConflict).toBe(true);
        });

      it('negative if value was changed only on server', () => {
        let previousValue = '1';
        let currentValue = '1';
        let remoteValue = '2';

        let {hasConflict} = buildChangeDescriptor(
          previousValue,
          currentValue,
          remoteValue);

        expect(hasConflict).toBe(false);
      });

      it('negative if value was changed only locally', () => {
        let previousValue = '1';
        let currentValue = '2';
        let remoteValue = '1';

        let {hasConflict} = buildChangeDescriptor(
          previousValue,
          currentValue,
          remoteValue);

        expect(hasConflict).toBe(false);
      });

      it('negative if value was changed locally and on server equally',
        () => {
          let previousValue = '1';
          let currentValue = '2';
          let remoteValue = '2';

          let {hasConflict} = buildChangeDescriptor(
            previousValue,
            currentValue,
            remoteValue);

          expect(hasConflict).toBe(false);
        });
    });

    describe('builds "isChangedLocally"', () => {
      it('positive if value was changed locally', () => {
        let previousValue = '1';
        let currentValue = '2';

        let {isChangedLocally} = buildChangeDescriptor(
          previousValue,
          currentValue);

        expect(isChangedLocally).toBe(true);
      });

      it('negative if value was not changed locally', () => {
        let previousValue = '1';
        let currentValue = '1';

        let {isChangedLocally} = buildChangeDescriptor(
          previousValue,
          currentValue);

        expect(isChangedLocally).toBe(false);
      });
    });
  });

  describe('simpleFieldResolver', () => {
    let baseAttrs;
    let attrs;
    let remoteAttrs;
    let container;

    beforeEach(() => {
      baseAttrs = {};
      attrs = {};
      remoteAttrs = {};
      container = new can.Map();
    });

    it('resolves server change', () => {
      let key = 'field';
      baseAttrs[key] = '1';
      attrs[key] = '1';
      remoteAttrs[key] = '2';

      let hasConflict = simpleFieldResolver(
        baseAttrs,
        attrs,
        remoteAttrs,
        container,
        key);

      expect(hasConflict).toBe(false);
    });

    it('resolves local change', () => {
      let key = 'field';
      baseAttrs[key] = '1';
      attrs[key] = '2';
      remoteAttrs[key] = '1';

      let hasConflict = simpleFieldResolver(
        baseAttrs,
        attrs,
        remoteAttrs,
        container,
        key);

      expect(hasConflict).toBe(false);
    });

    it('resolves the same server and local change', () => {
      let key = 'field';
      baseAttrs[key] = '1';
      attrs[key] = '2';
      remoteAttrs[key] = '2';

      let hasConflict = simpleFieldResolver(
        baseAttrs,
        attrs,
        remoteAttrs,
        container,
        key);

      expect(hasConflict).toBe(false);
      expect(container.attr(key)).toBe('2');
    });

    it('does not resolve different server and local change', () => {
      let key = 'field';
      baseAttrs[key] = '1';
      attrs[key] = '2';
      remoteAttrs[key] = '3';

      let hasConflict = simpleFieldResolver(
        baseAttrs,
        attrs,
        remoteAttrs,
        container,
        key);

      expect(hasConflict).toBe(true);
    });
  });

  describe('customAttributeResolver', () => {
    let previousValue;
    let currentValue;
    let remoteValue;
    let container;

    beforeEach(() => {
      previousValue = [];
      currentValue = [];
      remoteValue = [];
    });

    it('resolves change of different fields', () => {
      previousValue = [{
        custom_attribute_id: 1,
        attribute_value: '1-1',
      }, {
        custom_attribute_id: 2,
        attribute_value: '2-1',
      }];
      currentValue = [{
        custom_attribute_id: 1,
        attribute_value: '1-2',
      }, {
        custom_attribute_id: 2,
        attribute_value: '2-1',
      }];
      remoteValue = [{
        custom_attribute_id: 1,
        attribute_value: '1-1',
      }, {
        custom_attribute_id: 2,
        attribute_value: '2-2',
      }];
      container = new can.List(remoteValue);

      let hasConflict = customAttributeResolver(
        previousValue,
        currentValue,
        remoteValue,
        container);

      expect(hasConflict).toBe(false);
      expect(container.attr('0.attribute_value')).toBe('1-2');
      expect(container.attr('1.attribute_value')).toBe('2-2');
    });

    it('resolves server change', () => {
      previousValue = [{
        custom_attribute_id: 1,
        attribute_value: '1',
      }];
      currentValue = [{
        custom_attribute_id: 1,
        attribute_value: '1',
      }];
      remoteValue = [{
        custom_attribute_id: 1,
        attribute_value: '2',
      }];
      container = new can.List(remoteValue);

      let hasConflict = customAttributeResolver(
        previousValue,
        currentValue,
        remoteValue,
        container);

      expect(hasConflict).toBe(false);
      expect(container.attr('0.attribute_value')).toBe('2');
    });

    it('resolves local change', () => {
      previousValue = [{
        custom_attribute_id: 1,
        attribute_value: '1',
      }];
      currentValue = [{
        custom_attribute_id: 1,
        attribute_value: '2',
      }];
      remoteValue = [{
        custom_attribute_id: 1,
        attribute_value: '1',
      }];
      container = new can.List(remoteValue);

      let hasConflict = customAttributeResolver(
        previousValue,
        currentValue,
        remoteValue,
        container);

      expect(hasConflict).toBe(false);
      expect(container.attr('0.attribute_value')).toBe('2');
    });

    it('resolves the same local and server change', () => {
      previousValue = [{
        custom_attribute_id: 1,
        attribute_value: '1',
      }];
      currentValue = [{
        custom_attribute_id: 1,
        attribute_value: '2',
      }];
      remoteValue = [{
        custom_attribute_id: 1,
        attribute_value: '2',
      }];
      container = new can.List(remoteValue);

      let hasConflict = customAttributeResolver(
        previousValue,
        currentValue,
        remoteValue,
        container);

      expect(hasConflict).toBe(false);
      expect(container.attr('0.attribute_value')).toBe('2');
    });

    it('does not resolve different local and server change', () => {
      previousValue = [{
        custom_attribute_id: 1,
        attribute_value: '1',
      }];
      currentValue = [{
        custom_attribute_id: 1,
        attribute_value: '2',
      }];
      remoteValue = [{
        custom_attribute_id: 1,
        attribute_value: '3',
      }];
      container = new can.List(remoteValue);

      let hasConflict = customAttributeResolver(
        previousValue,
        currentValue,
        remoteValue,
        container);

      expect(hasConflict).toBe(true);
    });
  });
});
