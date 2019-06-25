/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loDifference from 'lodash/difference';
import loIsFunction from 'lodash/isFunction';
import loForEach from 'lodash/forEach';
import loMap from 'lodash/map';
import {ggrcAjax} from '../../plugins/ajax_extensions';
import canStache from 'can-stache';
import canList from 'can-list';
import canMap from 'can-map';
import canControl from 'can-control';
import TreeViewControl from './tree-view';
import TreeViewOptions from './tree-view-options';
import {reify} from '../../plugins/utils/reify-utils';

function _firstElementChild(el) {
  let i;
  if (el.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    for (i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType !== Node.TEXT_NODE) {
        return el.childNodes[i];
      }
    }
  } else {
    return el;
  }
}

export default canControl.extend({
  defaults: {
    model: null,
    parent: null,
    instance: null,
    options_property: 'tree_view_options',
    show_view: null,
    expanded: false,
    subTreeLoading: false,
    child_options: [],
  },
}, {
  setup: function (el, opts) {
    let that = this;
    if (typeof this._super === 'function') {
      this._super(el);
    }
    if (opts instanceof canMap) {
      this.options = opts;
      loForEach(this.constructor.defaults, function (v, k) {
        if (!that.options.hasOwnProperty(k)) {
          that.options.attr(k, v);
        }
      });
    } else {
      this.options = new TreeViewOptions(this.constructor.defaults)
        .attr(opts.model ? opts.model[opts.options_property ||
          this.constructor.defaults.options_property] : {})
        .attr(opts);
    }
  },

  init: function () {
    this._draw_node_deferred = $.Deferred();

    // this timeout is required because the invoker will access the control via
    // the element synchronously so we must not replace the element just yet
    setTimeout(function () {
      this.draw_node();
    }.bind(this), 0);
  },

  '{instance} custom_attribute_values':
    function (object, ev, newVal, oldVal) {
      function getValues(cav) {
        return loMap(reify(cav), 'attribute_value');
      }
      if ((!oldVal || !newVal) || (oldVal.length === newVal.length &&
        loDifference(getValues(oldVal), getValues(newVal)).length)) {
        this.draw_node();
      }
    },

  /**
   * Trigger rendering the tree node in the DOM.
   * @param {Boolean} force - indicates redraw is/is not mandatory
   */
  draw_node: function () {
    if (!this.element) {
      return;
    }

    if (this._draw_node_in_progress) {
      return;
    }

    this._draw_node_in_progress = true;

    // the node's isActive state is not stored anywhere, thus we need to
    // determine it from the presemce of the corresponding CSS class
    let isActive = this.element.hasClass('active');

    ggrcAjax({
      url: this.options.show_view,
      dataType: 'text',
    }).then((view) => {
      return canStache(view)(this.options);
    }).then(this._ifNotRemoved((frag) => {
      this.replace_element(frag);
      this.add_control();
      if (isActive) {
        this.element.addClass('active');
      }
      this._draw_node_deferred.resolve();
    }));
    this._draw_node_in_progress = false;
  },

  // add all child options to one TreeViewOptions object
  add_child_lists_to_child: function () {
    let originalChildList = this.options.child_options;
    let newChildList = [];

    if (this.options.attr('_added_child_list')) {
      return;
    }
    this.options.attr('child_options', new canList());

    if (originalChildList.length === null) {
      originalChildList = [originalChildList];
    }

    loForEach(originalChildList, function (data, i) {
      let options = new canMap();
      data.each(function (v, k) {
        options.attr(k, v);
      });
      this.add_child_list(this.options, options);
      options.attr({
        options_property: this.options.options_property,
        parent: this,
        parent_instance: this.options.instance,
      });
      newChildList.push(options);
    }.bind(this));

    this.options.attr('child_options', newChildList);
    this.options.attr('_added_child_list', true);
  },

  add_control: function () {
    const subTree = this.element.find('.tree-view-control');
    if (subTree && subTree.length) {
      return new TreeViewControl(subTree[0], subTree.data('options'));
    }
  },

  // data is an entry from child options.  if child options is an array, run once for each.
  add_child_list: function (item, data) {
    let findParams;

    if (loIsFunction(item.instance[data.property])) {
      // Special case for handling mappings which are functions until
      // first requested, then set their name via .attr('...')
      findParams = function () {
        return item.instance[data.property]();
      };
      data.attr('find_params', findParams);
    } else if (data.property) {
      findParams = item.instance[data.property];
      if (findParams && findParams.isComputed) {
        data.attr('original_list', findParams);
        findParams = findParams();
      } else if (findParams && findParams.length) {
        data.attr('original_list', findParams);
        findParams = findParams.slice(0);
      }
    } else {
      findParams = data.attr('find_params');
      if (findParams) {
        findParams = findParams.serialize();
      } else {
        findParams = {};
      }
      if (data.parent_find_param) {
        findParams[data.parent_find_param] = item.instance.id;
      } else {
        findParams['parent.id'] = item.instance.id;
      }
      data.attr('find_params', new canMap(findParams));
    }
  },

  replace_element: function (el) {
    let oldEl = this.element;
    let oldData;
    let firstchild;

    if (!this.element) {
      return;
    }

    oldData = $.extend({}, oldEl.data());

    firstchild = $(_firstElementChild(el));

    oldData.controls = oldData.controls.slice(0);
    oldEl.data('controls', []);
    this.off();
    oldEl.replaceWith(el);
    this.element = firstchild.addClass('tree-view-node')
      .data(oldData);

    this.on();
  },

  display: function () {
    return this.trigger_expand();
  },

  display_subtrees: function () {
    let childTreeDfds = [];
    let that = this;

    this.element.find('.tree-view-control')
      .each(function (_, el) {
        let $el = $(el);
        let childTreeControl;

        //  Ensure this targets only direct child trees, not sub-tree trees
        if ($el.closest('.tree-view-node').is(that.element)) {
          childTreeControl = $el.control();

          if (!childTreeControl) {
            childTreeControl = that.add_control();
          }

          that.options.attr('subTreeLoading', true);
          childTreeDfds.push(childTreeControl.display()
            .then(function () {
              that.options.attr('subTreeLoading', false);
            }));
        }
      });

    return $.when(...childTreeDfds);
  },

  /**
   * Expand the tree node to make its subnodes visible.
   *
   * @return {$.Deferred} - a deferred object resolved when all the child
   *   nodes have been loaded and displayed
   */
  expand: function () {
    let $el = this.element;

    this.add_child_lists_to_child();
    if (this._expand_deferred && $el.find('.openclose').is('.active')) {
      // If we have already expanded and are currently still expanded, then
      // short-circuit the call. However, we still need to toggle `expanded`,
      // but if it's the first time expanding, `this.add_child_lists_to_child`
      // *must* be called first.
      this.options.attr('expanded', true);
      return this._expand_deferred;
    }

    this.options.attr('expanded', true);

    this._expand_deferred = $.Deferred();
    setTimeout(this._ifNotRemoved(function () {
      this.display_subtrees()
        .then(this._ifNotRemoved(function () {
          this.element.trigger('subtree_loaded');
          this.element.trigger('loaded');
          if (this._expand_deferred) {
            this._expand_deferred.resolve();
          }
        }.bind(this)));
    }.bind(this)), 0);
    return this._expand_deferred;
  },

  '.openclose:not(.active) click': function (el, ev) {
    // Ignore unless it's a direct child
    if (el.closest('.tree-view-node').is(this.element)) {
      this.expand();
    }
  },

  'input,select click': function (el, ev) {
    // Don't toggle accordion when clicking on input/select fields
    ev.stopPropagation();
  },

  trigger_expand: function () {
    let $expandEl = this.element.find('.openclose').first();
    if (!$expandEl.hasClass('active')) {
      $expandEl.trigger('click');
    }
    return this.expand();
  },
});
