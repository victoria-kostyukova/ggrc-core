/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loIsFunction from 'lodash/isFunction';
import canMap from 'can-map';
// This is primarily useful for passing as the fail case for
//  promises, since every item passed to it will show up in
//  the jasmine output.
function failAll(done) {
  return function (...args) {
    args.forEach(function (arg) {
      fail(JSON.stringify(arg));
    });
    if (done) {
      done();
    }
  };
}

function getComponentVM(Component) {
  const viewModelConfig = Component.prototype.viewModel;

  if (loIsFunction(viewModelConfig)) {
    return new viewModelConfig();
  }
  return new (canMap.extend(viewModelConfig));
}

function makeFakeModel({model, staticProps = {}, instanceProps = {}} = {}) {
  const attrsForBaseModel = model.attributes;
  const staticPresetup = {
    // "attributes" isn't inherited from base model.
    // We should explicitly set the same "attributes" for derived models from
    // base model.
    attributes: {...attrsForBaseModel},
    ...staticProps,
  };

  return model.extend(staticPresetup, instanceProps);
}

function makeFakeInstance({
  model,
  staticProps = {},
  instanceProps = {},
} = {}) {
  const fakeModel = makeFakeModel({model, staticProps, instanceProps});
  return (...instanceArgs) => new fakeModel(...instanceArgs);
}

/**
 * Returns spy for get/set of passed 'property' in 'viewModel'.
 * This spy will be called on getting or setting value of this property e.g.
 * viewModel.attr(property), viewModel.attr(property, someValue).
 * get/set of this 'property' should be defined in viewModel through define plugin.

 * @param {canComponent.viewModel} viewModel
 * @param {string} property
 *
 * @returns {jasmine.Spy}
 */

function spyProp(viewModel, property) {
  const spy = jasmine.createSpy(`compute of ${property}`);

  viewModel._computedAttrs[property].compute = spy;

  return spy;
}

export {
  failAll,
  getComponentVM,
  makeFakeModel,
  makeFakeInstance,
  spyProp,
};
