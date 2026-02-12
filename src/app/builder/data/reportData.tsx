import { FieldItem } from './workflowData';

// Use the same FieldItem interface from workflowData
export type ReportFieldItem = FieldItem;

export interface TableConfig {
    contentAddAble: boolean;
    contentEditAble: boolean;
    contentDeleteAble: boolean;
    contetExportAble: boolean;
    contentImportAble: boolean;
    fieldDeleteAble: boolean;
    fieldEditAble: boolean;
    fieldAddAble: boolean;
    rowHeight: number;
    createAt: boolean;
    withTitle: boolean;
    contentFilterByCreatedAtRangeAble: boolean;
    filterByMonth: boolean;
    filterByYear: boolean;
}

export interface ReportData {
    _id: string;
    key: string;
    fields: ReportFieldItem[];
    triggers: string[];
    triggerExclusives: string[];
    defaultFilter: string[];
    name: string;
    order: number;
    showBtns: string[];
    groups: string[];
    filterKeys: string[];
    _vsb: string;
    description: string;
    accessibleForDistinct: boolean;
    isHidden: boolean;
    tableConfig: TableConfig;
    clickable: boolean;
    _class: string;
}

// Template function to create new report
export const createNewReportTemplate = (): ReportData => {
    const currentTime = new Date().toISOString();
    const randomId = Math.random().toString(36).substr(2, 9);

    return {
        _id: `report_${randomId}`,
        key: `new_report_${randomId}`,
        fields: [],
        triggers: [],
        triggerExclusives: [],
        defaultFilter: [],
        name: "New Report",
        order: 1,
        showBtns: ["add", "edit", "delete", "export"],
        groups: [],
        filterKeys: [],
        _vsb: "visible",
        description: "Auto-generated report template",
        accessibleForDistinct: true,
        isHidden: false,
        tableConfig: {
            contentAddAble: true,
            contentEditAble: true,
            contentDeleteAble: true,
            contetExportAble: true,
            contentImportAble: true,
            fieldDeleteAble: true,
            fieldEditAble: true,
            fieldAddAble: true,
            rowHeight: 40,
            createAt: true,
            withTitle: true,
            contentFilterByCreatedAtRangeAble: true,
            filterByMonth: true,
            filterByYear: true
        },
        clickable: true,
        _class: "report-table"
    };
};
