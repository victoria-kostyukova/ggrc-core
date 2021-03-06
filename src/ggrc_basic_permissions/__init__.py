# Copyright (C) 2018 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""RBAC module"""

import cPickle
import datetime
import itertools
import zlib
import logging

import flask
import sqlalchemy as sa
from sqlalchemy import orm


from ggrc import db
from ggrc import settings
from ggrc.login import is_external_app_user
from ggrc.login import get_current_user
from ggrc.models import all_models

from ggrc.access_control.roleable import Roleable
from ggrc.models.audit import Audit
from ggrc.models.program import Program
from ggrc.rbac import permissions as rbac_permissions
from ggrc.rbac.permissions_provider import DefaultUserPermissions
from ggrc.cache import utils as cache_utils
from ggrc.services import signals
from ggrc.services.registry import service
from ggrc.utils import benchmark
from ggrc_basic_permissions.contributed_roles import BasicRoleDeclarations
from ggrc_basic_permissions.converters.handlers import COLUMN_HANDLERS
from ggrc_basic_permissions.models import Role
from ggrc_basic_permissions.models import UserRole


logger = logging.getLogger(__name__)


blueprint = flask.Blueprint(
    'permissions',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/ggrc_basic_permissions',
)

PERMISSION_CACHE_TIMEOUT = 3600  # 60 minutes


def get_public_config(_):
  """Expose additional permissions-dependent config to client.
    Specifically here, expose GGRC_BOOTSTRAP_ADMIN values to ADMIN users.
  """
  public_config = {}
  if rbac_permissions.is_admin():
    if hasattr(settings, 'BOOTSTRAP_ADMIN_USERS'):
      public_config['BOOTSTRAP_ADMIN_USERS'] = settings.BOOTSTRAP_ADMIN_USERS
  return public_config


class CompletePermissionsProvider(object):
  """Permission provider set in the USER_PERMISSIONS_PROVIDER setting"""

  def __init__(self, _):
    pass

  def permissions_for(self, _):
    """Load user permissions and make sure they get loaded into session"""
    ret = UserPermissions()
    # force the permissions to be loaded into session, otherwise templates
    # that depend on the permissions being available in session may assert
    # the user has no permissions!
    ret.check_permissions()
    return ret

  def handle_admin_user(self, user):
    pass


class UserPermissions(DefaultUserPermissions):
  """User permissions cached in the global session object"""

  @property
  def _request_permissions(self):
    return getattr(flask.g, '_request_permissions', None)

  @_request_permissions.setter
  def _request_permissions(self, value):
    setattr(flask.g, '_request_permissions', value)

  def _permissions(self):
    self.check_permissions()
    return self._request_permissions

  def check_permissions(self):
    if not self._request_permissions:
      self.load_permissions()

  def get_email_for(self, user):
    return user.email if hasattr(user, 'email') else 'ANONYMOUS'

  def load_permissions(self):
    """Load permissions for the currently logged in user"""
    user = get_current_user(use_external_user=False)
    email = self.get_email_for(user)
    self._request_permissions = {}
    self._request_permissions['__user'] = email
    if user is None or user.is_anonymous():
      self._request_permissions = {}
    else:
      with benchmark('load_permissions'):
        self._request_permissions = load_permissions_for(user)


def collect_permissions(src_permissions, context_id, permissions):
  for action, resource_permissions in src_permissions.items():
    if not resource_permissions:
      permissions.setdefault(action, dict())
    for resource_permission in resource_permissions:
      if type(resource_permission) in [str, unicode]:
        resource_type = str(resource_permission)
        condition = None
      else:
        resource_type = str(resource_permission['type'])
        condition = resource_permission.get('condition', None)
        terms = resource_permission.get('terms', [])
      permissions.setdefault(action, {})\
          .setdefault(resource_type, dict())\
          .setdefault('contexts', list())
      if context_id is not None:
        permissions[action][resource_type]['contexts'].append(context_id)
      elif condition in (None, "forbid"):
        permissions[action][resource_type]['contexts'].append(context_id)
      if condition:
        permissions[action][resource_type]\
            .setdefault('conditions', dict())\
            .setdefault(context_id, list())\
            .append({
                'condition': condition,
                'terms': terms,
            })


