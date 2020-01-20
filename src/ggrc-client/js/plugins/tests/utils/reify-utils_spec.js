/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canModel from 'can-model';
import canList from 'can-list';
import canMap from 'can-map';
import * as ReifyUtils from '../../utils/reify-utils';
import Audit from '../../../models/business-models/audit';
import {makeFakeInstance} from '../../../../js_specs/spec-helpers';

describe('reify-utils', () => {
  describe('reify() method', () => {
    it('should return passed obj when it is canModel', () => {
      const obj = new canModel({});
      const model = ReifyUtils.reify(obj);

      expect(model).toBe(obj);
    });

    it(`should return canList with instances of required model
      when passed object is canList`, () => {
      const objs = new canList([]);
      const audits = new canList([]);

      for (let i = 0; i < 3; i++) {
        objs.push(new canMap({type: 'Audit', id: i}));
        audits.push(makeFakeInstance({model: Audit})(
          {id: i, data: `Test data ${i}`})
        );
      }

      spyOn(Audit, 'model').and.returnValues(...Array.from(audits));

      const result = ReifyUtils.reify(objs);

      expect(result.serialize()).toEqual(audits.serialize());
    });

    it(`should return canModel's instance
      when passed object is canMap`, () => {
      const obj = new canMap({type: 'Audit', id: 1});
      const audit = makeFakeInstance({model: Audit})(
        {id: 1, data: 'Test data'}
      );

      spyOn(Audit, 'model').and.returnValue(audit);

      const result = ReifyUtils.reify(obj);

      expect(result.serialize()).toEqual(audit.serialize());
    });
  });

  describe('isReifiable() method', () => {
    it('should return true when obj is the instance of canMap', () => {
      const obj = new canModel({});
      const result = ReifyUtils.isReifiable(obj);

      expect(result).toBe(true);
    });
  });

  describe('reifyMap() method', () => {
    it('should call console.warn when model is unrecognized type', () => {
      const obj = new canMap({type: 'Object'});
      spyOn(console, 'warn');

      ReifyUtils.reifyMap(obj);

      expect(console.warn).toHaveBeenCalled();
    });

    it('should return instance canModel when model is recognized type', () => {
      const obj = new canMap({type: 'Audit', id: 1});
      const audit = makeFakeInstance({model: Audit})(
        {id: 1, data: 'Test data'}
      );

      spyOn(Audit, 'model').and.returnValue(audit);

      const result = ReifyUtils.reifyMap(obj);

      expect(result.serialize()).toEqual((audit.serialize()));
    });
  });

  describe('reifyList() method', () => {
    it('should return instance canList with models', () => {
      const objs = new canList([]);
      const audits = new canList([]);

      for (let i = 0; i < 3; i++) {
        objs.push(new canMap({type: 'Audit', id: i}));
        audits.push(makeFakeInstance({model: Audit})(
          {id: i, data: `Test data ${i}`}
        ));
      }

      spyOn(Audit, 'model').and.returnValues(...Array.from(audits));

      const result = ReifyUtils.reifyList(objs);

      expect(result.serialize()).toEqual(audits.serialize());
    });
  });
});
