/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {makeFakeInstance} from '../../../js_specs/spec-helpers';
import * as SnapshotUtils from '../utils/snapshot-utils';
import Audit from '../../models/business-models/audit';
import canMap from 'can-map';

describe('SnapshotUtils', function () {
  describe('isSnapshotType() method', function () {
    let instance;

    beforeEach(function () {
      instance = {
        type: 'Snapshot',
        viewLink: '/snapshots/123',
      };
    });

    it('isSnapshotType() should return true', function () {
      expect(SnapshotUtils.isSnapshotType(instance))
        .toBe(true);
    });

    it('isSnapshotType() should return false', function () {
      instance.type = 'Assessment';
      expect(SnapshotUtils.isSnapshotType(instance))
        .toBe(false);
    });

    it('isSnapshotType() should return false. Pass empty object', function () {
      expect(SnapshotUtils.isSnapshotType({}))
        .toBe(false);
    });
  });

  describe('toObject() method', function () {
    let snapshot;
    let toObject;

    beforeAll(function () {
      toObject = SnapshotUtils.toObject;
    });

    beforeEach(function () {
      makeFakeInstance({model: Audit})({id: 1});
      snapshot = {
        id: 12345,
        type: 'Snapshot',
        child_id: 42,
        child_type: 'Control',
        parent: {
          id: 1,
          type: 'Audit',
        },
        updated_at: '10/10/2010',
        revision: {
          content: {
            access_control_list: [
              {ac_role_id: 10, person_id: 4},
              {ac_role_id: 17, person_id: 2},
              {ac_role_id: 12, person_id: 4},
            ],
          },
        },
      };
    });

    it('adds person stubs to access control list items', function () {
      let result = toObject(snapshot);

      expect(result.access_control_list).toBeDefined();

      result.access_control_list.forEach(function (item) {
        expect(item.person).toBeDefined();
        expect(item.person.type).toEqual('Person');
        expect(item.person.id).toEqual(item.person_id);
      });
    });

    it('sets original link to snapshot object', function () {
      let result = toObject(snapshot);

      expect(result.attr('originalLink')).toEqual('/controls/42');
    });

    it('returns object with updated_at of snapshot', () => {
      let result = toObject(snapshot);

      expect(result.attr('updated_at')).toBe(snapshot.updated_at);
    });
  });

  describe('extendSnapshot() method', function () {
    let snapshot = {
      title: 'title',
      description: 'description',
      originalLink: 'originalLink',
      constructor: {},
    };

    let expected = jasmine.objectContaining({
      title: snapshot.title,
      description: snapshot.description,
      viewLink: snapshot.originalLink,
      constructor: snapshot.constructor,
    });

    let instance;
    let result;

    it('object should contain properties from snapshot ' +
      'if object instance of Object', function () {
      instance = {};

      result = SnapshotUtils.extendSnapshot(
        instance,
        snapshot,
      );

      expect(result).toEqual(expected);
      expect(result instanceof canMap).toBe(true);
    });

    it('returns object with properties from snapshot ' +
      ' if object instance of canMap', function () {
      instance = new canMap();

      result = SnapshotUtils.extendSnapshot(
        instance,
        snapshot,
      );

      expect(result).toEqual(expected);
      expect(result instanceof canMap).toBe(true);
    });
  });
});
