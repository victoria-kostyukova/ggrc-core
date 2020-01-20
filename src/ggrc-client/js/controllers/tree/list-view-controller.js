/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getFragment} from '../../plugins/ggrc-utils';
import canCompute from 'can-compute';
import canList from 'can-list';
import canMap from 'can-map';
import TreeLoader from './tree-loader';
import {getCounts} from '../../plugins/utils/widgets-utils';

function modelListLoader(controller, params) {
  let model = controller.options.model;
  let page = new $.Deferred();

  model.findPage(params).then(function (results) {
    let collectionName = model.root_collection + '_collection';
    let collection = results[collectionName] || [];

    page.resolve(new canList(collection), results.paging);
  });
  return page;
}

export default TreeLoader.extend({
  defaults: {
    is_related: false,
    model: null,
    extra_params: null,
    search_query: '',
    search_params: null,
    parent_instance: null,
    parent_type: null,
    object_display: null,
    parent_display: null,
    header_view: null,
    list_view: null,
    list_objects: null,
    list_loader: null,
  },
}, {
  init: function () {
    if (!this.options.extra_params) {
      this.options.extra_params = {};
    }
    if (!this.options.search_params) {
      this.options.search_params = {};
    }
    this.options.state = new canMap();

    this.context = new canMap({
      // FIXME: Needed?  Default `pager` to avoid binding issues.
      pager: {
        has_next: function () {
          return false;
        },
      },
    });
    this.context.attr('has_next_page', canCompute(() => {
      let pager = this.context.attr('pager');
      return pager && pager.has_next && pager.has_next();
    }));
    this.context.attr('has_prev_page', canCompute(() => {
      let pager = this.context.attr('pager');
      return pager && pager.has_prev && pager.has_prev();
    }));
    this.context.attr(this.options);

    if (this.options.header_view) {
      $.when(this.context)
        .then((ctx) => {
          let frag = getFragment(this.options.header_view, ctx);
          if (this.element) {
            this.element.prepend(frag);
          }
        });
    }

    if (!this.options.list) {
      this.options.list_loader = modelListLoader;
    }
  },

  prepare: function () {
    let that = this;
    let params = $.extend({}, this.options.extra_params || {});

    if (this._prepare_deferred) {
      return this._prepare_deferred;
    }

    params.__page_only = true;
    this._prepare_deferred = this.options.list_loader(this, params)
      .then(function (results, pager) {
        that.options.pager = pager;
        that.context.attr('pager', pager);
        that.update_count();
        return results;
      });

    return this._prepare_deferred;
  },

  fetch_list: function (params) {
    // Assemble extra search params
    let extraParams = this.options.extra_params || {};
    let searchParams = this.options.search_params;
    let that = this;

    this.element.trigger('loading');

    if (this.options.list) {
      this.options.list.replace([]);
    }

    params = $.extend({}, params, extraParams);

    if (this.options.model.list_view_options &&
      this.options.model.list_view_options.find_params) {
      params = $.extend(params,
        this.options.model.list_view_options.find_params);
    }

    if (this.options.model.model_singular === 'Person') {
      params.__sort = 'name,email';
      if (searchParams.search_term) {
        params.__search = searchParams.search_term;
      }
      if (searchParams.role_id) {
        params['user_roles.role_id'] = searchParams.role_id;
      }
      if (searchParams.noRole) {
        params.__no_role = true;
      }
    }

    return this.options.list_loader(this, params)
      .then(function (results, pager) {
        that.options.pager = pager;
        that.context.attr('pager', pager);
        return results;
      });
  },

  draw_list: function (list) {
    let that = this;

    if (list && this.options.fetch_post_process) {
      list = this.options.fetch_post_process(list);
    }

    if (list) {
      if (!this.options.list) {
        this.options.list = new canList();
        list.on('add', function (list, item, index) {
          that.enqueue_items(item);
        }).on('remove', function (list, item, index) {
          that.options.list.splice(index, 1);
          that.element.find('ul.tree-open').removeClass('tree-open');
        });
      } else {
        this.options.list.splice();
      }
      this.enqueue_items(list);
      this.on();
    }

    this.context.attr(this.options);
  },

  init_view: function () {
    let frag = getFragment(this.options.list_view, this.context);
    this.element.find('.spinner, .tree-structure').hide();
    this.element.append(frag).trigger('loaded');
    this.options.state.attr('loading', false);
  },

  update_count: function () {
    if (this.element) {
      getCounts()
        .attr(this.options.model.model_singular, this.options.pager.total);
    }
  },

  reset_search: function (el, ev) {
    this.options.search_params = {};
    this.options.search_query = '';
    this.element.find('.search-filters')
      .find('input[name=search], select[name=user_role]').val('');
    this.fetch_list().then((list) => this.draw_list(list));
  },

  insert_items: function (items) {
    this.options.list.push(...Array.from(items));
    return $.Deferred().resolve();
  },

  '.view-more-paging click': function (el, ev) {
    let that = this;
    let collectionName = that.options.model.root_collection + '_collection';
    let isNext = el.data('next');
    let canLoad = isNext ?
      that.options.pager.has_next() : that.options.pager.has_prev();
    let load = isNext ? that.options.pager.next : that.options.pager.prev;

    that.options.list.replace([]);
    that.element.find('.spinner').show();
    if (canLoad) {
      load().done(function (data) {
        that.element.find('.spinner').hide();
        if (typeof data === 'undefined') {
          return;
        }
        if (data[collectionName] && data[collectionName].length > 0) {
          that.enqueue_items(data[collectionName]);
        }
        that.options.pager = data.paging;
        that.context.attr('pager', data.paging);
      });
    }
  },

  '.search-filters input[name=search] change': function (el, ev) {
    this.options.search_params.search_term = el.val();
    this.fetch_list().then((list) => this.draw_list(list));
  },

  '.search-filters select[name=user_role] change': function (el, ev) {
    let value = el.val();
    if (value === 'no-role') {
      this.options.search_params.noRole = true;
      this.options.search_params.role_id = undefined;
    } else {
      this.options.search_params.noRole = false;
      this.options.search_params.role_id = value;
    }
    this.fetch_list().then((list) => this.draw_list(list));
  },

  '.search-filters button[type=reset] click': 'reset_search',
  '[data-toggle="modal-ajax-form"] modal:success'(el, ev, options) {
    if (this.options.model.constructor.model_singular === options.type) {
      this.fetch_list()
        .then((list) => {
          this.draw_list(list);
          this.update_count();
        });
    }
  },
});
