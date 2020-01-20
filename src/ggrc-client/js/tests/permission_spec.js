/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import * as AjaxExtensions from '../plugins/ajax-extensions';
import * as Permission from '../permission';
import {makeFakeInstance} from '../../js_specs/spec-helpers';
import UserRole from '../models/service-models/user-role';
import Audit from '../models/business-models/audit';
import {getInstance} from '../plugins/utils/models-utils';

describe('Permission', function () {
  describe('_adminPermissionForContext() method', function () {
    it('returns new admin permission for specified context_id',
      function () {
        let result = Permission._adminPermissionForContext(23);
        expect(result.action).toEqual('__GGRC_ADMIN__');
        expect(result.resource_type).toEqual('__GGRC_ALL__');
        expect(result.context_id).toEqual(23);
      });
  });

  describe('_allResourcePermission() method', function () {
    let permission;

    beforeEach(function () {
      permission = {
        action: 'create',
        context_id: '111',
      };
    });
    it('returns new all resource permission', function () {
      let result = Permission._allResourcePermission(permission);
      expect(result.action).toEqual(permission.action);
      expect(result.resource_type).toEqual('__GGRC_ALL__');
      expect(result.context_id).toEqual(permission.context_id);
    });
  });

  describe('_permissionMatch() method', function () {
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
        expect(Permission._permissionMatch(permissions, permission))
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

        permissionCollection.forEach((permission) => {
          expect(Permission._permissionMatch(permissions, permission))
            .toEqual(false);
        });
      });
  });

  describe('_isAllowed() method', function () {
    let permissions;
    let permission;

    beforeEach(function () {
      permissions = {};
    });
    it('returns false if permissions is undefined', function () {
      expect(Permission._isAllowed()).toEqual(false);
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
      expect(Permission._isAllowed(permissions, permission)).toEqual(true);
    });
    it('returns true if admin permission is matched', function () {
      permission = {};
      permissions.__GGRC_ADMIN__ = {
        __GGRC_ALL__: {
          contexts: [0],
        },
      };
      expect(Permission._isAllowed(permissions, permission)).toEqual(true);
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
      expect(Permission._isAllowed(permissions, permission)).toEqual(true);
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
      expect(Permission._isAllowed(permissions, permission)).toEqual(true);
    });
    it('returns false if permission is not matched', function () {
      permission = {
        action: 'delete',
        resource_type: 'Audit',
        context_id: 321,
      };
      expect(Permission._isAllowed(permissions, permission)).toEqual(false);
    });
  });

  describe('_resolvePermissionVariable', function () {
    let value;

    it('returns "value" if its type is not string', function () {
      value = {};
      expect(Permission._resolvePermissionVariable(value)).toBe(value);
    });
    it('returns "value" if its type string and first symbol is not "$"',
      function () {
        value = 'mock';
        expect(Permission._resolvePermissionVariable(value)).toEqual(value);
      });
    it('returns current user instance ' +
    'if value is equal to "$current_user"', function () {
      let currentUser = getInstance('Person', GGRC.current_user.id);
      value = '$current_user';
      expect(Permission._resolvePermissionVariable(value))
        .toEqual(currentUser);
    });
    it('throws error if value is not equal to "$current_user"' +
    ' but its first symbol is "$"', function () {
      let foo = function () {
        value = '$user';
        Permission._resolvePermissionVariable(value);
      };
      expect(foo).toThrow(jasmine.any(Error));
    });
  });

  describe('_isAllowedFor() method', function () {
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
        result = Permission._isAllowedFor(permissions, instance, 'create');
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
          result = Permission._isAllowedFor(permissions, instance, 'create');
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
          result = Permission._isAllowedFor(permissions, instance, 'create');
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
        result = Permission._isAllowedFor(permissions, instance, 'create');
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
        result = Permission._isAllowedFor(permissions, instance, 'create');
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
          result = Permission._isAllowedFor(permissions, instance, 'create');
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

          result = Permission._isAllowedFor(permissions, instance, 'create');
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

          result = Permission._isAllowedFor(permissions, instance, 'create');
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

          result = Permission._isAllowedFor(permissions, instance, 'create');
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
          result = Permission._isAllowedFor(permissions, instance, 'create');
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

          result = Permission._isAllowedFor(permissions, instance, 'create');
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

          result = Permission._isAllowedFor(permissions, instance, 'create');
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

          result = Permission._isAllowedFor(permissions, instance, 'create');
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

          result = Permission._isAllowedFor(permissions, instance, 'create');
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
        result = Permission._isAllowedFor(permissions, instance, 'create');
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
        result = Permission._isAllowedFor(permissions, instance, 'create');
        expect(result).toEqual(true);
      });
    });
  });

  describe('is_allowed() method', function () {
    it('returns false if permission is not matched', function () {
      let isAllowedResult = Permission.isAllowed('create', 'UserRole', 1);
      expect(isAllowedResult).toBe(false);
    });
  });

  describe('isAllowedFor() method', function () {
    it('returns false if there is permission with no conditions', function () {
      let isAllowedForResult = Permission.isAllowedFor('create', 'UserRole');
      expect(isAllowedForResult).toBe(false);
    });
  });

  describe('isAllowedAny() method', function () {
    it('returns true if it is allowed with null context', function () {
      GGRC.permissions.read.Program = {
        contexts: [null],
      };
      expect(Permission.isAllowedAny('read', 'Program'))
        .toEqual(true);
    });
    it('returns true if there is at least one allowed context', function () {
      GGRC.permissions.read.Program = {
        contexts: [1],
      };
      expect(Permission.isAllowedAny('read', 'Program'))
        .toEqual(true);
    });
    it('returns false if there is no allowed context', function () {
      GGRC.permissions.read.Program = {
        contexts: [],
      };
      expect(Permission.isAllowedAny('read', 'Program'))
        .toEqual(false);
    });
  });

  describe('refreshPermissions() method', function () {
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
      Permission.refreshPermissions().then(() => {
        expect(GGRC.permissions).toEqual('permissions');
        done();
      });
    });
  });
});
