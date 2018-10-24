/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import LocalStorage from './local-storage';

let LHN_SIZE = 'lhn_size';
let LHN_STATE = 'lhn_state';
let TREE_VIEW_HEADERS = 'tree_view_headers';
let TREE_VIEW_STATES = 'tree_view_states';
let TREE_VIEW = 'tree_view';
let CHILD_TREE_DISPLAY_LIST = 'child_tree_display_list';
let MODAL_STATE = 'modal_state';
let path = window.location.pathname.replace(/\./g, '/');

export default LocalStorage('CMS.Models.DisplayPrefs', {
  autoupdate: true,
  version: 20150129, // Last updated to add 2 accessors

  findAll: function () {
    let that = this;
    let objsDfd = this._super(...arguments)
      .then(function (objs) {
        let i;
        for (i = objs.length; i--;) {
          if (!objs[i].version || objs[i].version < that.version) {
            objs[i].destroy();
            objs.splice(i, 1);
          }
        }
        return objs;
      });
    return objsDfd;
  },

  findOne: function () {
    let that = this;
    let objDfd = this._super(...arguments)
      .then(function (obj) {
        let dfd;
        let p;
        if (!obj.version || obj.version < that.version) {
          obj.destroy();
          dfd = new $.Deferred();
          p = dfd.promise();
          p.status = 404;
          return dfd.reject(p, 'error', 'Object expired');
        } else {
          return obj;
        }
      });
    return objDfd;
  },

  create: function (opts) {
    opts.version = this.version;
    return this._super(opts);
  },

  update: function (id, opts) {
    opts.version = this.version;
    return this._super(id, opts);
  },

  getSingleton: function () {
    let prefs;
    if (this.cache) {
      return $.when(this.cache);
    }

    this.findAll().then((d) => {
      if (d.length > 0) {
        prefs = d[0];
      } else {
        prefs = new this();
        prefs.save();
      }
    });
    this.cache = prefs;
    return $.when(prefs);
  },
}, {
  init: function () {
    this.autoupdate = this.constructor.autoupdate;
  },

  makeObject: function () {
    let retval = this;
    let args = can.makeArray(arguments);
    can.each(args, function (arg) {
      let tval = can.getObject(arg, retval);
      if (!tval || !(tval instanceof can.Observe)) {
        tval = new can.Observe(tval);
        retval.attr(arg, tval);
      }
      retval = tval;
    });
    return retval;
  },

  getObject: function () {
    let args = can.makeArray(arguments);
    args[0] === null && args.splice(0, 1);
    return can.getObject(args.join('.'), this);
  },

  setTreeViewHeaders: function (modelName, displayList) {
    let hdr = this.getObject(path, TREE_VIEW_HEADERS);
    let obj = {};
    if (!hdr) {
      hdr = this.makeObject(path, TREE_VIEW_HEADERS);
    }

    obj.display_list = displayList;
    hdr.attr(modelName, obj);

    this.autoupdate && this.save();
    return this;
  },

  getTreeViewHeaders: function (modelName) {
    let value = this.getObject(path, TREE_VIEW_HEADERS);

    if (!value || !value[modelName]) {
      return [];
    }

    return value[modelName].display_list;
  },

  setTreeViewStates: function (modelName, statusList) {
    let hdr = this.getObject(TREE_VIEW_STATES);
    let obj = {};
    if (!hdr) {
      hdr = this.makeObject(TREE_VIEW_STATES);
    }
    obj.status_list = statusList;
    hdr.attr(modelName, obj);

    this.autoupdate && this.save();
    return this;
  },

  getTreeViewStates: function (modelName) {
    let value = this.getObject(TREE_VIEW_STATES);

    if (!value || !value[modelName]) {
      return [];
    }

    return value[modelName].status_list;
  },

  setModalState: function (modelName, displayState) {
    let path = null;
    let modalState = this.getObject(path, MODAL_STATE);
    let obj = {};

    if (!modalState) {
      modalState = this.makeObject(path, MODAL_STATE);
    }

    obj.display_state = displayState;
    modalState.attr(modelName, obj);

    this.autoupdate && this.save();
    return this;
  },

  getModalState: function (modelName) {
    let modalState = this.getObject(null, MODAL_STATE);

    if (!modalState || !modalState[modelName]) {
      return null;
    }

    return modalState[modelName].display_state;
  },

  setChildTreeDisplayList: function (modelName, displayList) {
    let hdr = this.getObject(TREE_VIEW, CHILD_TREE_DISPLAY_LIST);
    let obj = {};
    if (!hdr) {
      hdr = this.makeObject(TREE_VIEW, CHILD_TREE_DISPLAY_LIST);
    }

    obj.display_list = displayList;
    hdr.attr(modelName, obj);

    this.autoupdate && this.save();
    return this;
  },

  getChildTreeDisplayList: function (modelName) {
    let value = this.getObject(TREE_VIEW, CHILD_TREE_DISPLAY_LIST);

    if (!value || !value[modelName]) {
      return null; // in this case user should use default list an empty list, [], is different  than null
    }

    return value[modelName].display_list;
  },

  setLHNavSize: function (pageId, widgetId, size) {
    this.makeObject(pageId === null ? pageId : path, LHN_SIZE)
      .attr(widgetId, size);
    this.autoupdate && this.save();
    return this;
  },

  getLHNavSize: function (pageId, widgetId) {
    let size = this.getObject(pageId === null ? pageId : path, LHN_SIZE);
    if (!size) {
      size = this.makeObject(pageId === null ? pageId : path, LHN_SIZE)
        .attr(this.makeObject(LHN_SIZE, pageId).serialize());
    }

    return widgetId ? size.attr(widgetId) : size;
  },

  getLHNState: function () {
    return this.makeObject(LHN_STATE);
  },

  setLHNState: function (newPrefs, val) {
    let prefs = this.makeObject(LHN_STATE);
    can.each(
      ['open_category', 'panel_scroll', 'category_scroll', 'search_text',
        'my_work', 'filter_params', 'is_open', 'is_pinned']
      , function (token) {
        if (typeof newPrefs[token] !== 'undefined') {
          prefs.attr(token, newPrefs[token]);
        } else if (newPrefs === token && typeof val !== 'undefined') {
          prefs.attr(token, val);
        }
      }
    );

    this.autoupdate && this.save();
    return this;
  },

});
