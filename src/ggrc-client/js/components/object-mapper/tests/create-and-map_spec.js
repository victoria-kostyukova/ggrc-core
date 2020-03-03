/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../create-and-map';
import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../js_specs/spec-helpers';
import SnapshotableModel from '../../../models/business-models/control';
import NotSnapshotableModel from '../../../models/business-models/issue';
import AuditScopeModel from '../../../models/business-models/assessment';
import Audit from '../../../models/business-models/audit';
import * as Permission from '../../../permission';

describe('create-and-map component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('allowedToCreate get prop', () => {
    it('returns false if user does not have permissions to create object',
      () => {
        spyOn(Permission, 'isAllowedAny').and.returnValue(false);

        viewModel.source =
          makeFakeInstance({model: NotSnapshotableModel})();
        viewModel.destinationModel = SnapshotableModel;

        let result = viewModel.allowedToCreate;
        expect(result).toBeFalsy();
      });

    it('returns false if source is an audit-scope model and ' +
      'destination is snapshotable', () => {
      spyOn(Permission, 'isAllowedAny').and.returnValue(true);

      viewModel.sourceType = AuditScopeModel.model_singular;
      viewModel.source = makeFakeInstance({model: AuditScopeModel})();
      viewModel.destinationModel = SnapshotableModel;

      let result = viewModel.allowedToCreate;
      expect(result).toBeFalsy();
    });

    it('returns true if source is an audit-scope model and ' +
      'destination is not snapshotable', () => {
      spyOn(Permission, 'isAllowedAny').and.returnValue(true);

      viewModel.source = makeFakeInstance({model: AuditScopeModel})();
      viewModel.destinationModel = NotSnapshotableModel;

      let result = viewModel.allowedToCreate;
      expect(result).toBeTruthy();
    });

    it('returns false when source is Audit and destination is snapshotable',
      () => {
        spyOn(Permission, 'isAllowedAny').and.returnValue(true);

        viewModel.sourceType = 'Audit';
        viewModel.source = makeFakeInstance({model: Audit})();
        viewModel.destinationModel = SnapshotableModel;

        let result = viewModel.allowedToCreate;
        expect(result).toBeFalsy();
      });

    it('returns true when source is Audit and destination is not snapshotable',
      () => {
        spyOn(Permission, 'isAllowedAny').and.returnValue(true);

        viewModel.source = makeFakeInstance({model: Audit})();
        viewModel.destinationModel = NotSnapshotableModel;

        let result = viewModel.allowedToCreate;
        expect(result).toBeTruthy();
      });

    it('returns false when source is snapshotable and destination is Audit',
      () => {
        spyOn(Permission, 'isAllowedAny').and.returnValue(true);

        viewModel.sourceType = SnapshotableModel.model_singular;
        viewModel.source =
          makeFakeInstance({model: SnapshotableModel})();
        viewModel.destinationModel = Audit;

        let result = viewModel.allowedToCreate;
        expect(result).toBeFalsy();
      });

    it('returns true when source is not snapshotable and destination is Audit',
      () => {
        spyOn(Permission, 'isAllowedAny').and.returnValue(true);

        viewModel.source =
          makeFakeInstance({model: NotSnapshotableModel})();
        viewModel.destinationModel = Audit;

        let result = viewModel.allowedToCreate;
        expect(result).toBeTruthy();
      });

    it('returns true if source and destination are ' +
      'neither Audit nor audit-scope model', () => {
      spyOn(Permission, 'isAllowedAny').and.returnValue(true);

      viewModel.source =
        makeFakeInstance({model: NotSnapshotableModel})();
      viewModel.destinationModel = SnapshotableModel;

      let result = viewModel.allowedToCreate;
      expect(result).toBeTruthy();
    });
  });

  describe('"{window} modal:dismiss" event', () => {
    let handler;

    beforeEach(() => {
      viewModel.source = {id: 123};
      viewModel.newEntries = [1];

      spyOn(viewModel, 'mapObjects');
      spyOn(viewModel, 'cancel');

      handler = Component.prototype.events['{window} modal:dismiss']
        .bind({viewModel});
    });

    it('calls mapObjects if there are newEntries and ids are equal', () => {
      let options = {
        uniqueId: 123,
      };
      handler({}, {}, options);
      expect(viewModel.mapObjects).toHaveBeenCalled();
      expect(viewModel.cancel).not.toHaveBeenCalled();
    });

    it('does not call mapObjects if there are newEntries and ids are not equal',
      () => {
        let options = {
          uniqueId: 321,
        };
        handler({}, {}, options);
        expect(viewModel.mapObjects).not.toHaveBeenCalled();
        expect(viewModel.cancel).toHaveBeenCalled();
      });

    it('does not calls mapObjects if there are no newEntries', () => {
      viewModel.newEntries = [];
      let options = {
        uniqueId: 123,
      };
      handler({}, {}, options);
      expect(viewModel.mapObjects).not.toHaveBeenCalled();
      expect(viewModel.cancel).toHaveBeenCalled();
    });
  });

  describe('megaRelation getter', () => {
    it('should return the last set value', () => {
      const lastValue = 'parent';
      viewModel.megaRelation = lastValue;
      expect(viewModel.megaRelation).toBe(lastValue);
    });

    it('should return "child" if the value was not set before', () => {
      expect(viewModel.megaRelation).toBe('child');
    });
  });
});
