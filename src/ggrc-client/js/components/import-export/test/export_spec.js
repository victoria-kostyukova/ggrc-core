/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../export';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import router from '../../../router';
import * as ModalsUtils from '../../../plugins/utils/modals';

describe('export component', () => {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('exportAllowed prop', () => {
    it('returns FALSE when some panel has invalid configuration', () => {
      viewModel.attr('panels', [
        {type: 'type1', isValidConfiguration: true},
        {type: 'type2', isValidConfiguration: false},
        {type: 'type3', isValidConfiguration: true},
      ]);

      expect(viewModel.attr('exportAllowed')).toBeFalsy();
    });

    it('returns TRUE when there is no panel with invalid configuration', () => {
      viewModel.attr('panels', [
        {type: 'type1', isValidConfiguration: true},
        {type: 'type2', isValidConfiguration: true},
      ]);

      expect(viewModel.attr('exportAllowed')).toBeTruthy();
    });
  });

  describe('getObjectsForExport() method', () => {
    describe('if object type is not Snapshots', () => {
      it('returns object with empty expression if filters are empty', () => {
        const panelModel = new can.Map({
          type: 'Program',
          attributes: new can.List(),
          localAttributes: new can.List(),
          mappings: new can.List(),
        });
        const expectedObjects = [{
          object_name: 'Program',
          fields: [],
          filters: {expression: {}},
        }];

        viewModel.panels.push(panelModel);

        expect(viewModel.getObjectsForExport()).toEqual(expectedObjects);
      });
      it('returns object with simple expression if there is one filter', () => {
        const panelModel = new can.Map({
          type: 'Program',
          attributes: new can.List(),
          localAttributes: new can.List(),
          mappings: new can.List(),
          relevant: [{
            filter: {id: 2},
            model_name: 'Program',
          }],
        });
        const expectedObjects = [{
          object_name: 'Program',
          fields: [],
          filters: {
            expression: {
              object_name: 'Program',
              op: {name: 'relevant'},
              ids: ['2'],
            },
          },
        }];

        viewModel.panels.push(panelModel);

        expect(viewModel.getObjectsForExport()).toEqual(expectedObjects);
      });
      it('returns object with OR in expression ' +
        'if the second filter has OR operator', () => {
        const panelModel = new can.Map({
          type: 'Program',
          attributes: new can.List(),
          localAttributes: new can.List(),
          mappings: new can.List(),
          relevant: [{
            filter: {id: 2},
            model_name: 'Program',
          }, {
            filter: {id: 3},
            model_name: 'Audit',
            operator: 'OR',
          }],
        });
        const expectedObjects = [{
          object_name: 'Program',
          fields: [],
          filters: {
            expression: {
              left: {
                object_name: 'Program',
                op: {name: 'relevant'},
                ids: ['2'],
              },
              op: {name: 'OR'},
              right: {
                object_name: 'Audit',
                op: {name: 'relevant'},
                ids: ['3'],
              },
            },
          },
        }];

        viewModel.panels.push(panelModel);

        expect(viewModel.getObjectsForExport()).toEqual(expectedObjects);
      });
    });

    describe('if object type is Snapshots', () => {
      it('returns child_type in expression if filters are empty', () => {
        const panelModel = new can.Map({
          type: 'Snapshot',
          snapshot_type: 'Control',
          attributes: new can.List(),
          localAttributes: new can.List(),
          mappings: new can.List(),
        });
        const expectedObjects = [{
          object_name: 'Snapshot',
          fields: [],
          filters: {
            expression: {
              left: 'child_type',
              op: {name: '='},
              right: 'Control',
            },
          },
        }];

        viewModel.panels.push(panelModel);

        expect(viewModel.getObjectsForExport()).toEqual(expectedObjects);
      });
      it('returns selected filter in expression and child_type', () => {
        const panelModel = new can.Map({
          type: 'Snapshot',
          snapshot_type: 'Contract',
          attributes: new can.List(),
          localAttributes: new can.List(),
          mappings: new can.List(),
          relevant: [{
            filter: {id: 2},
            model_name: 'Program',
          }],
        });
        const expectedObjects = [{
          object_name: 'Snapshot',
          fields: [],
          filters: {
            expression: {
              left: {
                object_name: 'Program',
                op: {name: 'relevant'},
                ids: ['2'],
              },
              op: {name: 'AND'},
              right: {
                left: 'child_type',
                op: {name: '='},
                right: 'Contract',
              },
            },
          },
        }];

        viewModel.panels.push(panelModel);

        expect(viewModel.getObjectsForExport()).toEqual(expectedObjects);
      });
    });
  });

  describe('verifyTargetJob() method', () => {
    beforeEach(() => {
      let exportsMock = [
        {
          id: 101,
          status: 'Finished',
          title: 'Finished export',
        },
      ];
      viewModel.attr('currentExports', exportsMock);
      spyOn(ModalsUtils, 'confirm');
    });

    it('does not call confirm util if export exists', () => {
      spyOn(router, 'attr').and.returnValue('101');

      viewModel.verifyTargetJob();

      expect(ModalsUtils.confirm).not.toHaveBeenCalled();
    });

    it('calls confirm util if export exists', () => {
      spyOn(router, 'attr').and.returnValue('102');
      viewModel.verifyTargetJob();

      expect(ModalsUtils.confirm).toHaveBeenCalled();
    });
  });

  describe('events', () => {
    describe('"inserted" event', () => {
      let event;
      let exportsDfd;

      beforeEach(() => {
        event = Component.prototype.events['inserted'].bind({viewModel});

        exportsDfd = can.Deferred();
        spyOn(viewModel, 'getExports').and.returnValue(exportsDfd);
      });

      it('calls verifyTargetJob()', (done) => {
        spyOn(viewModel, 'verifyTargetJob');

        event();
        exportsDfd.resolve();

        expect(viewModel.verifyTargetJob).toHaveBeenCalled();
        done();
      });
    });
  });
});
