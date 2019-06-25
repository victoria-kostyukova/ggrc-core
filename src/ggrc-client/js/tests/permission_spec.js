/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loForEach from 'lodash/forEach';
import loMap from 'lodash/map';
import * as AjaxExtensions from '../plugins/ajax_extensions';
import Permission from '../permission';
import {makeFakeInstance} from '../../js_specs/spec_helpers';
import * as CurrentPageUtils from '../plugins/utils/current-page-utils';
import UserRole from '../models/service-models/user-role';
import Audit from '../models/business-models/audit';
import {getInstance} from '../plugins/utils/models-utils';

describe('Permission', function () {
  describe('_admin_permission_for_context() method', function () {
    it('returns new admin permission for specified context_id',
      function () {
        let result = Permission._admin_permission_for_context(23);
        expect(result.action).toEqual('__GGRC_ADMIN__');
        expect(result.resource_type).toEqual('__GGRC_ALL__');
        expect(result.context_id).toEqual(23);
      });
  });

  describe('_all_resource_permission() method', function () {
    let permission;

    beforeEach(function () {
      permission = {
        action: 'create',
        context_id: '111',
      };
    });
    it('returns new all resource permission', function () {
      let result = Permission._all_resource_permission(permission);
      expect(result.action).toEqual(permission.action);
      expect(result.resource_type).toEqual('__GGRC_ALL__');
      expect(result.context_id).toEqual(permission.context_id);
    });
  });

  describe('_permission_match() method', function () {
    let permissions;

    beforeEach(function () {
      permissions = {
        create: {
          Program: {
            contexts: [1, 2, 3],
          },
        },
      };
    });
    it('returns true if permissions contains specified permission',
      function () {
        let permission = {
          action: 'create',
          resource_type: 'Program',
          context_id: 1,
        };
        expect(Permission._permission_match(permissions, permission))
          .toEqual(true);
      });
    it('returns false if permissions does not contain specified permission',
      function () {
        let permissionCollection = loMap([
          ['create', 'Program', 111],
          ['delete', 'Program', 1],
          ['create', 'Control', 1],
        ], function (items) {
          return {
            action: items[0],
            resource_type: items[1],
            context_id: items[2],
          };
        });

        loForEach(permissionCollection, function (permission) {
          expect(Permission._permission_match(permissions, permission))
            .toEqual(false);
        });
      });
  });

  describe('_is_allowed() method', function () {
    let permissions;
    let permission;

    beforeEach(function () {
      permissions = {};
    });
    it('returns false if permissions is undefined', function () {
      expect(Permission._is_allowed()).toEqual(false);
    });
    it('returns true if there is permission for null context', function () {
      permission = {
        action: 'create',
        resource_type: 'Audit',
      };
      permissions.create = {
        Audit: {
          contexts: [null],
        },
      };
      expect(Permission._is_allowed(permissions, permission)).toEqual(true);
    });
    it('returns true if admin permission is matched', function () {
      permission = {};
      permissions.__GGRC_ADMIN__ = {
        __GGRC_ALL__: {
          contexts: [0],
        },
      };
      expect(Permission._is_allowed(permissions, permission)).toEqual(true);
    });
    it('returns true if all resource permission is matched', function () {
      permission = {
        action: 'create',
        context_id: 11,
      };
      permissions.create = {
        __GGRC_ALL__: {
          contexts: [11],
        },
      };
      expect(Permission._is_allowed(permissions, permission)).toEqual(true);
    });
    it('returns true if admin permission for context is matched', function () {
      permission = {
        context_id: 101,
      };
      permissions.__GGRC_ADMIN__ = {
        __GGRC_ALL__: {
          contexts: [101],
        },
      };
      expect(Permission._is_allowed(permissions, permission)).toEqual(true);
    });
    it('returns false if permission is not matched', function () {
      permission = {
        action: 'delete',
        resource_type: 'Audit',
        context_id: 321,
      };
      expect(Permission._is_allowed(permissions, permission)).toEqual(false);
    });
  });

  describe('_resolve_permission_variable', function () {
    let value;

    it('returns "value" if its type is not string', function () {
      value = {};
      expect(Permission._resolve_permission_variable(value)).toBe(value);
    });
    it('returns "value" if its type string and first symbol is not "$"',
      function () {
        value = 'mock';
        expect(Permission._resolve_permission_variable(value)).toEqual(value);
      });
    it('returns current user instance ' +
    'if value is equal to "$current_user"', function () {
      let currentUser = getInstance('Person', GGRC.current_user.id);
      value = '$current_user';
      expect(Permission._resolve_permission_variable(value))
        .toEqual(currentUser);
    });
    it('throws error if value is not equal to "$current_user"' +
    ' but its first symbol is "$"', function () {
      let foo = function () {
        value = '$user';
        Permission._resolve_permission_variable(value);
      };
      expect(foo).toThrow(jasmine.any(Error));
    });
  });

  describe('_is_allowed_for() method', function () {
    let permissions;
    let instance;
    let result;

    beforeEach(function () {
      permissions = {};
    });

    describe('within userRole instance', () => {
      let fakeUserRoleCreator;

      beforeEach(function () {
        fakeUserRoleCreator = makeFakeInstance({model: UserRole});
      });

      it('return true if it is admin permission if no conditions', function () {
        permissions.__GGRC_ADMIN__ = {
          __GGRC_ALL__: {
            contexts: [0],
          },
        };
        instance = fakeUserRoleCreator();
        result = Permission._is_allowed_for(permissions, instance, 'create');
        expect(result).toEqual(true);
      });
      it('return true if it is admin permission and matches all conditions',
        function () {
          permissions.__GGRC_ADMIN__ = {
            __GGRC_ALL__: {
              contexts: [0],
              conditions: {
                '0': [{
                  condition: 'contains',
                  terms: {
                    value: {id: 0},
                    list_property: 'list_value',
                  },
                }],
              },
            },
          };
          instance = fakeUserRoleCreator();
          instance.list_value = [{id: 0}];
          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(true);
        });
      it('returns true if permissions resources contains instance id',
        function () {
          permissions.create = {
            UserRole: {
              resources: [10],
            },
          };
          instance = fakeUserRoleCreator();
          instance.attr('id', 10);
          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(true);
        });
      it('returns true if there is permission with null context ' +
      'and no conditions', function () {
        permissions.create = {
          UserRole: {
            contexts: [null],
          },
        };
        instance = fakeUserRoleCreator();
        result = Permission._is_allowed_for(permissions, instance, 'create');
        expect(result).toEqual(true);
      });
      it('returns true if there is permission with specified context ' +
      'and no conditions', function () {
        permissions.create = {
          UserRole: {
            contexts: [101],
          },
        };
        instance = fakeUserRoleCreator();
        instance.attr('context', {id: 101});
        result = Permission._is_allowed_for(permissions, instance, 'create');
        expect(result).toEqual(true);
      });
      describe('returns false if there is permission ' +
      'but conditions are not matched', function () {
        it('for "contains" condition', function () {
          permissions.create = {
            UserRole: {
              contexts: [101],
              conditions: {
                '101': [{
                  condition: 'contains',
                  terms: {
                    value: {id: 0},
                    list_property: 'list_value',
                  },
                }],
              },
            },
          };
          instance = fakeUserRoleCreator();
          instance.attr('context', {id: 101});
          instance.list_value = [{id: 100}];
          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(false);
        });
        it('for "is" condition', function () {
          permissions.create = {
            UserRole: {
              contexts: [101],
              conditions: {
                '101': [{
                  condition: 'is',
                  terms: {
                    value: 'good_value',
                    property_name: 'mockProperty',
                  },
                }],
              },
            },
          };

          instance = fakeUserRoleCreator();
          instance.attr('context', {id: 101});
          instance.mockProperty = 'bad_value';

          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(false);
        });
        it('for "in" condition', function () {
          permissions.create = {
            UserRole: {
              contexts: [101],
              conditions: {
                '101': [{
                  condition: 'in',
                  terms: {
                    value: [1, 2, 3],
                    property_name: 'mockProperty',
                  },
                }],
              },
            },
          };

          instance = fakeUserRoleCreator();
          instance.attr('context', {id: 101});
          instance.mockProperty = 4;

          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(false);
        });
        it('for "forbid" condition', function () {
          permissions.create = {
            UserRole: {
              contexts: [101],
              conditions: {
                '101': [{
                  condition: 'forbid',
                  terms: {
                    blacklist: {
                      create: [
                        'bad_instance',
                      ],
                    },
                  },
                }],
              },
            },
          };

          instance = fakeUserRoleCreator();
          instance.attr('context', {id: 101});
          instance.attr('type', 'bad_instance');

          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(false);
        });
      });
      describe('returns true if there is permission ' +
      'and conditions are matched', function () {
        it('for "contains" condition', function () {
          permissions.create = {
            UserRole: {
              contexts: [101],
              conditions: {
                '101': [{
                  condition: 'contains',
                  terms: {
                    value: {id: 0},
                    list_property: 'list_value',
                  },
                }],
              },
            },
          };
          instance = fakeUserRoleCreator();
          instance.attr('context', {id: 101});
          instance.list_value = [{id: 0}];
          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(true);
        });
        it('for "is" condition', function () {
          permissions.create = {
            UserRole: {
              contexts: [101],
              conditions: {
                '101': [{
                  condition: 'is',
                  terms: {
                    value: 'mockValue',
                    property_name: 'property_value',
                  },
                }],
              },
            },
          };

          instance = fakeUserRoleCreator();
          instance.attr('context', {id: 101});
          instance.attr('property_value', 'mockValue');

          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(true);
        });
        it('for complex "is" condition', function () {
          permissions.create = {
            UserRole: {
              contexts: [101],
              conditions: {
                '101': [{
                  condition: 'is',
                  terms: {
                    value: 'mockValue',
                    property_name: 'container.property_value',
                  },
                }],
              },
            },
          };

          instance = fakeUserRoleCreator();
          instance.attr('context', {id: 101});
          instance.attr('container', {
            property_value: 'mockValue',
          });

          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(true);
        });
        it('for "in" condition', function () {
          permissions.create = {
            UserRole: {
              contexts: [101],
              conditions: {
                '101': [{
                  condition: 'in',
                  terms: {
                    value: ['mockValue', 1, 2],
                    property_name: 'property_value',
                  },
                }],
              },
            },
          };

          instance = fakeUserRoleCreator();
          instance.attr('context', {id: 101});
          instance.property_value = 'mockValue';

          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(true);
        });
        it('for "forbid" condition', function () {
          permissions.create = {
            UserRole: {
              contexts: [101],
              conditions: {
                '101': [{
                  condition: 'forbid',
                  terms: {
                    blacklist: {
                      create: [
                        'bad_instance',
                      ],
                    },
                  },
                }],
              },
            },
          };

          instance = fakeUserRoleCreator();
          instance.attr('context', {id: 101});
          instance.attr('type', 'UserRole');

          result = Permission._is_allowed_for(permissions, instance, 'create');
          expect(result).toEqual(true);
        });
      });
    });

    describe('for null context conditions', function () {
      it('returns false when condition not matched', function () {
        permissions.create = {
          Audit: {
            contexts: [null],
            conditions: {
              'null': [{
                condition: 'contains',
                terms: {
                  value: {id: 0},
                  list_property: 'list_value',
                },
              }],
            },
          },
        };
        instance = makeFakeInstance({model: Audit})();
        instance.attr('context', {id: 101});
        instance.list_value = [{id: 100}];
        result = Permission._is_allowed_for(permissions, instance, 'create');
        expect(result).toEqual(false);
      });
      it('returns true when condition matched', function () {
        permissions.create = {
          Audit: {
            contexts: [null],
            conditions: {
              'null': [{
                condition: 'contains',
                terms: {
                  value: {id: 0},
                  list_property: 'list_value',
                },
              }],
            },
          },
        };
        instance = makeFakeInstance({model: Audit})();
        instance.attr('context', {id: 101});
        instance.list_value = [{id: 0}];
        result = Permission._is_allowed_for(permissions, instance, 'create');
        expect(result).toEqual(true);
      });
    });
  });

  describe('is_allowed() method', function () {
    let object;

    beforeEach(function () {
      object = {
        action: 'create',
        resource_type: 'UserRole',
        context_id: 1,
      };

      spyOn(Permission, '_is_allowed').and.returnValue(object);
    });
    it('delegates the check to the _is_allowed() method', function () {
      let _isAllowedResult = Permission._is_allowed();
      let isAllowedResult = Permission.is_allowed('create', 'UserRole', 1);

      expect(isAllowedResult).toBe(_isAllowedResult);
      expect(Permission._is_allowed)
        .toHaveBeenCalledWith(
          GGRC.permissions,
          jasmine.objectContaining(object)
        );
    });
  });

  describe('is_allowed_for() method', function () {
    let object;

    beforeEach(function () {
      object = {};
      spyOn(Permission, '_is_allowed_for').and.returnValue(object);
    });
    it('delegates the check to the _is_allowed_for() method', function () {
      let _isAllowedForResult = Permission._is_allowed_for();
      let isAllowedForResult = Permission.is_allowed_for('create', 'UserRole');

      expect(isAllowedForResult).toBe(_isAllowedForResult);
      expect(Permission._is_allowed_for)
        .toHaveBeenCalledWith(GGRC.permissions, 'UserRole', 'create');
    });
  });

  describe('is_allowed_any() method', function () {
    it('returns true if it is allowed with null context', function () {
      GGRC.permissions.read.Program = {
        contexts: [null],
      };
      expect(Permission.is_allowed_any('read', 'Program'))
        .toEqual(true);
    });
    it('returns true if there is at least one allowed context', function () {
      GGRC.permissions.read.Program = {
        contexts: [1],
      };
      expect(Permission.is_allowed_any('read', 'Program'))
        .toEqual(true);
    });
    it('returns false if there is no allowed context', function () {
      GGRC.permissions.read.Program = {
        contexts: [],
      };
      expect(Permission.is_allowed_any('read', 'Program'))
        .toEqual(false);
    });
  });

  describe('page_context_id() method', function () {
    it('return page instance context id', function () {
      let context = {
        id: 711,
      };
      spyOn(CurrentPageUtils, 'getPageInstance')
        .and.returnValue({context: context});
      expect(Permission.page_context_id()).toEqual(context.id);
    });
    it('return null if page instance context is undefined', function () {
      expect(Permission.page_context_id()).toEqual(null);
    });
  });

  describe('refresh() method', function () {
    let GGRC_PERMISSIONS;

    beforeAll(function () {
      GGRC_PERMISSIONS = GGRC.permissions;
    });
    beforeEach(function () {
      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValue(new $.Deferred().resolve('permissions'));
    });
    afterEach(function () {
      GGRC.permissions = GGRC_PERMISSIONS;
    });
    it('updates permissions', function (done) {
      Permission.refresh().then(() => {
        expect(GGRC.permissions).toEqual('permissions');
        done();
      });
    });
  });
});
