/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canModel from 'can-model';
import Stub from '../stub';

describe('Stub model', () => {
  let TestModel;
  beforeAll(() => {
    TestModel = canModel.extend({model_singular: 'testModel'}, {});
  });

  it('Creates correct stub for single model', () => {
    let model = new TestModel({
      prop1: 'val1',
      id: '123',
      prop2: 'val2',
      href: 'href',
    });

    let stub = new Stub(model);

    expect(stub.serialize()).toEqual({
      type: 'testModel',
      id: '123',
      href: 'href',
    });
  });

  it('Creates correct stub for single object', () => {
    let obj = {
      type: 'test',
      prop1: 'val1',
      id: '123',
      prop2: 'val2',
      selfLink: 'selfLink',
    };

    let stub = new Stub(obj);

    expect(stub.serialize()).toEqual({
      type: 'test',
      id: '123',
      href: 'selfLink',
    });
  });

  it('Creates instance of Stub', () => {
    let obj = {
      id: '123',
      type: 'test',
    };

    let stub = new Stub(obj);

    expect(stub instanceof Stub).toBe(true);
  });

  describe('List model', () => {
    it('Creates correct stub for list of models', () => {
      let models = [
        new TestModel({
          prop1: 'val1',
          id: '123',
          prop2: 'val2',
          href: 'href',
        }),
        new TestModel({
          prop1: 'val1-2',
          id: '123-2',
          prop2: 'val2',
          href: 'href-2',
        }),
      ];

      let stub = new Stub.List(models);

      expect(stub.serialize()).toEqual([{
        type: 'testModel',
        id: '123',
        href: 'href',
      }, {
        type: 'testModel',
        id: '123-2',
        href: 'href-2',
      }]);
    });

    it('Creates correct stub for list of objects', () => {
      let objs = [{
        type: 'test',
        prop1: 'val1',
        id: '123',
        prop2: 'val2',
        selfLink: 'selfLink',
      }, {
        type: 'test',
        prop1: 'val1-2',
        id: '123-2',
        prop2: 'val2-2',
        selfLink: 'selfLink-2',
      }];

      let stub = new Stub.List(objs);

      expect(stub.serialize()).toEqual([{
        type: 'test',
        id: '123',
        href: 'selfLink',
      }, {
        type: 'test',
        id: '123-2',
        href: 'selfLink-2',
      }]);
    });

    it('Creates instance of Stub.List', () => {
      let objs = [];

      let stub = new Stub.List(objs);

      expect(stub instanceof Stub.List).toBe(true);
    });
  });
});
