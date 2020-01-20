/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Cycle from '../cycle';
import {makeFakeInstance} from '../../../../js_specs/spec-helpers';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import {REFRESH_MAPPING} from '../../../events/event-types';

describe('Cycle model', () => {
  let fakeCycleModel;
  let pageInstance;
  let expectedEvent;

  beforeEach(() => {
    fakeCycleModel = makeFakeInstance({model: Cycle}, {status: 'Assigned'})();

    pageInstance = {type: 'Workflow', dispatch: jasmine.createSpy('dispatch')};

    expectedEvent = {
      type: `${REFRESH_MAPPING.type}`,
      destinationType: fakeCycleModel.type,
    };

    spyOn(CurrentPageUtils, 'getPageInstance')
      .and.returnValue(pageInstance);
  });

  it('dispatches REFRESH_MAPPING event ' +
    'if the Cycle status has changed to "Deprecated"', () => {
    fakeCycleModel.attr('status', 'Deprecated');
    expect(pageInstance.dispatch).toHaveBeenCalledWith(expectedEvent);
  });

  it('dispatches REFRESH_MAPPING event each time ' +
    'if the Cycle status has changed to or from "Deprecated"', () => {
    fakeCycleModel.attr('status', 'Deprecated');
    fakeCycleModel.attr('status', 'Assigned');
    expect(pageInstance.dispatch.calls.allArgs()).toEqual([
      [expectedEvent],
      [expectedEvent],
    ]);
  });
});
