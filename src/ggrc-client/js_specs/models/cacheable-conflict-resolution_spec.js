/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as AjaxExtensions from '../../js/plugins/ajax-extensions';
import Cacheable from '../../js/models/cacheable';
import * as resolveConflict from '../../js/models/conflict-resolution/conflict-resolution';

import {
  failAll,
  makeFakeModel,
} from '../spec-helpers';

describe('Cacheable conflict resolution', function () {
  let DummyModel;
  let ajaxSpy;

  beforeAll(() => {
    ajaxSpy = spyOn(AjaxExtensions, 'ggrcAjax');
    DummyModel = makeFakeModel({
      model: Cacheable,
      staticProps: {
        ajax: AjaxExtensions.ggrcAjax,
        update: 'PUT /api/dummy_models/{id}',
        table_singular: 'dummy_model',
      },
    });
  });

  const _resovleDfd = (obj, reject) => (
    new $.Deferred(function (dfd) {
      setTimeout(function () {
        if (!reject) {
          dfd.resolve(obj);
        } else {
          dfd.reject(obj, 409, 'CONFLICT');
        }
      }, 10);
    })
  );

  it('does not refresh model', (done) => {
    let obj = new DummyModel({id: 1});
    spyOn(obj, 'refresh').and.returnValue($.when(obj));
    ajaxSpy.and.callFake(() => _resovleDfd({status: 409}, true));
    DummyModel.update(obj.id, obj.serialize()).then(() => {
      expect(obj.refresh).not.toHaveBeenCalled();
      done();
    }, failAll(done));
  });

  it('cannot resolve conflicts', (done) => {
    let obj = new DummyModel({id: 1});
    spyOn(resolveConflict, 'default').and
      .callFake((xhr) => $.Deferred().reject(xhr));
    const xhr = {
      status: 409,
      responseJSON: {
        dummy_model: {
          id: 2,
        },
      },
    };
    ajaxSpy.and.callFake(() => _resovleDfd(xhr, true));
    DummyModel.update(obj.id, obj.serialize()).then(failAll(done),
      (_xhr) => {
        expect(_xhr).toEqual(xhr);
        done();
      });
  });


  it('merges changed properties and saves', (done) => {
    let obj = new DummyModel({id: 1});
    obj.attr('foo', 'bar');
    obj.attr('baz', 'bazz');
    obj.backup();
    expect(obj._backupStore()).toEqual(
      jasmine.objectContaining({id: obj.id, foo: 'bar', baz: 'bazz'}));

    // current user changes "foo" attr
    obj.attr('foo', 'plonk');
    spyOn(obj, 'save').and.returnValue($.when(obj));

    ajaxSpy.and.callFake(() => {
      return _resovleDfd(
        {
          status: 409,
          responseJSON: {
            dummy_model: {
              // updated "baz" by other user
              baz: 'quux',

              // previous value of "foo"
              foo: 'bar',
              id: obj.id,
            },
          },
        }, true);
    });

    DummyModel.update(obj.id, obj.serialize()).then(() => {
      expect(obj).toEqual(jasmine.objectContaining(
        {id: obj.id, foo: 'plonk', baz: 'quux'}));
      expect(obj.save).toHaveBeenCalled();
      setTimeout(() => {
        done();
      }, 10);
    }, failAll(done));
  });


  it('lets other error statuses pass through', (done) => {
    let obj = new DummyModel({id: 1});
    let xhr = {status: 400};
    spyOn(obj, 'refresh').and.returnValue($.when(obj.serialize()));
    ajaxSpy.and.returnValue(
      new $.Deferred().reject(xhr, 400, 'BAD REQUEST'));
    DummyModel.update(1, obj.serialize()).then((_xhr) => {
      expect(_xhr).toBe(xhr);
      done();
    });
  });
});
