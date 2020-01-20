# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Module with CalendarEventBuilder class."""

import logging

from sqlalchemy.orm import load_only
from sqlalchemy import orm

from ggrc import db
from ggrc import settings
from ggrc.models import all_models
from ggrc.gcalendar import utils
from ggrc.utils import benchmark, generate_query_chunks


logger = logging.getLogger(__name__)


# pylint: disable=too-few-public-methods
class CalendarEventBuilder(object):
  """Class with builder methods for CalendarEvent model."""

  TASK_DESCRIPTION_HEADER = u"You have following tasks due today:\n"
  TASK_DESCRIPTION_SUMMARY = (
      u"Please click on the link below to review "
      u"and take action on your task(s) due today:\n"
      u"<a href='{link}'>Link</a>")
  TASK_TITLE_TEMPLATE = u"{prefix}Your tasks are due today"

  def __init__(self):
    """Initialize CalendarEventBuilder."""
    self.events = []
    self.title_prefix = ""
    self.chunk_size = 1000
    if settings.NOTIFICATION_PREFIX:
      self.title_prefix = "[{}] ".format(settings.NOTIFICATION_PREFIX)

  def build_cycle_tasks(self):
    """Builds CalendarEvents based on CycleTaskGroupObjectTasks."""
    with benchmark("Pre-loading data."):
      self._preload_data()
    with benchmark("Generating of events for cycle tasks."):
      self._generate_events()
    with benchmark("Generating event descriptions"):
      self._generate_event_descriptions()
    db.session.commit()

  def _preload_data(self):
    """Preload data for Calendar Event generation."""
    self.events = all_models.CalendarEvent.query.all()

  def _generate_events(self):
    """Generates Calendar Events."""
    task_mappings = utils.get_related_mapping(
        left=all_models.CycleTaskGroupObjectTask,
        right=all_models.CalendarEvent
    )
    columns = all_models.CycleTaskGroupObjectTask.query.options(
        orm.joinedload("cycle").load_only(
            "workflow_id",
            "is_current",
            "is_verification_needed"
        ),
        orm.joinedload("cycle").joinedload("workflow").load_only(
            "unit",
            "recurrences",
            "next_cycle_start_date",
        ),
        orm.subqueryload(
            "_access_control_list"
        ).joinedload(
            "ac_role"
        ).undefer_group(
            "AccessControlRole_complete"
        ),
        orm.subqueryload(
            "_access_control_list"
        ).joinedload(
            "access_control_people"
        ).joinedload(
            "person"
        ).undefer_group(
            "Person_complete"
        ),
        load_only(
            all_models.CycleTaskGroupObjectTask.id,
            all_models.CycleTaskGroupObjectTask.end_date,
            all_models.CycleTaskGroupObjectTask.status,
            all_models.CycleTaskGroupObjectTask.title,
            all_models.CycleTaskGroupObjectTask.verified_date,
        ),
    ).order_by(all_models.CycleTaskGroupObjectTask.end_date)
    all_count = columns.count()
    handled = 0
    for query_chunk in generate_query_chunks(
        columns, chunk_size=self.chunk_size, needs_ordering=False
    ):
      handled += query_chunk.count()
      logger.info("Cycle task processed: %s/%s", handled, all_count)
      for task in query_chunk:
        events = task_mappings[task.id] if task.id in task_mappings else set()
        self._generate_events_for_task(task, events_ids=events)
      db.session.flush()

  def _generate_events_for_task(self, task, events_ids):
    """Generates CalendarEvents for CycleTaskGroupObjectTask."""
    try:
      if self._should_create_event_for(task):
        for person_id in self._get_task_persons_ids_to_notify(task):
          event = self._get_event_by_date_and_attendee(
              attendee_id=person_id,
              end_date=task.end_date
          )
          if not event:
            event = self._create_event_with_relationship(task, person_id)
            self.events.append(event)
          else:
            self._create_event_relationship(task, event)
            events_ids.discard(event.id)

      if self._should_delete_event_for(task):
        for event_id in events_ids:
          self._delete_event_relationship(event_id, task.id)
    except Exception as exp:   # pylint: disable=broad-except
      logger.exception("Generating of event for task %d has failed with the "
                       "following error %s.", task.id, exp.message)

  def _get_event_by_date_and_attendee(self, attendee_id, end_date):
    """Get calendar events by attendee and due date."""
    filtered_events = [
        event for event in self.events
        if event.attendee_id == attendee_id and
        event.due_date == end_date
    ]
    return filtered_events[0] if filtered_events else None

  @staticmethod
  def _get_task_persons_ids_to_notify(task):
    """Returns set of person ids for which calendar event should be created."""
    roles_to_notify = [u"Task Assignees", u"Task Secondary Assignees"]
    person_ids = []
    for role in roles_to_notify:
      person_ids.extend(task.get_person_ids_for_rolename(role))
    return set(person_ids)

  @staticmethod
  def _delete_event_relationship(event_id, task_id):
    """Deletes calendar event relationship to task."""
    relationship = utils.get_relationship(
        left_id=event_id,
        left_model_name="CalendarEvent",
        right_id=task_id,
        right_model_name="CycleTaskGroupObjectTask",
    )
    if relationship:
      db.session.delete(relationship)

  def _create_event_with_relationship(self, task, person_id):
    """Creates calendar event and relationship based on task and person id."""
    event = all_models.CalendarEvent(
        due_date=task.end_date,
        attendee_id=person_id,
        title=self.TASK_TITLE_TEMPLATE.format(prefix=self.title_prefix),
        modified_by_id=person_id,
    )
    db.session.add(event)
    db.session.add(all_models.Relationship(
        source=task,
        destination=event,
    ))
    return event

  @staticmethod
  def _create_event_relationship(task, event):
    """Creates event relationship if there is no relationship."""
    relationship = utils.get_relationship(
        left_id=event.id,
        left_model_name="CalendarEvent",
        right_id=task.id,
        right_model_name="CycleTaskGroupObjectTask",
    )
    if not relationship:
      db.session.add(all_models.Relationship(
          source=task,
          destination=event,
      ))

  @staticmethod
  def _should_create_event_for(task):
    """Determines should we create a Calendar Event for the task or not.

    Calendar events should NOT be created for:
    - deprecated cycle tasks.
    - verified cycle tasks (in case it has Verification flow).
    - finished cycle tasks (in case it has no Verification flow).
    - 'in progress' cycle tasks within a cycle that was ended
      (tasks are stored at 'History' tab).
    - overdue cycle tasks.
    - cycle tasks of the archived workflows.
    """

    conditions = [
        task.status in [task.DEPRECATED, task.VERIFIED],
        task.status == task.FINISHED and not task.is_verification_needed,
        task.is_in_history,
        task.is_overdue,
        task.workflow.workflow_archived,
    ]
    return not any(conditions)

  @staticmethod
  def _should_delete_event_for(task):
    """Determines should we delete a Calendar Event for the task or not.

    Calendar events should NOT be deleted for:
    - overdue cycle tasks
    - finished cycle tasks
    that does not satisfy any of these conditions:
        - cycle task is deprecated.
        - cycle task is verified (in case it has Verification flow).
        - cycle task is finished (in case it has no Verification flow).
        - cycle task is 'in progress' within a cycle that was ended
          (tasks are stored at 'History' tab).
        - cycle task is in archived workflow.
    """
    delete_conditions = [
        task.status in [task.DEPRECATED, task.VERIFIED],
        task.is_in_history,
        task.workflow.workflow_archived,
    ]
    not_delete_conditions = [
        task.status == task.FINISHED,
        task.is_overdue,
    ]
    return not any(not_delete_conditions) or any(delete_conditions)

  def _generate_event_descriptions(self):
    """Generates CalendarEvents descriptions."""
    event_mappings = utils.get_related_mapping(
        left=all_models.CalendarEvent,
        right=all_models.CycleTaskGroupObjectTask
    )
    events = db.session.query(all_models.CalendarEvent).options(
        load_only(
            all_models.CalendarEvent.id,
            all_models.CalendarEvent.description,
        )
    )

    for query_chunk in generate_query_chunks(
        events, chunk_size=self.chunk_size
    ):
      for event in query_chunk:
        if event.id not in event_mappings:
          continue
        self._generate_description_for_event(
            event,
            task_ids=event_mappings[event.id],
        )

  def _generate_description_for_event(self, event, task_ids):
    """Generates CalendarEvent descriptions based on tasks."""
    tasks = db.session.query(all_models.CycleTaskGroupObjectTask).filter(
        all_models.CycleTaskGroupObjectTask.id.in_(task_ids)
    ).order_by(all_models.CycleTaskGroupObjectTask.title).options(
        load_only(
            all_models.CycleTaskGroupObjectTask.id,
            all_models.CycleTaskGroupObjectTask.title,
        )
    ).all()

    titles = [u"- {}".format(unicode(task.title)) for task in tasks]

    event.description = (
        self.TASK_DESCRIPTION_HEADER +
        u"\n".join(titles) + u"\n" +
        self.TASK_DESCRIPTION_SUMMARY.format(
            link=utils.get_active_cycle_tasks_url(
                due_date=event.due_date.strftime('%m/%d/%Y')
            )
        )
    )
