# Copyright (C) 2020 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""
  List of objects that support GET /obj_name/obj_id
  and search api filter saving.
"""

from ggrc.models import all_models


CONTRIBUTED_OBJECTS = [
    all_models.AccessGroup,
    all_models.AccountBalance,
    all_models.Assessment,
    all_models.AssessmentTemplate,
    all_models.Audit,
    all_models.Contract,
    all_models.Control,
    all_models.DataAsset,
    all_models.Document,
    all_models.Evidence,
    all_models.Facility,
    all_models.Issue,
    all_models.Market,
    all_models.Objective,
    all_models.OrgGroup,
    all_models.Person,
    all_models.Policy,
    all_models.Process,
    all_models.Product,
    all_models.Program,
    all_models.Project,
    all_models.Regulation,
    all_models.Requirement,
    all_models.Risk,
    all_models.Snapshot,
    all_models.Standard,
    all_models.System,
    all_models.TechnologyEnvironment,
    all_models.Threat,
    all_models.Vendor,
    all_models.Metric,
    all_models.ProductGroup,
    all_models.KeyReport,
]
