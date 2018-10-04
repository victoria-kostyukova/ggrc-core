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
  'Metric', 'TechnologyEnvironment', 'AccessGroup',
  'DataAsset', 'Facility', 'Market', 'OrgGroup', 'Vendor', 'Process',
  'Product', 'ProductGroup', 'Project', 'System', 'Regulation',
  'Policy', 'Contract', 'Standard', 'Program', 'Issue', 'Control',
  'Requirement', 'Objective', 'Audit', 'Assessment',
  'Risk', 'Threat', 'Document',
];

const scopingObjects = [
  'Metric', 'TechnologyEnvironment', 'AccessGroup',
  'DataAsset', 'Facility', 'Market', 'OrgGroup', 'Vendor', 'Process',
  'Product', 'ProductGroup', 'Project', 'System',
];

(function (GGRC, can) {
  new Mappings('ggrc_core', {
    base: {},
    relatedMappings: {
      _related: ['Person', 'Workflow'],
    },
    Person: {
      _related: ['TaskGroupTask', 'Workflow',
        ...GGRC.roleableTypes.map((model) => model.model_singular)],
    },
    // Governance
    Control: {
      _mixins: [
        'related_object', 'relatedMappings',
      ],
    },
    Objective: {
      _mixins: ['related_object', 'relatedMappings'],
    },
    Requirement: {
      _mixins: ['related_object', 'relatedMappings'],
    },
    Document: {
      _mixins: ['related_object'],
      _related: ['Person'],
    },
    related_object: {
      _canonical: {
        related_objects_as_source: businessObjects,
      },
      related_objects_as_source: Proxy(
        null, 'destination', 'Relationship', 'source', 'related_destinations'),
    },
    // Program
    Program: {
      _mixins: [
        'related_object', 'relatedMappings',
      ],
    },
    directive_object: {
      _mixins: [
        'related_object', 'relatedMappings',
      ],
    },

    // Directives
    Regulation: {
      _mixins: ['directive_object'],
      _canonical: {
        related_objects_as_source: _.difference(
          businessObjects, scopingObjects),
      },
      _related: _.concat(scopingObjects, ['Person', 'Workflow']),
    },
    Contract: {
      _mixins: ['directive_object'],
    },
    Standard: {
      _mixins: ['directive_object'],
      _canonical: {
        related_objects_as_source: _.difference(
          businessObjects, scopingObjects),
      },
      _related: _.concat(scopingObjects, ['Person', 'Workflow']),
    },
    Policy: {
      _mixins: ['directive_object'],
    },

    // Business objects
    business_object: {
      _mixins: [
        'related_object',
      ],
      _canonical: {
        related_objects_as_source: _.difference(businessObjects,
          ['Standard', 'Regulation']),
      },
      _related: ['Workflow', 'Person', 'Standard', 'Regulation'],
    },
    AccessGroup: {
      _mixins: ['business_object'],
    },
    DataAsset: {
      _mixins: ['business_object'],
    },
    Facility: {
      _mixins: ['business_object'],
    },
    Market: {
      _mixins: ['business_object'],
    },
    Metric: {
      _mixins: ['business_object'],
    },
    OrgGroup: {
      _mixins: ['business_object'],
    },
    Vendor: {
      _mixins: ['business_object'],
    },
    Product: {
      _mixins: ['business_object'],
    },
    ProductGroup: {
      _mixins: ['business_object'],
    },
    Project: {
      _mixins: ['business_object'],
    },
    System: {
      _mixins: ['business_object'],
    },
    Process: {
      _mixins: ['business_object'],
    },
    TechnologyEnvironment: {
      _mixins: ['business_object'],
    },
    UserRole: {
      person: Direct('Person', 'user_roles', 'person'),
      role: Direct('Role', 'user_roles', 'role'),
    },
    Audit: {
      _related: ['Evidence'],
      _mixins: [
        'related_object',
      ],
      _canonical: {
        assessmenttemplate: 'AssessmentTemplate',
      },
    },
    Assessment: {
      _related: ['Person', 'Evidence'],
      _mixins: [
        'related_object',
      ],
    },
    Evidence: {
      _canonical: {
        related_objects_as_source: ['Audit', 'Assessment'],
      },
    },
    AssessmentTemplate: {
      _related: ['Audit'],
    },
    Issue: {
      _mixins: [
        'related_object', 'relatedMappings',
      ],
    },
    Comment: {
      _mixins: ['related_object'],
    },
    MultitypeSearch: {
      _canonical: {
        related_objects_as_source: [
          'DataAsset', 'Facility', 'Market', 'OrgGroup', 'Vendor', 'Process',
          'Product', 'ProductGroup', 'Project', 'System', 'Regulation',
          'Policy', 'Contract', 'Standard', 'Program', 'Issue', 'Control',
          'Requirement', 'Objective', 'Audit', 'Assessment',
          'AssessmentTemplate', 'AccessGroup', 'Risk', 'Threat', 'Document',
          'Metric', 'TechnologyEnvironment', 'Workflow', 'Evidence', 'Person',
          'TaskGroupTask', 'TaskGroup', 'CycleTaskGroupObjectTask',
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
    Risk: {
      _mixins: ['directive_object'],
    },
    Threat: {
      _mixins: ['directive_object'],
    },
  });
})(window.GGRC, window.can);
