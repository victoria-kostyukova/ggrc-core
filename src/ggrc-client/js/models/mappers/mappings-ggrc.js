/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  Proxy,
  Direct,
  Search,
} from '../mappers/mapper-helpers';
import Mappings from './mappings';
import CustomAttributeDefinition from '../custom-attributes/custom-attribute-definition';
import AccessControlRole from '../custom-roles/access-control-role';

const businessObjects = [
  'Assessment', 'AccessGroup', 'Audit', 'Contract', 'Control', 'DataAsset',
  'Document', 'Facility', 'Issue', 'Market', 'Metric', 'Objective', 'OrgGroup',
  'Policy', 'Process', 'Product', 'ProductGroup', 'Program', 'Project',
  'Regulation', 'Requirement', 'Risk', 'Standard', 'System',
  'TechnologyEnvironment', 'Threat', 'Vendor',
];

const coreObjects = _.difference(businessObjects,
  ['Assessment', 'Audit', 'Document', 'Program']);

const scopingObjects = [
  'AccessGroup', 'DataAsset', 'Facility', 'Market', 'Metric', 'OrgGroup',
  'Process', 'Product', 'ProductGroup', 'Project', 'System',
  'TechnologyEnvironment', 'Vendor',
];

(function (GGRC, can) {
  new Mappings('ggrc_core', {
    base: {},
    relatedMappings: {
      _related: ['Person', 'TaskGroup', 'Workflow'],
    },
    relatedObject: {
      related_objects_as_source: Proxy(
        null, 'destination', 'Relationship', 'source', 'related_destinations'),
    },

    Person: {
      _related: ['CycleTaskGroupObjectTask', 'TaskGroupTask', 'Workflow',
        ...GGRC.roleableTypes.map((model) => model.model_singular)],
    },

    Program: {
      _mixins: [
        'relatedObject', 'relatedMappings',
      ],
      _canonical: {
        related_objects_as_source:
          [...coreObjects, 'Audit', 'Document'],
      },
    },

    Document: {
      _mixins: ['relatedObject'],
      _canonical: {
        related_objects_as_source: [...coreObjects, 'Program'],
      },
      _related: ['Person'],
    },

    // Core objects
    coreObjectsMappings: {
      _mixins: ['relatedObject', 'relatedMappings'],
      _canonical: {
        related_objects_as_source: businessObjects,
      },
    },

    Issue: {
      _mixins: ['coreObjectsMappings'],
    },
    Contract: {
      _mixins: ['coreObjectsMappings'],
      _canonical: {
        related_objects_as_source: _.difference(businessObjects, ['Contract']),
      },
    },
    Control: {
      _mixins: ['coreObjectsMappings'],
    },
    Objective: {
      _mixins: ['coreObjectsMappings'],
    },
    Policy: {
      _mixins: ['coreObjectsMappings'],
      _canonical: {
        related_objects_as_source: _.difference(businessObjects, ['Policy']),
      },
    },
    Requirement: {
      _mixins: ['coreObjectsMappings'],
    },
    Regulation: {
      _mixins: ['relatedObject'],
      _canonical: {
        related_objects_as_source:
          _.difference(businessObjects, [...scopingObjects, 'Regulation']),
      },
      _related: [...scopingObjects, 'Person', 'TaskGroup', 'Workflow'],
    },
    Risk: {
      _mixins: ['coreObjectsMappings'],
    },
    Standard: {
      _mixins: ['relatedObject'],
      _canonical: {
        related_objects_as_source:
          _.difference(businessObjects, [...scopingObjects, 'Standard']),
      },
      _related: [...scopingObjects, 'Person', 'TaskGroup', 'Workflow'],
    },
    Threat: {
      _mixins: ['coreObjectsMappings'],
    },

    // Scoping objects
    scopingObjectsMappings: {
      _mixins: ['relatedObject'],
      _canonical: {
        related_objects_as_source:
          _.difference(businessObjects, ['Standard', 'Regulation']),
      },
      _related: ['Person', 'Regulation', 'Standard', 'TaskGroup', 'Workflow'],
    },
    AccessGroup: {
      _mixins: ['scopingObjectsMappings'],
      _canonical: {
        related_objects_as_source:
          _.difference(businessObjects,
            ['AccessGroup', 'Standard', 'Regulation']),
      },
    },
    DataAsset: {
      _mixins: ['scopingObjectsMappings'],
    },
    Facility: {
      _mixins: ['scopingObjectsMappings'],
    },
    Market: {
      _mixins: ['scopingObjectsMappings'],
    },
    Metric: {
      _mixins: ['scopingObjectsMappings'],
    },
    OrgGroup: {
      _mixins: ['scopingObjectsMappings'],
    },
    Process: {
      _mixins: ['scopingObjectsMappings'],
    },
    Product: {
      _mixins: ['scopingObjectsMappings'],
    },
    ProductGroup: {
      _mixins: ['scopingObjectsMappings'],
    },
    Project: {
      _mixins: ['scopingObjectsMappings'],
    },
    System: {
      _mixins: ['scopingObjectsMappings'],
    },
    TechnologyEnvironment: {
      _mixins: ['scopingObjectsMappings'],
    },
    Vendor: {
      _mixins: ['scopingObjectsMappings'],
    },

    // Audit
    Audit: {
      _mixins: ['relatedObject'],
      _canonical: {
        related_objects_as_source: [...coreObjects,
          'Assessment', 'AssessmentTemplate'],
      },
      _related: ['Evidence', 'Person', 'Program'],
    },
    Assessment: {
      _mixins: ['relatedObject'],
      _canonical: {
        related_objects_as_source: coreObjects,
      },
      _related: ['Audit', 'Evidence', 'Person'],
    },
    Evidence: {
      _related: ['Assessment', 'Audit', 'Person'],
    },
    AssessmentTemplate: {
      _related: ['Audit'],
    },

    // Other
    UserRole: {
      person: Direct('Person', 'user_roles', 'person'),
      role: Direct('Role', 'user_roles', 'role'),
    },
    MultitypeSearch: {
      _canonical: {
        related_objects_as_source: [
          'AccessGroup', 'Assessment', 'AssessmentTemplate', 'Audit',
          'Contract', 'Control', 'CycleTaskGroupObjectTask', 'DataAsset',
          'Document', 'Evidence', 'Facility', 'Issue', 'Market', 'Metric',
          'Objective', 'OrgGroup', 'Person', 'Process', 'Product',
          'ProductGroup', 'Project', 'Policy', 'Program', 'Regulation',
          'Requirement', 'Risk', 'Standard', 'System', 'TaskGroup',
          'TaskGroupTask', 'TechnologyEnvironment', 'Threat',
          'Vendor', 'Workflow',
        ],
      },
    },
    // Used by Custom Attributes widget
    CustomAttributable: {
      custom_attribute_definitions: Search(function (binding) {
        return CustomAttributeDefinition.findAll({
          definition_type: binding.instance.root_object,
          definition_id: null,
        });
      }, 'CustomAttributeDefinition'),
    },
    // used by the Custom Roles admin panel tab
    Roleable: {
      access_control_roles: Search(function (binding) {
        return AccessControlRole.findAll({
          object_type: binding.instance.model_singular,
          internal: false,
        });
      }, 'AccessControlRole'),
    },
  });
})(window.GGRC, window.can);
