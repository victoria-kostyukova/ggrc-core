/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../mega-relation-selection-item';
import pubSub from '../../../pub-sub';

describe('mega-relation-selection-item component', () => {
  let viewModel;
  let fakeEvent;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('switchRelation() method', () => {
    beforeEach(() => {
      fakeEvent = new Event('click');
    });

    it('dispatches mapAsChild event', () => {
      spyOn(pubSub, 'dispatch');
      viewModel.attr('id', 123);
      viewModel.switchRelation(fakeEvent, true);

      expect(pubSub.dispatch).toHaveBeenCalledWith({
        type: 'mapAsChild',
        id: 123,
        val: 'child',
      });
    });

    it('calls stopPropagation for passed event', () => {
      spyOn(fakeEvent, 'stopPropagation');
      viewModel.switchRelation(fakeEvent, true);

      expect(fakeEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('childRelation getter', () => {
    it('should return false if mapAsChild is equal null', () => {
      viewModel.attr('mapAsChild', null);
      expect(viewModel.attr('childRelation')).toBe(false);
    });

    it('should return true if mapAsChild is equal true', () => {
      viewModel.attr('mapAsChild', true);
      expect(viewModel.attr('childRelation')).toBe(true);
    });

    it('should return false if mapAsChild is not equal true', () => {
      viewModel.attr('mapAsChild', false);
      expect(viewModel.attr('childRelation')).toBe(false);
    });
  });

  describe('parentRelation getter', () => {
    it('should return false if mapAsChild is equal null', () => {
      viewModel.attr('mapAsChild', null);
      expect(viewModel.attr('parentRelation')).toBe(false);
    });

    it('should return true if mapAsChild is equal false', () => {
      viewModel.attr('mapAsChild', false);
      expect(viewModel.attr('parentRelation')).toBe(true);
    });

    it('should return false if mapAsChild is not equal false', () => {
      viewModel.attr('mapAsChild', true);
      expect(viewModel.attr('parentRelation')).toBe(false);
    });
  });
});
