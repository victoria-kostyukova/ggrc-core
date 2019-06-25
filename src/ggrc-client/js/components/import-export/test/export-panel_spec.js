/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loCloneDeep from 'lodash/cloneDeep';
import canList from 'can-list';
import Component from '../export-panel';
import {getComponentVM} from '../../../../js_specs/spec_helpers';

describe('export-panel component', function () {
  let viewModel;

  let panel = {
    attributes: new canList([
      {id: 1, isSelected: false},
    ]),
    mappings: [
      {id: 2, isSelected: false},
    ],
    localAttributes: [
      {id: 3, isSelected: false},
    ],
    changeType: jasmine.createSpy(),
  };

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('showAttributes prop', () => {
    it('sets isSelected value to panel attributes', () => {
      viewModel.attr('item', loCloneDeep(panel));

      viewModel.attr('showAttributes', true);

      expect(viewModel.attr('item.attributes.0'))
        .toEqual(jasmine.objectContaining({id: 1, isSelected: true}));
      expect(viewModel.attr('item.mappings.0'))
        .toEqual(jasmine.objectContaining({id: 2, isSelected: false}));
      expect(viewModel.attr('item.localAttributes.0'))
        .toEqual(jasmine.objectContaining({id: 3, isSelected: false}));
    });
  });

  describe('showMappings prop', () => {
    it('sets isSelected value to panel mappings', () => {
      viewModel.attr('item', loCloneDeep(panel));

      viewModel.attr('showMappings', true);

      expect(viewModel.attr('item.attributes.0'))
        .toEqual(jasmine.objectContaining({id: 1, isSelected: false}));
      expect(viewModel.attr('item.mappings.0'))
        .toEqual(jasmine.objectContaining({id: 2, isSelected: true}));
      expect(viewModel.attr('item.localAttributes.0'))
        .toEqual(jasmine.objectContaining({id: 3, isSelected: false}));
    });
  });

  describe('showLocalAttributes prop', () => {
    it('sets isSelected value to panel local attributes', () => {
      viewModel.attr('item', loCloneDeep(panel));

      viewModel.attr('showLocalAttributes', true);

      expect(viewModel.attr('item.attributes.0'))
        .toEqual(jasmine.objectContaining({id: 1, isSelected: false}));
      expect(viewModel.attr('item.mappings.0'))
        .toEqual(jasmine.objectContaining({id: 2, isSelected: false}));
      expect(viewModel.attr('item.localAttributes.0'))
        .toEqual(jasmine.objectContaining({id: 3, isSelected: true}));
    });
  });

  describe('events', () => {
    describe('"{viewModel} type" event', () => {
      let event;

      beforeEach(() => {
        event = Component.prototype.events['{viewModel} type'].bind(viewModel);
      });

      it('should call panel changeType method', () => {
        viewModel.attr('item', panel);

        event([viewModel], {id: 1, type: 'Assessment'}, 'Assessment');

        expect(panel.changeType).toHaveBeenCalledWith('Assessment');
      });

      it('should select all attributes by default', () => {
        viewModel.attr('item', panel);
        spyOn(viewModel, 'setSelected');

        event([viewModel], {}, 'Assessment');
        expect(viewModel.setSelected).toHaveBeenCalled();
      });
    });
  });
});
