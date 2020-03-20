/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../document-object-list-item';

describe('document-object-list-item component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('expect getter for', () => {
    it('itemData returns "instance"', () => {
      const instance = new canMap({
        kind: 'listItem',
      });
      viewModel.instance = instance;

      expect(viewModel.itemData).toEqual(instance);
    });

    it('itemTitle returns "instance.title" if defined', () => {
      const instance = new canMap({
        title: 'Some Title',
        link: 'Some Link',
      });
      viewModel.instance = instance;

      expect(viewModel.itemTitle).toEqual(instance.title);
    });

    it('itemTitle returns "instance.link" if title not defined', () => {
      const instance = new canMap({
        title: null,
        link: 'Some Link',
      });
      viewModel.instance = instance;

      expect(viewModel.itemTitle).toEqual(instance.link);
    });

    it('itemCreationDate returns "instance.created_at"', () => {
      const instance = new canMap({
        created_at: Date.now(),
      });
      viewModel.instance = instance;

      expect(viewModel.itemCreationDate).toEqual(instance.created_at);
    });

    it('itemStatus returns "instance.status"', () => {
      const instance = new canMap({
        status: 'SomeState',
      });
      viewModel.instance = instance;

      expect(viewModel.itemStatus).toEqual(instance.status);
    });

    it('isItemValid returns false if "instance.status" is "Deprecated"', () => {
      const instance = new canMap({
        status: 'DepRecAted',
      });
      viewModel.instance = instance;

      expect(viewModel.isItemValid).toBeFalsy();
    });

    it('isItemValid returns true if "instance.status" is not "Deprecated"',
      () => {
        const instance = new canMap({
          status: 'Active',
        });
        viewModel.instance = instance;

        expect(viewModel.isItemValid).toBeTruthy();
      });
  });
});
