/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loEvery from 'lodash/every';
import loIsEqual from 'lodash/isEqual';
import {warning} from './modals';
import {hasQuestions} from './ggrcq-utils';

/**
 * Utils methods shared between GGRC controllers
 */

function checkPreconditions(options, success) {
  let instance = options.instance;
  let operation = options.operation;
  let conditions = options.extraConditions || [];

  if (!hasWarningType(instance)) {
    success();
    return;
  }

  if (!_checkExtraConditions(conditions)) {
    success();
    return;
  }

  warning({
    objectShortInfo: [instance.type, instance.title].join(' '),
    operation: operation,
  }, success);
}

function becameDeprecated(instance, prevStatus) {
  let status = instance && instance.status;

  return (
    !loIsEqual(status, prevStatus) && // status was changed
    loIsEqual(status, 'Deprecated')
  );
}

function hasWarningType(instance) {
  return (
    instance &&
    hasQuestions(instance)
  );
}

function _checkExtraConditions(conditions) {
  return loEvery(conditions, function (condition) {
    return condition();
  });
}

function shouldApplyPreconditions(instance) {
  return hasWarningType(instance);
}

export {
  checkPreconditions,
  hasWarningType,
  becameDeprecated,
  shouldApplyPreconditions,
};
