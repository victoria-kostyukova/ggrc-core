/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import loFindIndex from 'lodash/findIndex';
import {loadObjectsByStubs} from '../../plugins/utils/query-api-utils';
import {notifier} from '../../plugins/utils/notifiers-utils';
import {getAjaxErrorInfo} from '../../plugins/utils/errors-utils';

export default canMap.extend({
  fields: [],
  mappingsList: [],
  async addMappingObjects({objects}) {
    try {
      const loadedObjects =
        await loadObjectsByStubs(objects, this.attr('fields').attr());
      this.attr('mappingsList').push(...loadedObjects);
    } catch (xhr) {
      notifier('error', getAjaxErrorInfo(xhr).details);
    }
  },
  removeMappingObject({object}) {
    const indexInList = loFindIndex(this.attr('mappingsList'),
      ({id, type}) => id === object.id && type === object.type);

    if (indexInList !== -1) {
      this.attr('mappingsList').splice(indexInList, 1);
    }
  },
});
