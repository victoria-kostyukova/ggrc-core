/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import {
  buildParam,
  batchRequests,
} from '../../plugins/utils/query-api-utils';
import {
  getPageInstance,
} from '../../plugins/utils/current-page-utils';
import {initCounts} from '../../plugins/utils/widgets-utils';
import {
  REFRESH_MAPPING,
  DESTINATION_UNMAPPED,
} from '../../events/event-types';
import pubSub from '../../pub-sub';
import Relationship from '../../models/service-models/relationship';
import Context from '../../models/service-models/context';
import Evidence from '../../models/business-models/evidence';
import Document from '../../models/business-models/document';
import * as businessModels from '../../models/business-models';
import {notifier} from '../../plugins/utils/notifiers-utils';

let DOCUMENT_KIND_MAP = {
  FILE: 'documents_file',
  REFERENCE_URL: 'documents_reference_url',
};

const ViewModel = canDefineMap.extend({
  instance: {
    value: () => ({}),
  },
  modelType: {
    value: 'Document',
  },
  kind: {
    value: '',
  },
  documents: {
    value: () => [],
  },
  isLoading: {
    value: false,
  },
  pubSub: {
    value: () => pubSub,
  },
  pendingDestroy: {
    value: () => [],
  },
  // automatically refresh instance on related document create/remove
  autorefresh: {
    value: true,
  },
  isSnapshot: {
    value: false,
  },
  getDocumentsQuery() {
    let relevantFilters = [{
      type: this.instance.attr('type'),
      id: this.instance.attr('id'),
      operation: 'relevant',
    }];
    let additionalFilter = this.kind ?
      {
        expression: {
          left: 'kind',
          op: {name: '='},
          right: this.kind,
        },
      } :
      [];

    let modelType = this.modelType;
    let query =
      buildParam(modelType, {}, relevantFilters, [], additionalFilter);
    query.order_by = [{name: 'created_at', desc: true}];

    return query;
  },
  loadDocuments() {
    const query = this.getDocumentsQuery();

    this.isLoading = true;
    this.refreshTabCounts();

    let modelType = this.modelType;
    return batchRequests(query).then((response) => {
      const documents = response[modelType].values;

      this.documents.replace(
        documents.map((document) => this.getDocumentModel(document))
      );

      this.isLoading = false;
    });
  },
  setDocuments() {
    let instance;
    let kind;
    let documentPath;
    let documents;

    // load documents for non-snapshots objects
    if (!this.isSnapshot) {
      this.loadDocuments();
      return;
    }

    instance = this.instance;
    kind = this.kind;

    if (kind) {
      documentPath = DOCUMENT_KIND_MAP[kind];
      documents = instance[documentPath];
    } else {
      // We need to display URL and Evidences together ("Related
      // Assessments pane")
      documents = instance.document_url.concat(instance.document_evidence);
    }

    this.documents.replace(documents);
  },
  createDocument(data) {
    let modelType = this.modelType;
    let context = modelType === 'Evidence'
      ? this.instance.context
      : new Context({id: null});

    let document = new businessModels[modelType]({
      link: data,
      title: data,
      context,
      kind: this.kind,
    });
    return document;
  },
  saveDocument(document) {
    return document.save();
  },
  createRelationship(document) {
    let relationship = new Relationship({
      source: this.instance,
      destination: document,
      context: this.instance.context ||
        new Context({id: null}),
    });
    return relationship.save();
  },
  createRelatedDocument(data) {
    let document = this.createDocument(data);

    this.isLoading = true;

    return this.saveDocument(document)
      .then((data) => {
        this.documents.unshift(data);
        return this.createRelationship(data);
      })
      .then(() => this.refreshTabCounts())
      .fail((err) => {
        console.error(`Unable to create related document: ${err}`);
      })
      .done(() => {
        this.isLoading = false;
      });
  },
  async removeRelatedDocument(document) {
    let documents = this.documents.filter((item) =>
      item.id !== document.id
    );

    if (documents.length === this.documents.length) {
      return $.Deferred().resolve();
    }

    this.documents = documents;
    this.addPendingDestroy(document);

    let relationship;
    try {
      relationship = await Relationship.findRelationship(
        document, this.instance);
      if (!relationship) {
        throw new Error();
      }
    } catch (e) {
      notifier('error', 'Unable to find relationship');
      this.documents.unshift(document);
      this.removePendingDestroy(document);

      return $.Deferred().reject({
        error: 'Unable to find relationship',
      });
    }

    return relationship.destroy()
      .fail(() => {
        notifier(
          'error',
          `Unable to remove related document: ${document.title}`
        );
        this.documents.unshift(document);
        this.removePendingDestroy(document);
      })
      .always(() => {
        this.removePendingDestroy(document);
      });
  },
  addPendingDestroy({id, kind}) {
    this.isLoading = true;
    this.pendingDestroy.push({
      id,
      kind,
    });
  },
  removePendingDestroy({id, kind}) {
    const index = this.pendingDestroy
      .serialize()
      .findIndex((document) => document.id === id && document.kind === kind);

    if (index !== -1) {
      this.pendingDestroy.splice(index, 1);
    }

    if (!this.pendingDestroy.length) {
      this.isLoading = false;
    }
  },
  markDocumentForDeletion(document) {
    let documents = this.documents.filter((item) => {
      return item !== document;
    });

    this.documents = documents;
    this.dispatch({
      type: 'removeMappings',
      object: document,
    });
  },
  markDocumentForAddition(data) {
    let document = this.createDocument(data);

    this.documents.unshift(document);
    this.isLoading = true;

    return this.saveDocument(document)
      .then(() => {
        this.dispatch({
          type: 'addMappings',
          objects: [document],
        });
      })
      .always(() => this.isLoading = false);
  },
  refreshRelatedDocuments() {
    if (this.autorefresh) {
      this.loadDocuments();
    }
  },
  refreshTabCounts: function () {
    let pageInstance = getPageInstance();
    let modelType = this.modelType;
    initCounts(
      [modelType],
      pageInstance.type,
      pageInstance.id
    );
  },
  getDocumentModel(document) {
    const Model = businessModels[this.modelType];
    return Model.findInCacheById(document.id) || new Model(document);
  },
});

export default canComponent.extend({
  tag: 'related-documents',
  leakScope: true,
  ViewModel,
  init() {
    let instance = this.viewModel.instance;
    let isNew = instance.isNew();
    let isSnapshot = !!(instance.snapshot || instance.isRevision);

    // don't need to load documents for unsaved instance
    if (!isNew) {
      this.viewModel.isSnapshot = isSnapshot;
      this.viewModel.setDocuments();
    }
  },
  events: {
    [`{viewModel.instance} ${REFRESH_MAPPING.type}`]([instance], event) {
      if (this.viewModel.modelType === event.destinationType) {
        this.viewModel.refreshRelatedDocuments();
      }
    },
    [`{viewModel.instance} ${DESTINATION_UNMAPPED.type}`]([instance], event) {
      let item = event.item;
      let viewModel = this.viewModel;

      if (item.type === viewModel.modelType
        && item.kind === viewModel.kind) {
        viewModel.loadDocuments();
      }
    },
    '{pubSub} objectDeleted'(pubSub, event) {
      let instance = event.instance;
      if (instance instanceof Evidence ||
        instance instanceof Document) {
        this.viewModel.refreshRelatedDocuments();
      }
    },
  },
});
