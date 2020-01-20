/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';
import {isSnapshot} from '../../plugins/utils/snapshot-utils';

export default class AccessControlList extends Mixin {
  /**
   * This method clears ACL
   * before it's filled with the data from server or backup.
   * @param  {Object} resource resource object returned from ggrcAjax
   * @return {Object}        passed resource object
   */
  cleanupAcl(resource) {
    // no need to rewrite access_control_list for snapshots
    // or in case, when "access_control_list" is empty
    if (isSnapshot(this) || !this.attr('access_control_list').length) {
      return resource;
    }

    const modelCacheable = this.constructor;

    // do not find in cache
    if (!resource || !modelCacheable) {
      this.attr('access_control_list', []);
      return;
    }

    const modelParams = modelCacheable.object_from_resource(resource);
    if (!modelParams) {
      return resource;
    }

    let model = modelCacheable.findInCacheById(modelParams.id);
    if (model) {
      model.attr('access_control_list', []);
    }

    return resource;
  }

  'after:init'() {
    if (!this.access_control_list) {
      this.attr('access_control_list', []);
    }
  }

  'before:restore'() {
    this.cleanupAcl();
  }
}
