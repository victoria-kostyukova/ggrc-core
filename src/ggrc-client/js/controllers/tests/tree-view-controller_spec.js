/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import Ctrl from '../tree/tree-view';

describe('TreeView Controller', function () {
  describe('removeListItem() method', function () {
    let method;
    let element;

    beforeEach(function () {
      element = $(`
        <table>
          <tr class="tree-view-node" data-object-id="1">
            <td data-object-id="2"></td>
          </tr>
          <tr class="tree-view-node" data-object-id="2"></tr>
          <tr class="tree-view-node" data-object-id="3"></tr>
        </table>
      `);
      method = Ctrl.prototype.removeListItem.bind({element});
    });

    it('should tree view\'s node from DOM based on passed item.id',
      () => {
        const item = new canMap({id: 2});

        method(item);

        expect(element.find('.tree-view-node[data-object-id="2"]').length)
          .toBe(0);
      });
  });
});
