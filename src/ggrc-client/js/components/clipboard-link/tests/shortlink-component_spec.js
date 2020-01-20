/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../shortlink-component';


describe('shortlink component', () => {
  let viewModel;
  let shortLinkPrefix = 'short/link';
  let asmtConfigBackup;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  beforeAll(() => {
    asmtConfigBackup = GGRC.config.ASSESSMENT_SHORT_URL_PREFIX;
  });

  afterAll(() => {
    GGRC.config.ASSESSMENT_SHORT_URL_PREFIX = asmtConfigBackup;
  });

  it('set "text" value to empty string if "instance.id"' +
     ' is not defined', () => {
    viewModel.attr('instance', {
      type: 'Assessment',
    });

    expect(viewModel.attr('text')).toBe('');
  });

  it('set "text" value to empty string if "ASSESSMENT_SHORT_URL_PREFIX"' +
     ' is not defined', () => {
    GGRC.config.ASSESSMENT_SHORT_URL_PREFIX = '';
    viewModel.attr('instance', {
      type: 'Assessment',
      id: 3,
    });

    expect(viewModel.attr('text')).toBe('');
  });

  it('set "text" value ASSESSMENT_SHORT_URL_PREFIX + instance.id', () => {
    GGRC.config.ASSESSMENT_SHORT_URL_PREFIX = shortLinkPrefix;
    viewModel.attr('instance', {
      type: 'Assessment',
      id: 3,
    });

    expect(viewModel.attr('text')).toBe(`${shortLinkPrefix}/3`);
  });
});
