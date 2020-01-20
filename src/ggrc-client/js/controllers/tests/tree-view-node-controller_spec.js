/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/
import * as GGRCUtils from '../../plugins/ggrc-utils';
import canMap from 'can-map';
import Ctrl from '../tree/tree-view-node';

describe('TreeViewNode Controller', function () {
  'use strict';

  describe('draw_node() method', function () {
    let ctrlInst; // fake controller instance
    let ifNotRemovedResult; // fake return value of the _ifNotRemoved() method
    let method;
    let $element;

    beforeEach(function () {
      ifNotRemovedResult = {};
      $element = $('<div></div>');

      ctrlInst = {
        options: new canMap({
          show_view: '/foo/bar.stache',
        }),
        element: $element,
        _draw_node_in_progress: false,
        _draw_node_deferred: new $.Deferred(),
        add_child_lists_to_child: jasmine.createSpy(),
        _ifNotRemoved: jasmine.createSpy().and.returnValue(ifNotRemovedResult),
        replace_element: jasmine.createSpy(),
        add_control: jasmine.createSpy(),
      };

      method = Ctrl.prototype.draw_node.bind(ctrlInst);
      spyOn(GGRCUtils, 'getFragment')
        .and.callFake(() => {
          const fragment= document.createDocumentFragment();
          fragment.appendChild(document.createElement('div'));
          return fragment;
        });
    });

    it('doesn\'t render if DOM element is null', function () {
      ctrlInst.element = undefined;
      expect(method()).toBe(undefined);
    });

    it('renders the DOM element with the "active" CSS class if node active',
      async () => {
        let callArgs;
        let callback;

        ctrlInst.options.attr('isActive', false);
        $element.addClass('active');

        await method();

        expect(ctrlInst._ifNotRemoved).toHaveBeenCalled();
        callArgs = ctrlInst._ifNotRemoved.calls.mostRecent().args;
        callback = callArgs[0];

        // simulate invoking the callback and observe the effect
        $element.removeClass('active');
        callback();

        expect(ctrlInst.element.hasClass('active')).toBe(true);
      }
    );

    it('renders the DOM element without the "active" CSS class if ' +
      'node not active',
    async () => {
      let callArgs;
      let callback;

      ctrlInst.options.attr('isActive', false);
      $element.removeClass('active'); // make sure it is indeed inactive

      await method();

      expect(ctrlInst._ifNotRemoved).toHaveBeenCalled();
      callArgs = ctrlInst._ifNotRemoved.calls.mostRecent().args;
      callback = callArgs[0];

      // simulate invoking the callback and observe the effect
      callback();

      expect(ctrlInst.element.hasClass('active')).toBe(false);
    }
    );
  });

  describe('expand() method', function () {
    let ctrlInst; // fake controller instance
    let displaySubtreesDfd;
    let method;
    let $tree;

    beforeEach(function () {
      $tree = $([
        '<li class="tree-item">',
        '  <div>',
        '    <div class="openclose"></div>',
        '  </div>',
        '</li>',
      ].join(''));

      displaySubtreesDfd = new $.Deferred();

      ctrlInst = {
        element: $tree,
        options: new canMap({
          show_view: '/foo/bar.stache',
        }),
        _ifNotRemoved: jasmine.createSpy().and.callFake(function (callback) {
          return callback;
        }),
        add_child_lists_to_child: jasmine.createSpy(),
        display_subtrees:
          jasmine.createSpy().and.returnValue(displaySubtreesDfd),
      };

      method = Ctrl.prototype.expand.bind(ctrlInst);
    });

    it('triggers displaying the subtrees if currently not expanded',
      function (done) {
        // the node has been expanded before...
        ctrlInst._expand_deferred = new $.Deferred();

        // ...but it's currently not expanded
        $tree.find('.openclose').removeClass('active');

        method();

        setTimeout(function () {
          expect(ctrlInst.display_subtrees).toHaveBeenCalled();
          done();
        }, 10);
      }
    );
  });
});
