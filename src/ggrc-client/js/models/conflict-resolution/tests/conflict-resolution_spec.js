/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import {tryResolveConflictValues} from '../conflict-resolution';
import * as conflictResolvers from '../conflict-resolvers';

describe('cacheable conflict resolution', () => {
  describe('tryResolveConflictValues method', () => {
    beforeEach(() => {
      spyOn(conflictResolvers, 'simpleFieldResolver');
      spyOn(conflictResolvers, 'customAttributeResolver');
    });

    it('skips "updated_at" field', () => {
      let baseAttrs = {
        updated_at: 'test',
      };

      let hasConflict = tryResolveConflictValues(baseAttrs);

      expect(hasConflict).toBe(false);
      expect(conflictResolvers.simpleFieldResolver).not.toHaveBeenCalled();
      expect(conflictResolvers.customAttributeResolver).not.toHaveBeenCalled();
    });

    it('uses customAttributeResolver for custom attributes', () => {
      let baseAttrs = {
        custom_attribute_values: 'test',
      };

      let hasConflict =
        tryResolveConflictValues(baseAttrs, [], [], new canList());

      expect(hasConflict).toBeFalsy();
      expect(conflictResolvers.simpleFieldResolver).not.toHaveBeenCalled();
      expect(conflictResolvers.customAttributeResolver).toHaveBeenCalled();
    });

    it('uses simpleFieldResolver for other fields', () => {
      let baseAttrs = {
        test: 'test',
      };

      let hasConflict =
        tryResolveConflictValues(baseAttrs, [], [], new canList());

      expect(hasConflict).toBeFalsy();
      expect(conflictResolvers.simpleFieldResolver).toHaveBeenCalled();
      expect(conflictResolvers.customAttributeResolver).not.toHaveBeenCalled();
    });

    it('returns true if there was conflict', () => {
      let baseAttrs = {
        test: 'test',
      };
      conflictResolvers.simpleFieldResolver.and.returnValue(true);

      let hasConflict =
        tryResolveConflictValues(baseAttrs, [], [], new canList());

      expect(hasConflict).toBe(true);
    });
  });
});
