/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  getUrl,
  getMappingUrl,
  getUnmappingUrl,
} from '../utils/ggrcq-utils';
import {makeFakeInstance} from '../../../js_specs/spec_helpers';
import Cacheable from '../../models/cacheable';
import Control from '../../models/business-models/control';
import Standard from '../../models/business-models/standard';
import TechnologyEnvironment
  from '../../models/business-models/technology-environment';

describe('GGRCQ utils', () => {
  let originalIntegrationUrl;

  beforeAll(() => {
    originalIntegrationUrl = GGRC.GGRC_Q_INTEGRATION_URL;
    GGRC.GGRC_Q_INTEGRATION_URL = originalIntegrationUrl || 'http://example.com/';
  });

  afterAll(() => {
    GGRC.GGRC_Q_INTEGRATION_URL = originalIntegrationUrl;
  });

  describe('getUrl util', () => {
    it('should return url', () => {
      const options = {
        model: 'control',
        path: 'control',
        slug: 'control-1',
        view: 'info',
        params: 'types=org_group',
      };

      let url = GGRC.GGRC_Q_INTEGRATION_URL +
        'control/control=control-1/info?types=org_group';
      expect(getUrl(options)).toBe(url);
    });

    it('should return url without view path', () => {
      const options = {
        model: 'control',
        path: 'questionnaires',
        slug: 'control-1',
        params: 'types=org_group',
      };

      let url = GGRC.GGRC_Q_INTEGRATION_URL +
        'questionnaires/control=control-1?types=org_group';
      expect(getUrl(options)).toBe(url);
    });

    it('should return url without params', () => {
      const options = {
        model: 'control',
        path: 'control',
        slug: 'control-1',
        view: 'info',
      };

      expect(getUrl(options))
        .toBe(`${GGRC.GGRC_Q_INTEGRATION_URL}control/control=control-1/info`);
    });
  });

  describe('getMappingUrl util', () => {
    it('should return empty string ' +
      'if neither source not destination is Control', () => {
      let instance = makeFakeInstance({model: Cacheable})();
      let model = Cacheable;

      let url = getMappingUrl(instance, model);
      expect(url).toBe('');
    });

    it('should return url to map directive to control', () => {
      let instance = makeFakeInstance({model: Control, instanceProps: {
        type: 'Control',
        slug: 'CONTROL-1',
      }})();
      let model = Standard;

      let result = getMappingUrl(instance, model);
      let expected = GGRC.GGRC_Q_INTEGRATION_URL +
        'control/control=control-1/directives' +
        '?mappingStatus=in_progress,not_in_scope,reviewed&types=standard';
      expect(result).toBe(expected);
    });

    it('should return url to map scope object to control', () => {
      let instance = makeFakeInstance({model: Control, instanceProps: {
        type: 'Control',
        slug: 'CONTROL-1',
      }})();

      let model = TechnologyEnvironment;

      let result = getMappingUrl(instance, model);
      let expected = GGRC.GGRC_Q_INTEGRATION_URL +
        'control/control=control-1/scope' +
        '?mappingStatus=in_progress,not_in_scope,reviewed' +
        '&types=technology_environment';
      expect(result).toBe(expected);
    });

    it('should return url to map control to directive', () => {
      let instance = makeFakeInstance({model: Standard})({
        type: 'Standard',
        slug: 'STANDARD-1',
      });
      let model = Control;
      let result = getMappingUrl(instance, model);
      let expected = GGRC.GGRC_Q_INTEGRATION_URL +
        'directives/standard=standard-1/controls' +
        '?mappingStatus=in_progress,not_in_scope,reviewed';
      expect(result).toBe(expected);
    });

    it('should return url to map control to directive', () => {
      let instance = makeFakeInstance({model: TechnologyEnvironment})({
        type: 'TechnologyEnvironment',
        slug: 'TechnologyEnvironment-1',
      });
      let model = Control;
      let result = getMappingUrl(instance, model);
      let expected = GGRC.GGRC_Q_INTEGRATION_URL +
        'questionnaires/technology_environment=technologyenvironment-1' +
        '/controls?mappingStatus=in_progress,not_in_scope,reviewed';
      expect(result).toBe(expected);
    });

    it('should return url with path only', () => {
      const options = {
        path: 'import',
      };

      expect(getUrl(options))
        .toBe(`${GGRC.GGRC_Q_INTEGRATION_URL}import`);
    });
  });

  describe('getUnmappingUrl util', () => {
    it('should return empty string ' +
      'if neither source not destination is Control', () => {
      let instance = makeFakeInstance({model: Cacheable})();
      let model = Cacheable;

      let url = getUnmappingUrl(instance, model);
      expect(url).toBe('');
    });

    it('should return url to unmap control from directive', () => {
      let instance = makeFakeInstance({model: Control, instanceProps: {
        type: 'Control',
        slug: 'CONTROL-1',
      }})();
      let model = Standard;

      let result = getUnmappingUrl(instance, model);
      let expected = GGRC.GGRC_Q_INTEGRATION_URL +
        'control/control=control-1/directives' +
        '?mappingStatus=in_progress,reviewed&types=standard';
      expect(result).toBe(expected);
    });

    it('should return url to unmap control from scope object', () => {
      let instance = makeFakeInstance({model: Control, instanceProps: {
        type: 'Control',
        slug: 'CONTROL-1',
      }})();

      let model = TechnologyEnvironment;

      let result = getUnmappingUrl(instance, model);
      let expected = GGRC.GGRC_Q_INTEGRATION_URL +
        'control/control=control-1/scope' +
        '?mappingStatus=in_progress,reviewed&types=technology_environment';
      expect(result).toBe(expected);
    });

    it('should return url to unmap directive from control', () => {
      let instance = makeFakeInstance({model: Standard})({
        type: 'Standard',
        slug: 'STANDARD-1',
      });
      let model = Control;
      let result = getUnmappingUrl(instance, model);
      let expected = GGRC.GGRC_Q_INTEGRATION_URL +
        'directives/standard=standard-1/controls' +
        '?mappingStatus=in_progress,reviewed';
      expect(result).toBe(expected);
    });

    it('should return url to unmap directive from control', () => {
      let instance = makeFakeInstance({model: TechnologyEnvironment})({
        type: 'TechnologyEnvironment',
        slug: 'TechnologyEnvironment-1',
      });
      let model = Control;
      let result = getUnmappingUrl(instance, model);
      let expected = GGRC.GGRC_Q_INTEGRATION_URL +
        'questionnaires/technology_environment=technologyenvironment-1' +
        '/controls?mappingStatus=in_progress,reviewed';
      expect(result).toBe(expected);
    });
  });
});
