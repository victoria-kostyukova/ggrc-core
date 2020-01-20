/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as objectVersionsUtils from '../../utils/object-versions-utils';

describe('isObjectVersion method', () => {
  it('should return true if model name contains "_version"', () => {
    const result = objectVersionsUtils.isObjectVersion('Program_version');
    expect(result).toBeTruthy();
  });

  it('should return false if model name does not contain "_version"', () => {
    const result = objectVersionsUtils.isObjectVersion('Program');
    expect(result).toBeFalsy();
  });

  it('should return false if called without param', () => {
    const result = objectVersionsUtils.isObjectVersion();
    expect(result).toBeFalsy();
  });

  it('should return false if param type is not "string"', () => {
    const result = objectVersionsUtils.isObjectVersion([]);
    expect(result).toBeFalsy();
  });
});

describe('getObjectVersionConfig method', () => {
  it('should return {} if model name does not contain "_version"', () => {
    const result = objectVersionsUtils.getObjectVersionConfig('Program');
    expect(result).toEqual({});
  });

  it('should return object version config if model name contains "_version"',
    () => {
      const result = objectVersionsUtils
        .getObjectVersionConfig('Program_version');
      expect(result).toEqual({
        originalModelName: 'Program',
        isObjectVersion: true,
        widgetId: 'Program_version',
        widgetName: 'Programs Versions',
      });
    });
});
