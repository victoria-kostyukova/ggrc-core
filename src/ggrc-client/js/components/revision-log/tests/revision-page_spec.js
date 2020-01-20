/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../revision-page';
import Person from '../../../models/business-models/person';

describe('revision-page component', function () {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('computeChanges() method', () => {
    beforeEach(() => {
      spyOn(viewModel, '_computeObjectChanges');
      spyOn(viewModel, '_computeMappingChanges');
    });

    it('assigns computed object changes to changeHistory attr', () => {
      const revisions = new canMap({
        object: [],
        revisionsForCompare: [],
      });
      const objectChanges = [{
        id: 1,
        updatedAt: 3,
      }];
      viewModel._computeObjectChanges.and.returnValue(objectChanges);

      viewModel.attr('revisions', revisions);

      expect(viewModel.attr('changeHistory').serialize())
        .toEqual(jasmine.arrayContaining(objectChanges));
      expect(viewModel._computeObjectChanges)
        .toHaveBeenCalledWith(revisions.object, revisions.revisionsForCompare);
      expect(viewModel._computeObjectChanges.calls.count()).toBe(1);
    });

    it('assigns computed mapping changes to changeHistory attr', () => {
      const revisions = new canMap({
        mappings: [],
      });
      const mappingChanges = {
        id: 3,
        updatedAt: 2,
      };
      viewModel._computeMappingChanges
        .and.returnValue(mappingChanges);

      viewModel.attr('revisions', revisions);

      expect(viewModel.attr('changeHistory').serialize())
        .toEqual(jasmine.arrayContaining([mappingChanges]));
      expect(viewModel._computeMappingChanges)
        .toHaveBeenCalledWith(revisions.mappings);
      expect(viewModel._computeMappingChanges.calls.count()).toBe(1);
    });

    it('sorts all computed changes by "updatedAt" in descending order ' +
    'in changeHistory attr', () => {
      viewModel._computeObjectChanges.and.returnValue([{
        id: 1,
        updatedAt: 3,
      }, {
        id: 2,
        updatedAt: 1,
      }]);
      viewModel._computeMappingChanges.and.returnValue([{
        id: 3,
        updatedAt: 2,
      }]);
      const expected = [{
        id: 1,
        updatedAt: 3,
      }, {
        id: 3,
        updatedAt: 2,
      }, {
        id: 2,
        updatedAt: 1,
      }];

      viewModel.attr('revisions', {});

      expect(viewModel.attr('changeHistory').serialize())
        .toEqual(expected);
    });
  });

  describe('_computeObjectChanges() method', function () {
    it('computes an empty list on empty Revision history', function () {
      let result;
      let revisions = new canList();

      spyOn(viewModel, '_objectChangeDiff');
      result = viewModel._computeObjectChanges(revisions, []);

      expect(result.length).toEqual(0);
    });

    it('computes diff objects for all successive Revision pairs', function () {
      let result;

      let revisions = [
        {id: 10}, {id: 20}, {id: 30},
      ];

      let diff = {
        madeBy: 'John',
        changes: [
          {fieldName: 'foo'},
        ],
      };
      let diff2 = {
        madeBy: 'Doe',
        changes: [
          {fieldName: 'bar'},
        ],
      };

      spyOn(viewModel, '_objectChangeDiff').and.returnValues(diff, diff2);

      result = viewModel._computeObjectChanges(revisions, []);

      expect(viewModel._objectChangeDiff.calls.count()).toEqual(3);

      expect(result.length).toEqual(2);
      expect(result[0]).toEqual(diff);
      expect(result[1]).toEqual(diff2);
    });

    it('omits the diff objects with an empty changes list from the result',
      function () {
        let result;

        let revisions = [
          {id: 10}, {id: 20},
        ];

        let diff = {
          changes: [],
        };
        spyOn(viewModel, '_objectChangeDiff').and.returnValue(diff);

        result = viewModel._computeObjectChanges(revisions, []);

        expect(result.length).toEqual(0);
      }
    );
  });

  describe('_objectChangeDiff() method', function () {
    let origModelAttrDefs = GGRC.model_attr_defs; // original user-friendly attribute name settings

    beforeEach(function () {
      spyOn(viewModel, '_objectCADiff').and.returnValue({});
    });

    beforeEach(function () {
      GGRC.model_attr_defs = {};
    });

    afterAll(function () {
      GGRC.model_attr_defs = origModelAttrDefs;
    });

    it('includes the modification time in the result', function () {
      let rev1 = {
        updated_at: '2016-01-24T10:05:42',
        modified_by: 'User 1',
        content: {},
      };
      let rev2 = {
        updated_at: '2016-01-30T08:15:11',
        modified_by: 'User 1',
        content: {},
      };

      let result = viewModel._objectChangeDiff(rev1, rev2);

      expect(result.updatedAt).toEqual('2016-01-30T08:15:11');
    });

    it('includes the author of the change(s) in the result', function () {
      let rev1 = {
        updated_at: '2016-01-24T10:05:42',
        modified_by: 'User 6',
        content: {},
      };
      let rev2 = {
        updated_at: '2016-01-30T08:15:11',
        modified_by: 'User 7',
        content: {},
      };

      let result = viewModel._objectChangeDiff(rev1, rev2);

      expect(result.madeBy).toEqual('User 7');
    });

    it('includes the author\'s role of the change(s) in the result',
      function () {
        let rev1 = {
          updated_at: '2016-01-24T10:05:42',
          modified_by: 'User 6',
          content: {},
        };
        let rev2 = {
          updated_at: '2016-01-30T08:15:11',
          modified_by: 'User 7',
          content: {},
        };

        let result = viewModel._objectChangeDiff(rev1, rev2);
        expect(result.role).toEqual('none');
      });

    it('dooes not include author\'s details ' +
      'when person is not presented', function () {
      let rev1 = {
        updated_at: '2016-01-24T10:05:42',
        modified_by: 'User 6',
        content: {},
      };
      let rev2 = {
        updated_at: '2016-01-30T08:15:11',
        modified_by: null,
        content: {},
      };

      let result = viewModel._objectChangeDiff(rev1, rev2);
      expect(result.madeBy).toBeNull();
      expect(result.role).toEqual('none');
    });

    describe('with model attributes definitions defined', function () {
      it('uses the fields\' display names in the result', function () {
        let expectedChange = {
          fieldName: 'Object Name',
          origVal: 'Audit 1.0',
          newVal: 'My Audit 1.0',
        };

        let rev1 = {
          updated_at: '2016-01-25T16:36:29',
          modified_by: {
            reify: function () {
              return 'User 5';
            },
          },
          resource_type: 'Audit',
          content: {
            title: 'Audit 1.0',
          },
        };
        let rev2 = {
          updated_at: '2016-01-30T13:22:59',
          modified_by: {
            reify: function () {
              return 'User 5';
            },
          },
          resource_type: 'Audit',
          content: {
            title: 'My Audit 1.0',
          },
        };
        let result;

        GGRC.model_attr_defs = {
          Audit: [
            {attr_name: 'title', display_name: 'Object Name'},
            {attr_name: 'fake_list', display_name: 'Fake List'},
          ],
        };
        result = viewModel._objectChangeDiff(rev1, rev2);

        expect(result.changes[0]).toEqual(expectedChange);
      });

      it('compacts the list fields in the diff',
        function () {
          let rev1 = {
            updated_at: '2016-01-25T16:36:29',
            modified_by: {
              reify: function () {
                return 'User 5';
              },
            },
            resource_type: 'Audit',
            content: {
              recipients: 'foo,,bar,',
            },
          };
          let rev2 = {
            updated_at: '2016-01-30T13:22:59',
            modified_by: {
              reify: function () {
                return 'User 5';
              },
            },
            resource_type: 'Audit',
            content: {
              recipients: ',,bar,baz',
            },
          };
          let result;
          GGRC.model_attr_defs = {
            Audit: [
              {attr_name: 'title', display_name: 'Object Name'},
              {attr_name: 'recipients', display_name: 'Recipients'},
            ],
          };
          result = viewModel._objectChangeDiff(rev1, rev2);

          expect(result.changes[0]).toEqual({
            fieldName: 'Recipients',
            origVal: 'bar, foo',
            newVal: 'bar, baz',
          });
        }
      );
    });
  });

  describe('_objectCADiff() method', function () {
    it('detects set attributes', function () {
      let oldValues = [];
      let oldDefs = [];
      let newValues = [{
        custom_attribute_id: 1,
        attribute_value: 'custom value',
      }];
      let newDefs = [{
        id: 1,
        title: 'CA',
        attribute_type: 'text',
      }];
      let result = viewModel
        ._objectCADiff(oldValues, oldDefs, newValues, newDefs);
      expect(result).toEqual([{
        fieldName: 'CA',
        origVal: '—',
        newVal: 'custom value',
      }]);
    });

    it('detects unset attributes', function () {
      let oldValues = [{
        custom_attribute_id: 1,
        attribute_value: 'custom value',
      }];
      let oldDefs = [{
        id: 1,
        title: 'CA',
        attribute_type: 'text',
      }];
      let newValues = [];
      let newDefs = [];
      let result = viewModel
        ._objectCADiff(oldValues, oldDefs, newValues, newDefs);
      expect(result).toEqual([{
        fieldName: 'CA',
        origVal: 'custom value',
        newVal: '—',
      }]);
    });

    it('detects multiple changed attributes', function () {
      let oldValues = [{
        custom_attribute_id: 1,
        attribute_value: 'v1',
      }, {
        custom_attribute_id: 2,
        attribute_value: 'v2',
      }, {
        custom_attribute_id: 3,
        attribute_value: 'v3',
      }];

      let oldDefs = [{
        id: 1,
        title: 'CA1',
        attribute_type: 'text',
      }, {
        id: 2,
        title: 'CA2',
        attribute_type: 'text',
      }, {
        id: 3,
        title: 'CA3',
        attribute_type: 'text',
      }];

      let newValues = [{
        custom_attribute_id: 1,
        attribute_value: 'v3',
      }, {
        custom_attribute_id: 2,
        attribute_value: 'v4',
      }, {
        custom_attribute_id: 3,
        attribute_value: 'v3',
      }];

      let result = viewModel
        ._objectCADiff(oldValues, oldDefs, newValues, oldDefs);
      expect(result).toEqual([{
        fieldName: 'CA1',
        origVal: 'v1',
        newVal: 'v3',
      }, {
        fieldName: 'CA2',
        origVal: 'v2',
        newVal: 'v4',
      }]);
    });

    it('should not return diffs if definitions are empty', () => {
      const defs = [];
      const oldValues = [{
        custom_attribute_id: 1,
        attribute_value: 'v1',
      }];

      const newValues = [{
        custom_attribute_id: 1,
        attribute_value: 'v3',
      }];

      const result = viewModel
        ._objectCADiff(oldValues, defs, newValues, defs);
      expect(result.length).toBe(0);
    });
  });

  describe('_computeMappingChanges() method', function () {
    beforeEach(function () {
      spyOn(viewModel, '_mappingChange');
    });

    it('creates a list of mapping changes from a Revision list', function () {
      let result;
      let revisions = new canList([
        {id: 10, madeBy: 'John'},
        {id: 20, madeBy: 'Doe'},
      ]);

      viewModel._mappingChange.and.callFake(function (revision) {
        return new canMap({madeBy: revision.madeBy});
      });

      result = viewModel._computeMappingChanges(revisions);

      // we call attr() to get a plain object needed for the comparison
      expect(result[0].attr()).toEqual({madeBy: 'John'});
      expect(result[1].attr()).toEqual({madeBy: 'Doe'});
      expect(viewModel._mappingChange.calls.count()).toEqual(2);
    });
  });

  describe('_mappingChange() method', function () {
    beforeEach(function () {
      viewModel.attr('instance', {
        id: 123,
        type: 'ObjectFoo',
      });
    });

    it('returns correct change information when the instance is at the ' +
      '"source" end of the mapping',
    function () {
      let revision = {
        modified_by: 'User 17',
        updated_at: new Date('2015-05-17T17:24:01'),
        action: 'created',
        destination: {
          display_type: function () {
            return 'Other';
          },
          display_name: function () {
            return 'OtherObject';
          },
        },
        source_id: 99,
        source_type: 'OtherObject',
        content: {},
      };

      let result = viewModel._mappingChange(revision, [revision]);

      expect(result).toEqual({
        madeBy: 'User 17',
        role: 'none',
        updatedAt: new Date('2015-05-17T17:24:01'),
        changes: {
          origVal: '—',
          newVal: 'Created',
          fieldName: 'Mapping to Other: OtherObject',
        },
      });
    }
    );

    it('returns correct change information when the instance is at the ' +
      '"destination" end of the mapping',
    function () {
      let revision = {
        modified_by: 'User 17',
        updated_at: new Date('2015-05-17T17:24:01'),
        action: 'deleted',
        source: {
          display_type: function () {
            return 'Other';
          },
          display_name: function () {
            return 'OtherObject';
          },
        },
        destination_id: 123,
        destination_type: 'ObjectFoo',
        content: {},
      };

      let result = viewModel._mappingChange(revision, [revision]);

      expect(result).toEqual({
        madeBy: 'User 17',
        role: 'none',
        updatedAt: new Date('2015-05-17T17:24:01'),
        changes: {
          origVal: 'Created',
          newVal: 'Deleted',
          fieldName: 'Mapping to Other: OtherObject',
        },
      });
    }
    );

    it('returns correct change information ' +
      'when author of the change(s) is not presented', function () {
      let revision = {
        modified_by: null,
        updated_at: new Date('2015-05-17T17:24:01'),
        source: {
          display_type: function () {
            return 'Other';
          },
          display_name: function () {
            return 'OtherObject';
          },
        },
        destination_id: 123,
        destination_type: 'ObjectFoo',
        content: {},
      };

      let result = viewModel._mappingChange(revision, [revision]);

      expect(result).toEqual({
        madeBy: null,
        role: 'none',
        updatedAt: new Date('2015-05-17T17:24:01'),
        changes: {
          origVal: '—',
          newVal: '',
          fieldName: 'Mapping to Other: OtherObject',
        },
      });
    });

    it('returns correct change information when map with ' +
      '"snapshot" objects',
    function () {
      let snapshotRevision = {
        modified_by: 'User 17',
        updated_at: new Date('2015-05-17T17:24:01'),
        action: 'created',
        content: {
          updated_at: new Date('2018-02-14T10:46:02'),
          description: 'Description for: CustomControl',
          title: 'CustomControl',
          type: 'Control',
        },
      };

      let revision = {
        modified_by: 'User 17',
        updated_at: new Date('2015-05-17T17:24:01'),
        action: 'created',
        destination: {
          revision: snapshotRevision,
          display_type: function () {
            return snapshotRevision.content.type;
          },
          display_name: function () {
            return snapshotRevision.content.title;
          },
        },
        source_id: 99,
        source_type: 'OtherObject',
        content: {},
      };

      let result = viewModel._mappingChange(revision, [revision]);

      expect(result).toEqual({
        madeBy: 'User 17',
        role: 'none',
        updatedAt: new Date('2015-05-17T17:24:01'),
        changes: {
          origVal: '—',
          newVal: 'Created',
          fieldName: 'Mapping to Control: CustomControl',
        },
      });
    }
    );

    it('returns correct change information ' +
    'when revisions contains automapping content', function () {
      let revision = {
        updated_at: new Date('2015-05-17T17:24:01'),
        source: {
          display_type: function () {
            return 'Other';
          },
          display_name: function () {
            return 'OtherObject';
          },
        },
        destination_id: 123,
        destination_type: 'ObjectFoo',
        content: {
          automapping: {
            destination: {
              type: 'DestinationType',
              title: 'DestinationTitle',
            },
            source: {
              type: 'SourceType',
              title: 'SourceTitle',
            },
          },
        },
      };

      let result = viewModel._mappingChange(revision, [revision]);

      expect(result).toEqual({
        automapping: {
          title: '(automapping triggered after "unknown" user mapped ' +
          'DestinationType "DestinationTitle" to SourceType "SourceTitle")',
        },
        updatedAt: new Date('2015-05-17T17:24:01'),
        role: 'none',
        changes: {
          origVal: '—',
          newVal: '',
          fieldName: 'Mapping to Other: OtherObject',
        },
      });
    });
  });

  describe('"_buildPeopleEmails" method', () => {
    let viewModel;

    beforeEach(() => {
      viewModel = getComponentVM(Component);
    });

    it('should return array with users emails', () => {
      const userEmail = 'user@example.com';
      let result;

      spyOn(Person, 'findInCacheById')
        .and.returnValue({email: userEmail});

      result = viewModel._buildPeopleEmails([{id: 1}, {id: 2}]);
      expect(result.length).toBe(2);
      expect(result[0]).toEqual(userEmail);
      expect(result[1]).toEqual(userEmail);
    });

    it('should return array with empty "diff" value. empty array', () => {
      let emptyDiffValue = '—';
      let result = viewModel._buildPeopleEmails([]);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(emptyDiffValue);
    });
  });

  describe('"_getPeopleForRole" method', () => {
    let viewModel;

    beforeEach(() => {
      viewModel = getComponentVM(Component);
    });

    it('should return empty list. ACL is undefined', () => {
      let revisionContent = {};
      let role = {id: 1};

      let result = viewModel._getPeopleForRole(role, revisionContent);
      expect(result.length).toBe(0);
    });

    it('should return empty list', () => {
      let revisionContent = {
        access_control_list: [
          {ac_role_id: 5, person: {id: 1}},
          {ac_role_id: 3, person: {id: 55}},
        ],
      };
      let role = {id: 1};
      let result = viewModel._getPeopleForRole(role, revisionContent);

      expect(result.length).toBe(0);
    });

    it('should return 2 persons', () => {
      let revisionContent = {
        access_control_list: [
          {ac_role_id: 5, person: {id: 1}},
          {ac_role_id: 3, person: {id: 55}},
          {ac_role_id: 5, person: {id: 55}},
        ],
      };
      let role = {id: 5};
      let result = viewModel._getPeopleForRole(role, revisionContent);

      expect(result.length).toBe(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(55);
    });
  });
});