def query_memcache(key):
  """Check if cached permissions are available

  Args:
      key (string): key of the stored permissions
  Returns:
      cache (memcache_client): memcache client or None if caching
                               is not available
      permissions_cache (dict): dict with all permissions or None if there
                                was a cache miss
  """
  if not getattr(settings, 'MEMCACHE_MECHANISM', False):
    return None, None

  cache = cache_utils.get_cache_manager().cache_object.memcache_client
  cached_keys_set = cache.get('permissions:list') or set()
  if key not in cached_keys_set:
    # We set the permissions:list variable so that we are able to batch
    # remove all permissions related keys from memcache
    cached_keys_set.add(key)
    cache.set('permissions:list', cached_keys_set, PERMISSION_CACHE_TIMEOUT)
    return cache, None

  permissions_data = cache.get(key)
  if permissions_data:
    # permissions_cache is stored in compressed state,
    # need to decompress it before using
    permissions_cache = cPickle.loads(zlib.decompress(permissions_data))
    # If the key is both in permissions:list and in memcache itself
    # it is safe to return the cached permissions
    return cache, permissions_cache
  return cache, None


def load_default_permissions(permissions):
  """Load default permissions for all users

  Args:
      permissions (dict): dict where the permissions will be stored
  Returns:
      None
  """
  default_permissions = {
      "read": [
          "CustomAttributeDefinition",
          {
              "type": "CustomAttributeValue",
              "terms": {
                  "list_property": "owners",
                  "value": "$current_user"
              },
              "condition": "contains"
          },
          {
              "type": "NotificationConfig",
              "terms": {
                  "property_name": "person",
                  "value": "$current_user"
              },
              "condition": "is"
          },
      ],
      "create": [
          {
              "type": "NotificationConfig",
              "terms": {
                  "property_name": "person",
                  "value": "$current_user"
              },
              "condition": "is"
          },
      ],
      "update": [
          {
              "type": "NotificationConfig",
              "terms": {
                  "property_name": "person",
                  "value": "$current_user"
              },
              "condition": "is"
          },
      ]
  }
  collect_permissions(default_permissions, None, permissions)


def load_bootstrap_admin(user, permissions):
  """Add bootstrap admin permissions if user is in BOOTSTRAP_ADMIN_USERS

  Args:
      user (Person): Person object
      permissions (dict): dict where the permissions will be stored
  Returns:
      None
  """
  # Add `ADMIN_PERMISSION` for "bootstrap admin" users
  if hasattr(settings, 'BOOTSTRAP_ADMIN_USERS') \
     and user.email in settings.BOOTSTRAP_ADMIN_USERS:
    admin_permissions = {
        DefaultUserPermissions.ADMIN_PERMISSION.action: [
            DefaultUserPermissions.ADMIN_PERMISSION.resource_type
        ]
    }
    collect_permissions(
        admin_permissions,
        DefaultUserPermissions.ADMIN_PERMISSION.context_id,
        permissions)


def load_external_app_permissions(permissions):
  """Adds external application permissions if user is EXTERNAL_APP_USER.

  Args:
      permissions (dict): dict where the permissions will be stored
  Returns:
      None
  """
  # Add `ADMIN_PERMISSION` for "external application" users
  if is_external_app_user():
    admin_permissions = {
        DefaultUserPermissions.ADMIN_PERMISSION.action: [
            DefaultUserPermissions.ADMIN_PERMISSION.resource_type
        ]
    }
    collect_permissions(
        admin_permissions,
        DefaultUserPermissions.ADMIN_PERMISSION.context_id,
        permissions)


