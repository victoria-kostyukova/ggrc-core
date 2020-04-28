# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
"""REST service for Workflow objects (functions take entity objects)."""
from lib.app_entity import workflow_entity
from lib.constants import object_states
from lib.entities import cycle_entity_population
from lib.rest import rest_convert, base_rest_service


class WorkflowRestService(base_rest_service.ObjectRestService):
  """REST service for Workflow app entities."""
  app_entity_cls = workflow_entity.Workflow

  @staticmethod
  def _map_to_rest_for_create_obj(obj):
    """See superclass."""
    return dict(
        access_control_list=rest_convert.build_access_control_list(
            obj, acr_mapping={"wf_members": "Workflow Member"}),
        title=obj.title,
        status=obj.state,
        repeat_every=obj.repeat_every,
        unit=obj.repeat_unit,
        recurrences=obj.recurrences_started,
        context=rest_convert.default_context()
    )

  @staticmethod
  def _map_to_rest_specific_for_edit_obj(obj):
    """See superclass."""
    return dict(
        id=obj.obj_id,
        context=obj.rest_context,
        slug=obj.code,
        task_groups=[rest_convert.to_basic_rest_obj(task_group)
                     for task_group in obj.task_groups]
    )

  def activate(self, workflow):
    """Activates workflow."""
    workflow.state = object_states.ACTIVE
    if workflow.repeat_unit:
      workflow.recurrences_started = True
      self.edit(workflow)
    else:
      cycle = cycle_entity_population.create_workflow_cycle(workflow)
      WorkflowCycleRestService().create(cycle)


class TaskGroupRestService(base_rest_service.ObjectRestService):
  """REST service for TaskGroup app entities."""
  app_entity_cls = workflow_entity.TaskGroup

  @staticmethod
  def _map_to_rest_for_create_obj(obj):
    """See superclass."""
    return dict(
        contact=rest_convert.to_basic_rest_obj(obj.assignee),
        title=obj.title,
        workflow=rest_convert.to_basic_rest_obj(obj.workflow),
        context=obj.workflow.rest_context
    )


class TaskGroupTaskRestService(base_rest_service.ObjectRestService):
  """REST service for TaskGroupTask app entities."""
  app_entity_cls = workflow_entity.TaskGroupTask

  @staticmethod
  def _map_to_rest_for_create_obj(obj):
    """See superclass."""
    return dict(
        access_control_list=rest_convert.build_access_control_list(
            obj, acr_mapping={"assignees": "Task Assignees"}),
        title=obj.title,
        start_date=obj.start_date.isoformat(),
        end_date=obj.due_date.isoformat(),
        task_group=rest_convert.to_basic_rest_obj(obj.task_group),
        context=obj.task_group.rest_context
    )


class WorkflowCycleRestService(base_rest_service.ObjectRestService):
  """REST service for WorkflowCycle app entities."""
  app_entity_cls = workflow_entity.WorkflowCycle
  _obj_name = "cycle"

  @staticmethod
  def _map_to_rest_for_create_obj(obj):
    """See superclass."""
    return dict(
        title=obj.title,
        autogenerate=True,
        context=obj.rest_context,
        workflow=rest_convert.to_basic_rest_obj(obj.workflow)
    )
