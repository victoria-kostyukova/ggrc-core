/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loOmit from 'lodash/omit';
import loAssign from 'lodash/assign';
import canMap from 'can-map';
import {
  ObjectMapper as Ctrl,
  ObjectSearch,
} from '../mapper/mapper';
import * as NotifiersUtils from '../../plugins/utils/notifiers-utils';
import Assessment from '../../models/business-models/assessment';

describe('ObjectMapper', function () {
  'use strict';

  describe('static openMapper method()', function () {
    let method;
    let fakeCtrlInst;
    let fakeData;
    let audit;
    let cacheBackup;

    beforeAll(function () {
      cacheBackup = Assessment.cache;
      Assessment.cache = {};
    });

    afterAll(function () {
      Assessment.cache = cacheBackup;
    });

    beforeEach(function () {
      audit = new canMap({
        id: 1,
      });

      Assessment.cache = [
        new canMap({
          audit: audit,
        }),
      ];
      fakeCtrlInst = {
        launch: jasmine.createSpy('launch'),
      };
      fakeData = {
        toggle: 'unified-mapper',
        join_object_type: 'Assessment',
        join_object_id: 0,
        join_option_type: 'Type',
      };
      method = Ctrl.openMapper.bind(fakeCtrlInst);
      spyOn(NotifiersUtils, 'notifier');
    });

    it('interrupts own work if disableMapper param is true', function () {
      method(fakeData, true);

      expect(fakeCtrlInst.launch).not.toHaveBeenCalled();
    });

    it('throws Error with message if data.join_object_type does not exist',
      function () {
        let closure = function () {
          method({});
        };

        expect(closure).toThrowError();
      });

    describe('shows mapper for snapshots', function () {
      it('calls launch method with params', function () {
        let btn = {};
        method(fakeData, false, btn);

        expect(fakeCtrlInst.launch).toHaveBeenCalledWith(
          btn,
          jasmine.objectContaining({
            general: jasmine.any(Object),
            special: jasmine.any(Array),
          })
        );
      });

      it(`extends generalConfig with "object", "type" "isNew" and "relevantTo"
      'if data has is_new`, function () {
        let args;
        method(loAssign(fakeData, {
          is_new: true,
        }), false);

        args = fakeCtrlInst.launch.calls.argsFor(0);

        expect(args[1]).toEqual(
          jasmine.objectContaining({
            general: jasmine.objectContaining({
              object: fakeData.join_object_type,
              type: fakeData.join_option_type,
              isNew: true,
              relevantTo: jasmine.any(Array),
            }),
          })
        );
        expect(args[1].general['join-object-id']).toBeNull();
      });

      it('throws Error with message if data.join_object_id does not exist',
        function () {
          let closure = function () {
            method(loOmit(fakeData, 'join_object_id'));
          };

          expect(closure).toThrowError();
        });
    });

    describe('shows mapper for common objects', function () {
      let fakeDataForCommon;

      beforeEach(function () {
        fakeDataForCommon = loAssign({}, fakeData, {
          toggle: 'unified unified-search',
        });
        spyOn(ObjectSearch, 'launch');
      });

      it('sets config without relevantTo section if data.join_object_type ' +
      'is not audit scope model', function () {
        let args;
        method(fakeDataForCommon, false, {});
        args = ObjectSearch.launch.calls.argsFor(0);

        expect(args[1]).not.toEqual(jasmine.objectContaining({
          relevantTo: jasmine.any(Array),
        }));
      });

      it('calls launch for ObjectSearch with passed btn and config if ' +
      'data.toggle contains "unified-search" string', function () {
        let btn = {};
        method(fakeDataForCommon, false, btn);

        expect(ObjectSearch.launch).toHaveBeenCalledWith(
          btn,
          jasmine.any(Object)
        );
      });

      it('calls launch for ObjectMapper with passed btn and config if ' +
      'data.toggle contains "unified-search" string', function () {
        let btn = {};
        fakeDataForCommon.toggle = '';
        method(fakeDataForCommon, false, btn);

        expect(fakeCtrlInst.launch).toHaveBeenCalledWith(
          btn,
          jasmine.any(Object)
        );
      });
    });

    describe('shows mapper for mega objects', function () {
      let fakeDataForMega;

      beforeEach(function () {
        fakeDataForMega = loAssign({}, fakeData, {
          mega_object: 'Program',
          mega_object_widget: 'Program_parent',
          toggle: 'unified unified-search',
        });
      });

      it('extends generalConfig with "isMegaObject" and "megaRelation"',
        function () {
          let args;
          let btn = {};
          method(fakeDataForMega, false, btn);

          args = fakeCtrlInst.launch.calls.argsFor(0);

          expect(args[1]).toEqual(
            jasmine.objectContaining({
              general: jasmine.objectContaining({
                isMegaObject: 'Program',
                megaRelation: 'parent',
              }),
            })
          );
        });

      it('calls launch for ObjectMapper with passed btn and config',
        function () {
          let btn = {};
          method(fakeDataForMega, false, btn);

          expect(fakeCtrlInst.launch).toHaveBeenCalledWith(
            btn,
            jasmine.any(Object)
          );
        });
    });
  });
});