def load_user_roles(user, permissions):
  """Load all user roles for user

  Args:
      user (Person): Person object
      permissions (dict): dict where the permissions will be stored
  Returns:
      source_contexts_to_rolenames (dict): Role names for contexts
  """
  # Add permissions from all DB-managed roles
  user_roles = db.session.query(UserRole)\
      .options(
          orm.undefer_group('UserRole_complete'),
          orm.undefer_group('Role_complete'),
          orm.joinedload('role'))\
      .filter(UserRole.person_id == user.id)\
      .order_by(UserRole.updated_at.desc())\
      .all()

  source_contexts_to_rolenames = {}
  for user_role in user_roles:
    source_contexts_to_rolenames.setdefault(
        user_role.context_id, list()).append(user_role.role.name)
    if isinstance(user_role.role.permissions, dict):
      collect_permissions(
          user_role.role.permissions, user_role.context_id, permissions)


def load_personal_context(user, permissions):
  """Load personal context for user

  Args:
      user (Person): Person object
      permissions (dict): dict where the permissions will be stored
  Returns:
      None
  """
  personal_context = _get_or_create_personal_context(user)

  permissions.setdefault('__GGRC_ADMIN__', {})\
      .setdefault('__GGRC_ALL__', dict())\
      .setdefault('contexts', list())\
      .append(personal_context.id)


def _get_acl_filter(acl_model):
  """Get filter for acl entries.

  This creates a filter to select only acl entries for objects that were
  specified in the request json.

  If this filter is used we must not store the results of the permissions dict
  into memcache.

  Returns:
    list of filter statements.
  """
  stubs = getattr(flask.g, "referenced_object_stubs", None)
  if stubs is None:
    logger.warning("Using full permissions query")
    return [
        acl_model.object_type != all_models.Relationship.__name__,
    ]

  roleable_models = {m.__name__ for m in all_models.all_models
                     if issubclass(m, Roleable)}
  keys = [
      (type_, id_)
      for type_, ids in stubs.iteritems()
      for id_ in ids
      if type_ in roleable_models
  ]
  if not keys:
    return [
        sa.false()
    ]
  return [
      sa.tuple_(
          acl_model.object_type,
          acl_model.object_id,
      ).in_(
          keys,
      )
  ]


def load_access_control_list(user, permissions):
  """Load permissions from access_control_list"""
  acl_base = db.aliased(all_models.AccessControlList, name="acl_base")
  acl_propagated = db.aliased(all_models.AccessControlList,
                              name="acl_propagated")
  acr = all_models.AccessControlRole
  acp = all_models.AccessControlPerson
  additional_filters = _get_acl_filter(acl_propagated)
  access_control_list = db.session.query(
      acl_propagated.object_type,
      acl_propagated.object_id,
      acr.read,
      acr.update,
      acr.delete,
  ).filter(
      sa.and_(
          acp.person_id == user.id,
          acp.ac_list_id == acl_base.id,
          acl_base.id == acl_propagated.base_id,
          acl_propagated.ac_role_id == acr.id,
          *additional_filters
      )
  )

  for object_type, object_id, read, update, delete in access_control_list:
    actions = (("read", read), ("update", update), ("delete", delete))
    for action, allowed in actions:
      if not allowed:
        continue
      permissions.setdefault(action, {})\
          .setdefault(object_type, {})\
          .setdefault('resources', set())\
          .add(object_id)


def store_results_into_memcache(permissions, cache, key):
  """Load personal context for user

  Args:
      permissions (dict): dict where the permissions will be stored
      cache (cache_manager): Cache manager that should be used for storing
                             permissions
      key (string): key of under which permissions should be stored
  Returns:
      None
  """
  if cache is None:
    return

  cached_keys_set = cache.get('permissions:list') or set()
  if key in cached_keys_set:
    # Size of permissions dict can be too big for memcache (> 1 Mb),
    # so compressed dict will be stored.
    compressed_permissions = zlib.compress(cPickle.dumps(permissions))

    # We only add the permissions to the cache if the
    # key still exists in the permissions:list after
    # the query has executed.
    cache.set(key, compressed_permissions, PERMISSION_CACHE_TIMEOUT)


