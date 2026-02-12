import type { ReportData } from './reportData';

export const createNewReportTemplate = (): ReportData => {
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    _id: reportId,
    key: `report_${Date.now()}`,
    fields: [], // Empty array of FieldItem
    triggers: [],
    triggerExclusives: [],
    defaultFilter: [],
    name: 'New Report',
    order: 1,
    showBtns: [],
    groups: [],
    filterKeys: [],
    _vsb: 'ACTIVE',
    description: 'New Report Description',
    accessibleForDistinct: true,
    isHidden: false,
    tableConfig: {
      contentAddAble: false,
      contentEditAble: false,
      contentDeleteAble: false,
      contetExportAble: true,
      contentImportAble: true,
      fieldDeleteAble: false,
      fieldEditAble: false,
      fieldAddAble: false,
      rowHeight: 80.0,
      createAt: true,
      withTitle: false,
      contentFilterByCreatedAtRangeAble: true,
      filterByMonth: false,
      filterByYear: false
    },
    clickable: true,
    _class: 'biz.byonchat.v2.services.reports.Report'
  };
};
