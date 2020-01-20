/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list/can-list';
import canModel from 'can-model/src/can-model';
import canMap from 'can-map/can-map';

describe('validateDefaultPeople extensions.', () => {
  describe('validateDefaultAssignees extension', () => {
    let TestModel;

    beforeAll(() => {
      TestModel = canModel.extend({}, {
        define: {
          default_people: {
            value: new canMap([]),
            validate: {
              validateDefaultAssignees: true,
            },
          },
        },
      });
    });

    it('shoud return TRUE, assignees is NOT empty list', () => {
      const instance = new TestModel();
      instance.attr('default_people', new canMap({
        assignees: new canList([1, 2]),
      }));
      expect(instance.validate()).toBeTruthy();
      expect(instance.errors.default_people).toBeUndefined();
    });

    it('shoud return TRUE, assignees is NOT empty string', () => {
      const instance = new TestModel();
      instance.attr('default_people', new canMap({
        assignees: 'Auditor',
      }));
      expect(instance.validate()).toBeTruthy();
      expect(instance.errors.default_people).toBeUndefined();
    });

    it('shoud return FALSE, assignees is EMPTY string', () => {
      const instance = new TestModel();
      instance.attr('default_people', new canMap({
        assignees: '',
      }));
      expect(instance.validate()).toBeFalsy();
      expect(instance.errors.default_people[0].assignees)
        .toEqual('cannot be blank');
    });

    it('shoud return FALSE, assignees is undefined', () => {
      const instance = new TestModel();
      instance.attr('default_people', new canMap({
        assignees: undefined,
      }));
      expect(instance.validate()).toBeFalsy();
      expect(instance.errors.default_people[0].assignees)
        .toEqual('cannot be blank');
    });

    it('shoud return FALSE, assignees is EMPTY list', () => {
      const instance = new TestModel();
      instance.attr('default_people', new canMap({
        assignees: new canList([]),
      }));
      expect(instance.validate()).toBeFalsy();
      expect(instance.errors.default_people[0].assignees)
        .toEqual('cannot be blank');
    });
  });

  describe('validateDefaultVerifiers extension', () => {
    let TestModel;

    beforeAll(() => {
      TestModel = canModel.extend({}, {
        define: {
          default_people: {
            value: new canMap([]),
            validate: {
              validateDefaultVerifiers: true,
            },
          },
        },
      });
    });

    it('shoud return TRUE, verifiers is NOT empty list', () => {
      const instance = new TestModel();
      instance.attr('default_people', new canMap({
        verifiers: new canList([1, 2]),
      }));
      expect(instance.validate()).toBeTruthy();
      expect(instance.errors.default_people).toBeUndefined();
    });

    it('shoud return TRUE, verifiers is NOT empty string', () => {
      const instance = new TestModel();
      instance.attr('default_people', new canMap({
        verifiers: 'Auditor',
      }));
      expect(instance.validate()).toBeTruthy();
      expect(instance.errors.default_people).toBeUndefined();
    });

    it('shoud return TRUE, verifiers is EMPTY string', () => {
      const instance = new TestModel();
      instance.attr('default_people', new canMap({
        verifiers: '',
      }));
      expect(instance.validate()).toBeTruthy();
      expect(instance.errors.default_people).toBeUndefined();
    });

    it('shoud return TRUE, verifiers is undefined', () => {
      const instance = new TestModel();
      instance.attr('default_people', new canMap({
        verifiers: undefined,
      }));
      expect(instance.validate()).toBeTruthy();
      expect(instance.errors.default_people).toBeUndefined();
    });

    it('shoud return FALSE, verifiers is EMPTY list', () => {
      const instance = new TestModel();
      instance.attr('default_people', new canMap({
        verifiers: new canList([]),
      }));
      expect(instance.validate()).toBeFalsy();
      expect(instance.errors.default_people[0].verifiers)
        .toEqual('cannot be blank');
    });
  });
});
