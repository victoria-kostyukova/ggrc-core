/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from './assessment-templates-dropdown';
import * as QueryAPI from '../../../plugins/utils/query-api-utils';

describe('assessment-templates-dropdown component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('selectInitialTemplate() method', function () {
    beforeEach(() => {
      viewModel.attr('optionsList', [
        {
          title: 'No Template',
          value: '',
        },
        {
          group: 'FooBarBaz objects',
          subitems: [
            {title: 'object Foo', value: 'foo'},
            {title: 'object Bar', value: 'bar'},
            {title: 'object Baz', value: 'baz'},
          ],
        },
        {
          group: 'Animal objects',
          subitems: [
            {title: 'Elephant Dumbo', value: 'elephant'},
            {title: 'Flying Pig', value: 'pig'},
            {title: 'Tiny Mouse', value: 'mouse'},
          ],
        },
      ]);
    });

    it('selects the first item from the first option group if it was empty',
      () => {
        viewModel.attr('assessmentTemplate', null);
        viewModel.selectInitialTemplate();
        expect(viewModel.attr('assessmentTemplate')).toEqual('foo');
      });

    it('leaves item if the option was not empty', () => {
      viewModel.attr('assessmentTemplate', 'template-123');
      viewModel.selectInitialTemplate();
      expect(viewModel.attr('assessmentTemplate')).toEqual('template-123');
    });

    it(`leaves the current template unchanged if only a dummy value in
      the templates list`,
    () => {
      viewModel.attr('assessmentTemplate', 'template-123');
      viewModel.attr('optionsList').splice(1); // keep only the 1st (dummy) option

      viewModel.selectInitialTemplate();

      expect(viewModel.attr('assessmentTemplate')).toEqual('template-123');
    });

    it('leaves the current template unchanged if first object group empty',
      () => {
        viewModel.attr('assessmentTemplate', 'template-123');
        viewModel.attr('optionsList')[1].subitems.length = 0;
        spyOn(console, 'warn'); // just to silence it

        viewModel.selectInitialTemplate();

        expect(viewModel.attr('assessmentTemplate')).toEqual('template-123');
      }
    );

    it('issues a warning if an empty group is encountered', () => {
      const expectedMsg = [
        'canComponent.assessmentTemplates: ',
        'An empty template group encountered, possible API error',
      ].join('');

      spyOn(console, 'warn');
      viewModel.attr('optionsList')[1].subitems.length = 0;

      viewModel.selectInitialTemplate();

      expect(console.warn).toHaveBeenCalledWith(expectedMsg);
    });

    it('selects the first non-dummy value if it precedes all object groups',
      () => {
        viewModel.attr('assessmentTemplate', null);
        viewModel.attr('optionsList').splice(1, 0, {
          title: 'No Group Template', value: 'single'});

        viewModel.selectInitialTemplate();

        expect(viewModel.attr('assessmentTemplate')).toEqual('single');
      }
    );
  });

  describe('init() method', () => {
    const reqParam = {};
    let batchRequestsDfd;
    let method;

    beforeAll(() => {
      method = Component.prototype.init.bind({
        viewModel,
      });
    });

    beforeEach(() => {
      batchRequestsDfd = $.Deferred();
      viewModel.attr('instance', {
        id: 1,
        type: 'AssessmentTemplate',
      });

      spyOn(QueryAPI, 'buildParam')
        .and.returnValue(reqParam);
      spyOn(QueryAPI, 'batchRequests')
        .and.returnValue(batchRequestsDfd);
    });

    it('makse relevant call', () => {
      method();

      expect(QueryAPI.buildParam)
        .toHaveBeenCalled();
      expect(QueryAPI.batchRequests)
        .toHaveBeenCalledWith(reqParam);
    });

    it('sets initial Assessment Template when needToSelectInitialTemplate ' +
    'is true', (done) => {
      spyOn(viewModel, 'dispatch');
      spyOn(viewModel, 'selectInitialTemplate');
      viewModel.attr('needToSelectInitialTemplate', true);

      method();

      batchRequestsDfd.resolve({
        AssessmentTemplate: {
          values: [],
        },
      }).then(() => {
        expect(viewModel.selectInitialTemplate)
          .toHaveBeenCalled();
        done();
      });
    });

    it('dispatches "assessmentTemplateLoaded" event', (done) => {
      spyOn(viewModel, 'dispatch');

      method();

      batchRequestsDfd.resolve({
        AssessmentTemplate: {
          values: [],
        },
      }).then(() => {
        expect(viewModel.dispatch)
          .toHaveBeenCalledWith('assessmentTemplateLoaded');

        done();
      });
    });
  });
});