def load_permissions_for(user):
  """Permissions is dictionary that can be exported to json to share with
  clients. Structure is:
  ..

    permissions[action][resource_type][contexts]
                                      [conditions][context][context_conditions]

  'action' is one of 'create', 'read', 'update', 'delete'.
  'resource_type' is the name of a valid GGRC resource type.
  'contexts' is a list of context_id where the action is allowed.
  'conditions' is a dictionary of 'context_conditions' indexed by 'context'
    where 'context' is a context_id.
  'context_conditions' is a list of dictionaries with 'condition' and 'terms'
    keys.
  'condition' is the string name of a conditional operator, such as 'contains'.
  'terms' are the arguments to the 'condition'.
  """
  permissions = {}
  key = 'permissions:{}'.format(user.id)

  with benchmark("load_permissions > query memcache"):
    cache, result = query_memcache(key)
    if result:
      return result

  with benchmark("load_permissions > load default permissions"):
    load_default_permissions(permissions)

  with benchmark("load_permissions > load bootstrap admins"):
    load_bootstrap_admin(user, permissions)

  with benchmark("load_permissions > load external app permissions"):
    load_external_app_permissions(permissions)

  with benchmark("load_permissions > load user roles"):
    load_user_roles(user, permissions)

  with benchmark("load_permissions > load personal context"):
    load_personal_context(user, permissions)

  with benchmark("load_permissions > load access control list"):
    load_access_control_list(user, permissions)

  if not hasattr(flask.g, "referenced_object_stubs"):
    # In some cases for optimization we only load a small chunk of permissions
    # and in that case we can not cache the value because it might not contain
    # the permissions information for any subsequent request.
    with benchmark("load_permissions > store results into memcache"):
      store_results_into_memcache(permissions, cache, key)

  return permissions


def _get_or_create_personal_context(user):
  personal_context = user.get_or_create_object_context(
      context=1,
      name='Personal Context for {0}'.format(user.id),
      description='')
  return personal_context


@signals.Restful.model_posted.connect_via(Program)
def handle_program_post(sender, obj=None, src=None, service=None):
  db.session.flush()
  # get the personal context for this logged in user
  user = get_current_user(use_external_user=False)
  personal_context = _get_or_create_personal_context(user)
  context = obj.build_object_context(
      context=personal_context,
      name='{object_type} Context {timestamp}'.format(
          object_type=service.model.__name__,
          timestamp=datetime.datetime.utcnow()),
      description='',
  )
  context.modified_by = get_current_user()

  db.session.add(obj)
  db.session.flush()
  db.session.add(context)
  db.session.flush()
  obj.contexts.append(context)
  obj.context = context
  db.session.flush()


def create_audit_context(audit):
  # Create an audit context
  context = audit.build_object_context(
      context=audit.context,
      name='Audit Context {timestamp}'.format(
          timestamp=datetime.datetime.utcnow()),
      description='',
  )
  context.modified_by = get_current_user()
  db.session.add(context)

  db.session.flush()

  db.session.add(audit)

  db.session.flush()

  audit.context = context


@signals.Restful.collection_posted.connect_via(Audit)
def handle_audit_post(sender, objects=None, sources=None):
  for obj, src in itertools.izip(objects, sources):
    if not src.get("operation", None):
      db.session.flush()
      create_audit_context(obj)


@signals.Restful.model_deleted.connect
def handle_resource_deleted(sender, obj=None, service=None):
  if obj.context \
     and obj.context.related_object_id \
     and obj.id == obj.context.related_object_id \
     and obj.__class__.__name__ == obj.context.related_object_type:
    db.session.query(UserRole) \
        .filter(UserRole.context_id == obj.context_id) \
        .delete()


def contributed_services():
  """The list of all collections provided by this extension."""
  return [
      service('roles', Role),
      service('user_roles', UserRole),
  ]


def contributed_object_views():
  from ggrc.views.registry import object_view
  return [
      object_view(Role)
  ]


def contributed_column_handlers():
  return COLUMN_HANDLERS


ROLE_DECLARATIONS = BasicRoleDeclarations()
