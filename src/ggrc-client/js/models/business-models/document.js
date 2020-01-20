/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loFind from 'lodash/find';
import Cacheable from '../cacheable';
import {getRole} from '../../plugins/utils/acl-utils';
import {backendGdriveClient} from '../../plugins/ggrc-gapi-client';
import AccessControlList from '../mixins/access-control-list';
import CaUpdate from '../mixins/ca-update';
import Stub from '../stub';

const getAccessControlList = () => {
  let adminRole = getRole('Document', 'Admin');

  return adminRole ? [{
    ac_role_id: adminRole.id,
    person: {type: 'Person', id: GGRC.current_user.id},
  }] : [];
};

export default Cacheable.extend({
  root_object: 'document',
  root_collection: 'documents',
  title_singular: 'Document',
  title_plural: 'Documents',
  category: 'governance',
  findAll: 'GET /api/documents',
  findOne: 'GET /api/documents/{id}',
  create: 'POST /api/documents',
  update: 'PUT /api/documents/{id}',
  destroy: 'DELETE /api/documents/{id}',
  mixins: [
    AccessControlList,
    CaUpdate,
  ],
  statuses: [
    'Active',
    'Deprecated',
  ],
  kinds: [
    {title: 'File', value: 'FILE'},
    {title: 'Reference URL', value: 'REFERENCE_URL'},
  ],
  attributes: {
    context: Stub,
  },
  isRoleable: true,
  defaults: {
    kind: 'FILE',
    access_control_list: getAccessControlList(),
    status: 'Active',
    send_by_default: true,
    recipients: 'Admin',
  },
  tree_view_options: {
    display_attr_names: ['title', 'status', 'updated_at', 'document_type'],
    attr_list: [
      {attr_title: 'Title', attr_name: 'title'},
      {attr_title: 'Code', attr_name: 'slug'},
      {attr_title: 'State', attr_name: 'status'},
      {attr_title: 'Type', attr_name: 'kind'},
      {attr_title: 'Last Updated By', attr_name: 'modified_by'},
      {attr_title: 'Last Updated Date', attr_name: 'updated_at'},
      {attr_title: 'Last Deprecated Date', attr_name: 'last_deprecated_date'},
      {
        attr_title: 'Description',
        attr_name: 'description',
      }],
  },
}, {
  define: {
    title: {
      value: '',
      validate: {
        required: true,
      },
    },
  },
  kindTitle() {
    let value = this.attr('kind');
    let title = loFind(this.constructor.kinds, {value}).title;
    return title;
  },
  save() {
    let save = this._super.bind(this);
    return backendGdriveClient.withAuth(() => {
      return save();
    });
  },
});
