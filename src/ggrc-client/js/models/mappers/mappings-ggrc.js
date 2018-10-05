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
      _related: ['Person', 'Workflow'],
    },
    relatedObject: {
      related_objects_as_source: Proxy(
        null, 'destination', 'Relationship', 'source', 'related_destinations'),
    },

    Person: {
      _related: ['TaskGroupTask', 'Workflow',
        ...GGRC.roleableTypes.map((model) => model.model_singular)],
    },

    Program: {
      _mixins: [
        'relatedObject', 'relatedMappings',
      ],
      _canonical: {
        related_objects_as_source:
          [...coreObjects, 'Audit', 'Assessment', 'Document', 'Program'],
      },
    },

    Document: {
      _mixins: ['relatedObject'],
      _canonical: {
        related_objects_as_source: businessObjects,
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
    },
    Control: {
      _mixins: ['coreObjectsMappings'],
    },
    Objective: {
      _mixins: ['coreObjectsMappings'],
    },
    Policy: {
      _mixins: ['coreObjectsMappings'],
    },
    Requirement: {
      _mixins: ['coreObjectsMappings'],
    },
    Regulation: {
      _mixins: ['relatedObject'],
      _canonical: {
        related_objects_as_source:
          _.difference(businessObjects, scopingObjects),
      },
      _related: [...scopingObjects, 'Person', 'Workflow'],
    },
    Risk: {
      _mixins: ['coreObjectsMappings'],
    },
    Standard: {
      _mixins: ['relatedObject'],
      _canonical: {
        related_objects_as_source:
          _.difference(businessObjects, scopingObjects),
      },
      _related: [...scopingObjects, 'Person', 'Workflow'],
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
      _related: ['Workflow', 'Person', 'Standard', 'Regulation'],
    },
    AccessGroup: {
      _mixins: ['scopingObjectsMappings'],
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
          'Assessment', 'AssessmentTemplate', 'Audit', 'Program'],
      },
      _related: ['Evidence'],
    },
    Assessment: {
      _mixins: ['relatedObject'],
      _canonical: {
        related_objects_as_source:
          [...coreObjects, 'Assessment', 'Audit', 'Program'],
      },
      _related: ['Person', 'Evidence'],
    },
    Evidence: {
      _canonical: {
        related_objects_as_source: ['Audit', 'Assessment'],
      },
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
