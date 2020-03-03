/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './create-and-map.stache';
import {
  MAP_OBJECTS,
} from '../../events/event-types';
import {
  isAuditScopeModel,
  isSnapshotModel,
  isSnapshotParent,
} from '../../plugins/utils/snapshot-utils';
import {isAllowedAny} from '../../permission';
import {shouldBeMappedExternally} from '../../models/mappers/mappings';
import {
  confirm,
} from '../../plugins/utils/modals';
import {
  getCreateObjectUrl,
  getMappingUrl,
} from '../../plugins/utils/ggrcq-utils';
import {isMegaMapping} from '../../plugins/utils/mega-object-utils';
import * as businessModels from '../../models/business-models';
import {externalBusinessObjects} from '../../plugins/models-types-collections';

const ViewModel = canDefineMap.extend({
  destinationType: {
    get() {
      return this.destinationModel && this.destinationModel.model_singular;
    },
  },
  allowedToCreate: {
    get() {
      let source = this.sourceType;
      let destination = this.destinationType;
      let isInAuditScopeSrc = isAuditScopeModel(source);
      let isSnapshotParentSrc = isSnapshotParent(source);
      let isSnapshotParentDst = isSnapshotParent(destination);
      let isSnapshotModelSrc = isSnapshotModel(source);
      let isSnapshotModelDst = isSnapshotModel(destination);

      let result =
        isAllowedAny('create', destination) &&
        // Don't allow if source is Audit scope model (Asmt) and destination is snapshotable
        !((isInAuditScopeSrc && isSnapshotModelDst) ||
          // Don't allow if source is snapshotParent (Audit) and destination is snapshotable.
          (isSnapshotParentSrc && isSnapshotModelDst) ||
          // Don't allow if destination is snapshotParent (Audit) and source is snapshotable.
          (isSnapshotParentDst && isSnapshotModelSrc));

      return result;
    },
  },
  isMappableExternally: {
    get() {
      let sourceType = this.sourceType;
      let destinationType = this.destinationType;
      return shouldBeMappedExternally(sourceType, destinationType);
    },
  },
  isMegaMapping: {
    get() {
      return isMegaMapping(this.sourceType, this.destinationType);
    },
  },
  megaRelation: {
    get(lastValue) {
      return lastValue || 'child';
    },
  },
  element: {
    value: null,
  },
  source: {
    value: null,
  },
  /**
   * Source type can be used via source.constructor.model_singular. But,
   * when Create and Map button is used for create modal, source is null.
   * Because of this, source type should be passed additionally.
   */
  sourceType: {
    value: '',
  },
  destinationModel: {
    value: null,
  },
  newEntries: {
    value: () => [],
  },
  getCreateAndMapExternallyText() {
    const destinationModel = this.destinationModel;
    const objects = externalBusinessObjects
      .filter((externalObjectName) =>
        destinationModel.model_singular !== externalObjectName
      )
      .map((externalObjectName) =>
        businessModels[externalObjectName].title_plural.toLowerCase())
      .join(', ');
    const listOfObjects =
      `scope objects, ${objects}, standards and regulations`;

    return `${destinationModel.title_singular} creation and mapping
      ${destinationModel.title_plural.toLowerCase()} to ${listOfObjects}
      flows are currently disabled. </br> </br> Please click
      “Proceed in the new tab” button to go to the new interface and complete
      these actions there.`;
  },
  getCreateAndReturnBackText() {
    let sourceModel = this.source.constructor;
    let destinationModel = this.destinationModel;

    return `Redirecting to ${destinationModel.title_plural} Library in the
      new interface to
      create a ${destinationModel.title_singular.toLowerCase()}.
      </br> </br>
      Until transition to the new UI is complete, you will need to come back
      here after creation and reopen this window to complete mapping to this
      ${sourceModel.title_singular.toLowerCase()}.`;
  },
  resetEntries() {
    this.newEntries = [];
  },
  mapObjects(objects) {
    if (this.isMappableExternally) {
      this.element.trigger('mapExternally'); // close mapper

      if (objects.length) {
        this.mapExternally();
      }

      return;
    }

    let options = {};

    if (this.isMegaMapping) {
      options.megaMapping = true;
      options.megaRelation = this.megaRelation;
    }

    this.source.dispatch({
      ...MAP_OBJECTS,
      objects,
      options,
    });
  },
  createExternally() {
    let destinationModel = this.destinationModel;

    confirm({
      modal_title: 'Warning',
      modal_description: this.isMappableExternally
        ? this.getCreateAndMapExternallyText()
        : this.getCreateAndReturnBackText(),
      button_view: '/modals/link-button.stache',
      modalConfirmLink: getCreateObjectUrl(destinationModel),
      modalConfirmButton: 'Proceed in the new tab',
    }, () => {
      // close object mapper
      this.element.trigger('mapExternally');
    }, () => this.cancel());
  },
  cancel() {
    this.element.trigger('canceled');
  },
  mapExternally() {
    let sourceModel = this.source.constructor;
    let destinationModel = this.destinationModel;
    let isMany = this.newEntries.length > 1;
    let modelName = isMany
      ? destinationModel.title_plural
      : destinationModel.title_singular;

    confirm({
      modal_title: 'Warning',
      modal_description: `Your ${modelName.toLowerCase()}
        ${isMany ? 'were': 'was'} successfully created.
        ${isMany ? 'They' : 'It'} will appear in the new frontend in few
        minutes. </br> </br>
        You are allowed to map new object${isMany ? 's' : ''} to this
        ${sourceModel.title_singular.toLowerCase()} only in the
        new frontend. By clicking "Proceed in the new tab" you'll be
        redirected to the new page where you can create mapping.`,
      button_view: '/modals/link-button.stache',
      modalConfirmButton: 'Proceed in the new tab',
      modalConfirmLink: getMappingUrl(this.source, destinationModel),
    });
  },
});

export default canComponent.extend({
  tag: 'create-and-map',
  view: canStache(template),
  ViewModel,
  events: {
    inserted() {
      this.viewModel.element = this.element;
    },
    // clicked Save & Close button in Create modal
    '.create-control modal:success'(el, ev, model) {
      this.viewModel.newEntries.push(model);
      this.viewModel.mapObjects(this.viewModel.newEntries);
    },
    // clicked Save & Add another button in Create modal
    '.create-control modal:added'(el, ev, model) {
      this.viewModel.newEntries.push(model);
    },
    // clicked Discard button in Discard Changes modal
    '.create-control modal:dismiss'() {
      this.viewModel.mapObjects(this.viewModel.newEntries);
    },
    // clicked Esc or close btn in Create modal and modal closed without Discard changes modal
    '{window} modal:dismiss'(el, ev, options) {
      let source = this.viewModel.source;

      // mapper sets uniqueId for modal-ajax.
      // we can check using unique id which modal-ajax is closing
      if (options && options.uniqueId && source.id === options.uniqueId
        && this.viewModel.newEntries.length) {
        this.viewModel.mapObjects(this.viewModel.newEntries);
      } else {
        this.viewModel.cancel();
      }
    },
  },
});
