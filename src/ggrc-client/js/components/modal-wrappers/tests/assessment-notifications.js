/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../assessment-notifications';

describe('"assessment-notifications" component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('init() method', () => {
    it('should set values from recipients if it is separated by spaces', () => {
      viewModel.instance.attr('recipients', 'A, B, C');
      viewModel.init();

      const expectResult = {A: true, B: true, C: true};
      const result = viewModel.values.serialize();

      expect(result).toEqual(expectResult);
    });

    it('should set values from recipients if it is not separated' +
      'by spaces', () => {
      viewModel.instance.attr('recipients', 'A,B,C');
      viewModel.init();

      const expectResult = {A: true, B: true, C: true};
      const result = viewModel.values.serialize();

      expect(result).toEqual(expectResult);
    });

    it('should set empty object to values if recipients is empty', () => {
      viewModel.instance.attr('recipients', '');
      viewModel.init();

      const expectResult = {};
      const result = viewModel.values.serialize();

      expect(result).toEqual(expectResult);
    });
  });

  describe('"{viewModel.values} change" event', () => {
    let event;

    beforeAll(() => {
      event = Component.prototype.events['{viewModel.values} change']
        .bind({viewModel});
    });

    it('should set recipients if all is selected', () => {
      viewModel.attr('values', {A: true, B: true, C: true});
      event();
      const expectResult = 'A,B,C';
      const result = viewModel.instance.attr('recipients');

      expect(result).toEqual(expectResult);
    });

    it('should set recipients if nothing selected', () => {
      viewModel.attr('values', {A: false, B: false, C: false});
      event();
      const expectResult = '';
      const result = viewModel.instance.attr('recipients');

      expect(result).toEqual(expectResult);
    });

    it('should set recipients if selected partially', () => {
      viewModel.attr('values', {A: true, B: false, C: true});
      event();
      const expectResult = 'A,C';
      const result = viewModel.instance.attr('recipients');

      expect(result).toEqual(expectResult);
    });
  });
});
