/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loCompact from 'lodash/compact';
import canRoute from 'can-route';
import canMap from 'can-map';
const router = new canMap();

class RouterConfig {
  static setupRoutes(routes) {
    routes.forEach((route) => {
      canRoute(route.template, route.defaults);
    });
    canRoute.data = router;
    canRoute.start();
  }
}

const buildUrl = (data) => {
  let url = canRoute.url(data);
  return url;
};

const getUrlParams = (data) => {
  if (typeof data === 'string') {
    let widget;

    // trim first and last slashes if so
    // so canRoute.deparam can parse it
    let params = loCompact(data.split('/'));

    // if params missing 'widget' part
    if (params.length === 2) {
      widget = canRoute.attr('widget');

      if (widget) {
        params.unshift(widget);
      }
    }

    data = params.join('/');

    return canRoute.deparam(data);
  }
};

const changeHash = (data) => {
  canRoute.attr(data);
};

const changeUrl = (url) => {
  if (typeof url === 'string') {
    window.location.href = url;
  }
};

const reloadPage = () => {
  window.location.reload();
};

export default router;
export {
  RouterConfig,
  buildUrl,
  getUrlParams,
  changeHash,
  changeUrl,
  reloadPage,
};
