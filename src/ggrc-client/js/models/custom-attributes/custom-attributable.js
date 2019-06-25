/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loOrderBy from 'lodash/orderBy';
import Cacheable from '../cacheable';
import {getCustomAttributableModels} from '../../plugins/utils/models-utils';

/* class CustomAttributable
  *
  * CustomAttributable does not query the backend, it is used to display a
  * list of objects in the custom attributes widget.
  *
  */
export default Cacheable.extend({
  root_object: 'custom_attributable',
  findAll: function () {
    let types = loOrderBy(getCustomAttributableModels(),
      'category', false);

    return $.when(_.filteredMap(types, (type, i) => {
      return new this(Object.assign({}, type, {
        id: i,
      }));
    }));
  },
}, {
  // Cacheable checks if selfLink is set when the findAll deferred is done
  selfLink: '/custom_attribute_list',
});
