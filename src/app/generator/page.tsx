"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Upload, FileSpreadsheet, Wand2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { WorkflowData, NodeItem, FieldItem, FieldType } from '../builder/data/workflowData'

interface ExcelRow {
    [key: string]: any;
}

export default function WorkflowGenerator() {
    const [file, setFile] = useState<File | null>(null)
    const [generatedWorkflow, setGeneratedWorkflow] = useState<WorkflowData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Download template Excel
    const downloadTemplate = () => {
        const templateData = [
            // Worksheet 1: Workflow Info
            {
                sheetName: 'WorkflowInfo',
                data: [
                    ['Property', 'Value', 'Description'],
                    ['workflow_id', 'workflowTemplate', 'Unique identifier for workflow'],
                    ['workflow_name', 'Workflow Template', 'Display name for workflow'],
                    ['notif_worker', '5', 'Number of notification workers'],
                    ['vsb_status', 'ACTIVE', 'Workflow visibility status (ACTIVE/INACTIVE)']
                ]
            },
            // Worksheet 2: Nodes - Based on sidebar template
            {
                sheetName: 'Nodes',
                data: [
                    [
                        'node_id', 'node_name', 'node_type', 'icon_url', 'order',
                        'show_btns', 'hide_for_cms', 'loc_title', 'submit_type',
                        'groups', 'loc_required', 'loc_preview'
                    ],
                    [
                        'form1', 'Nodes Form', 'FORM', 'https://ldap.byonchat2.com/iconsolo/barang_masuk/permintaan_pesanan.PNG', '1',
                        'CREATE_TASK', 'true', 'Nodes Form', 'SUBMIT',
                        'teknisi', 'false', 'false'
                    ],
                    [
                        'form2', 'Data Verification', 'VALIDATION', 'https://ldap.byonchat2.com/iconsolo/barang_masuk/permintaan_pesanan.PNG', '2',
                        'APPROVE,REJECT', 'false', 'Data Verification', 'APPROVE',
                        'admin', 'false', 'true'
                    ]
                ]
            },
            // Worksheet 3: Fields - Based on sidebar template
            {
                sheetName: 'Fields',
                data: [
                    [
                        'node_id', 'field_key', 'field_label', 'field_type', 'is_required',
                        'is_visible', 'is_disabled', 'placeholder', 'order', 'options',
                        'min_value', 'max_value', 'decimal_count', 'default_value', 'description',
                        'report_type', 'collection', 'search_key', 'aggregate_show', 'pickers',
                        'show_format', 'submit_format', 'decode_format', 'need_fill', 'item_addable',
                        'item_deletable', 'item_editable', 'dir'
                    ],
                    // Node form1 fields - comprehensive field examples from sidebar
                    [
                        'form1', 'text', 'Text Field', 'TEXT', 'true',
                        'true', 'false', '', '1', '',
                        '', '', '', '', 'Basic text input field',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'textArea', 'Text Area', 'TEXT_AREA', 'true',
                        'true', 'false', 'keterangan', '2', '',
                        '', '', '', '', 'Multi-line text area',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'phoneNumber', 'Phone Number', 'PHONENUMBER', 'true',
                        'true', 'false', '', '3', '',
                        '', '', '', '', 'Phone number input',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'decimal', 'Decimal', 'DECIMAL', 'true',
                        'true', 'false', '', '4', '',
                        '', '', '2', '', 'Decimal number field',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'number', 'Number Field', 'NUMBER', 'true',
                        'true', 'false', '', '5', '',
                        '', '', '', '', 'Integer number field',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'currency', 'Currency', 'CURRENCY', 'true',
                        'true', 'false', '', '6', '',
                        '', '', '', '', 'Currency amount field',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'checkboxOps', 'Checkbox Opsi', 'CHECKBOX', 'true',
                        'true', 'false', '', '7', 'Option 1,Option 2',
                        '', '', '', '', 'Checkbox with options',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'checkbox', 'Checkbox Masterdata', 'CHECKBOX', 'true',
                        'true', 'false', '', '8', '',
                        '', '', '', '', 'Checkbox with masterdata',
                        'masterdata', 'mdKaryawan', 'nama_lengkap', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'dropdownMd', 'Dropdown Masterdata', 'DROPDOWN', 'true',
                        'true', 'false', '', '9', '',
                        '', '', '', '', 'Dropdown with masterdata',
                        'masterdata', 'mdKaryawan', 'department', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'dropdownOps', 'Dropdown Options', 'DROPDOWN', 'true',
                        'true', 'false', '--Please Select--', '10', 'Option 1,Option 2',
                        '', '', '', '', 'Dropdown with options',
                        '', '', '', 'true', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'radio_ops', 'Radio Opsi', 'RADIO', 'true',
                        'true', 'false', '', '11', 'BULANAN,HARIAN',
                        '', '', '', '', 'Radio button with options',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'radio_md', 'Radio MasterData', 'RADIO', 'true',
                        'true', 'false', '', '12', '',
                        '', '', '', '', 'Radio button with masterdata',
                        'masterdata', 'mdKaryawan', 'department', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'datetime', 'Datetime (Date)', 'DATETIME', 'true',
                        'true', 'false', '', '13', '',
                        '${DATETIME|-1.0.0.0.0.0|yyyy-MM-dd}', '${DATETIME|1.0.0.0.0.0|yyyy-MM-dd}', '', '', 'Date picker field',
                        '', '', '', '', 'DATE',
                        'dd-MMM-yyyy', 'yyyy-MM-dd', 'yyyy-MM-dd', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'image', 'Image', 'IMAGE', 'true',
                        'true', 'false', '', '14', '',
                        '', '', '', '', 'Image capture field',
                        '', '', '', '', 'REAR_CAM,FRONT_CAM,GALLERY,SIGN',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'map', 'Map', 'MAP', 'false',
                        'true', 'false', '', '15', '',
                        '', '', '', '', 'Map location field',
                        '', '', '', 'true', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'fileAttachment', 'File Attachment', 'LOUNGE_FILE', 'true',
                        'true', 'false', '', '16', '',
                        '', '', '', '', 'File upload field',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form1', 'itemList', 'Item list', 'ITEM_LIST', 'true',
                        'true', 'false', '', '17', '',
                        '', '', '', '', 'Dynamic item list',
                        '', '', '', 'true', '',
                        '', '', '', 'true', 'true',
                        'true', 'true', ''
                    ],
                    // Node form2 fields - simple validation fields
                    [
                        'form2', 'approval_status', 'Approval Status', 'RADIO', 'true',
                        'true', 'false', '', '1', 'APPROVED,REJECTED,PENDING',
                        '', '', '', '', 'Approval decision',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ],
                    [
                        'form2', 'approval_note', 'Approval Note', 'TEXT_AREA', 'false',
                        'true', 'false', 'Add approval notes', '2', '',
                        '', '', '', '', 'Notes for approval decision',
                        '', '', '', '', '',
                        '', '', '', '', '',
                        '', '', ''
                    ]
                ]
            }
        ]

        const workbook = XLSX.utils.book_new()

        templateData.forEach(({ sheetName, data }) => {
            const worksheet = XLSX.utils.aoa_to_sheet(data)

            // Set column widths
            const colWidths = data[0].map(() => ({ wch: 20 }))
            worksheet['!cols'] = colWidths

            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        })

        // Write and download
        XLSX.writeFile(workbook, 'workflow_template.xlsx')
        setSuccess('Template downloaded successfully!')
        setTimeout(() => setSuccess(null), 3000)
    }

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0]
        if (selectedFile) {
            // More permissive file type checking
            const fileName = selectedFile.name.toLowerCase()
            const isExcelFile = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') ||
                selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                selectedFile.type === 'application/vnd.ms-excel' ||
                selectedFile.type === 'application/excel'

            if (!isExcelFile) {
                setError('Please upload a valid Excel file (.xlsx or .xls)')
                return
            }

            // Check file size (max 10MB)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size too large. Please upload a file smaller than 10MB.')
                return
            }

            setFile(selectedFile)
            setError(null)
            setSuccess(`File "${selectedFile.name}" selected successfully`)
            setTimeout(() => setSuccess(null), 2000)
        }
    }

    // Parse Excel and generate workflow
    const generateWorkflow = async () => {
        if (!file) {
            setError('Please select an Excel file first')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            // Clear previous state
            setGeneratedWorkflow(null)

            // Read file with better error handling
            let arrayBuffer: ArrayBuffer
            try {
                arrayBuffer = await file.arrayBuffer()
            } catch (fileError) {
                throw new Error(`Failed to read file: ${fileError instanceof Error ? fileError.message : 'Unknown file read error'}. Try closing the file in Excel and re-uploading.`)
            }

            // Parse workbook with error handling
            let workbook: any
            try {
                workbook = XLSX.read(arrayBuffer, { type: 'array', cellText: false, cellDates: true })
            } catch (parseError) {
                throw new Error(`Failed to parse Excel file: ${parseError instanceof Error ? parseError.message : 'Invalid Excel format'}`)
            }

            // Validate required sheets
            const requiredSheets = ['WorkflowInfo', 'Nodes', 'Fields']
            const availableSheets = Object.keys(workbook.Sheets)
            const missingSheets = requiredSheets.filter(sheet => !workbook.Sheets[sheet])

            if (missingSheets.length > 0) {
                throw new Error(`Missing required sheet(s): ${missingSheets.join(', ')}. Available sheets: ${availableSheets.join(', ')}`)
            }

            // Parse WorkflowInfo sheet
            const workflowInfoSheet = workbook.Sheets['WorkflowInfo']
            let workflowInfoData: ExcelRow[]
            try {
                workflowInfoData = XLSX.utils.sheet_to_json(workflowInfoSheet, { raw: false, defval: '' })
            } catch (parseError) {
                throw new Error(`Error parsing WorkflowInfo sheet: ${parseError instanceof Error ? parseError.message : 'Invalid data format'}. Make sure the sheet has Property and Value columns.`)
            }

            if (workflowInfoData.length === 0) {
                throw new Error('WorkflowInfo sheet is empty. Please add at least workflow_id and workflow_name.')
            }

            const workflowInfo = workflowInfoData.reduce((acc, row) => {
                if (row.Property && row.Value !== undefined && row.Value !== '') {
                    acc[row.Property] = row.Value
                }
                return acc
            }, {} as Record<string, any>)

            // Validate required workflow properties
            if (!workflowInfo.workflow_id) {
                throw new Error('workflow_id is required in WorkflowInfo sheet. Add a row with Property="workflow_id" and a Value.')
            }

            // Parse Nodes sheet
            const nodesSheet = workbook.Sheets['Nodes']
            let nodesData: ExcelRow[]
            try {
                nodesData = XLSX.utils.sheet_to_json(nodesSheet, { raw: false, defval: '' })
            } catch (parseError) {
                throw new Error(`Error parsing Nodes sheet: ${parseError instanceof Error ? parseError.message : 'Invalid data format'}`)
            }

            if (nodesData.length === 0) {
                throw new Error('Nodes sheet is empty. Please add at least one node with node_id and node_name.')
            }

            // Validate node data
            const invalidNodes = nodesData.filter((node, index) => !node.node_id || !node.node_name)
            if (invalidNodes.length > 0) {
                const invalidRowNumbers = nodesData.map((node, index) =>
                    (!node.node_id || !node.node_name) ? index + 2 : null
                ).filter(num => num !== null)
                throw new Error(`Invalid node data in rows: ${invalidRowNumbers.join(', ')}. All nodes must have node_id and node_name.`)
            }

            // Parse Fields sheet
            const fieldsSheet = workbook.Sheets['Fields']
            let fieldsData: ExcelRow[]
            try {
                fieldsData = XLSX.utils.sheet_to_json(fieldsSheet, { raw: false, defval: '' })
            } catch (parseError) {
                throw new Error(`Error parsing Fields sheet: ${parseError instanceof Error ? parseError.message : 'Invalid data format'}`)
            }

            // Validate field data
            const validFieldTypes = [
                'TEXT', 'TEXT_AREA', 'PHONENUMBER', 'DROPDOWN', 'RADIO', 'CHECKBOX',
                'DATETIME', 'NUMBER', 'CURRENCY', 'DECIMAL', 'IMAGE', 'MAP',
                'LOUNGE_FILE', 'ITEM_LIST'
            ]

            const invalidFields = fieldsData.filter(field =>
                !field.node_id || !field.field_key || !field.field_label ||
                !field.field_type || !validFieldTypes.includes(field.field_type)
            )

            if (invalidFields.length > 0) {
                const errorDetails = invalidFields.map((field, index) => {
                    const missing = []
                    if (!field.node_id) missing.push('node_id')
                    if (!field.field_key) missing.push('field_key')
                    if (!field.field_label) missing.push('field_label')
                    if (!field.field_type) missing.push('field_type')
                    if (field.field_type && !validFieldTypes.includes(field.field_type)) {
                        missing.push(`invalid field_type: ${field.field_type}`)
                    }
                    return `Row ${index + 2}: ${missing.join(', ')}`
                }).join('\n')

                throw new Error(`Invalid field data:\n${errorDetails}`)
            }

            // Validate that all field node_ids exist in nodes
            const nodeIds = new Set(nodesData.map(node => node.node_id))
            const invalidFieldNodeIds = fieldsData.filter(field => !nodeIds.has(field.node_id))

            if (invalidFieldNodeIds.length > 0) {
                const invalidIds = [...new Set(invalidFieldNodeIds.map(field => field.node_id))]
                throw new Error(`Fields reference non-existent node_id(s): ${invalidIds.join(', ')}`)
            }

            // Build workflow structure
            const workflow: WorkflowData = {
                _id: workflowInfo.workflow_id || 'generated_workflow',
                name: workflowInfo.workflow_name || 'Generated Workflow',
                notifWorker: parseInt(workflowInfo.notif_worker) || 5,
                _vsb: workflowInfo.vsb_status || 'ACTIVE',
                _class: 'biz.byonchat.v2.services.workflow.models.Workflow',
                nodes: []
            }

            // Process nodes
            const nodes: NodeItem[] = nodesData.map((nodeRow, index) => {
                // Get fields for this node
                const nodeFields = fieldsData
                    .filter(fieldRow => fieldRow.node_id === nodeRow.node_id)
                    .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0))
                    .map((fieldRow, fieldIndex): FieldItem => {
                        const baseField = {
                            key: fieldRow.field_key || `field_${fieldIndex}`,
                            label: fieldRow.field_label || 'Untitled Field',
                            type: (fieldRow.field_type || 'TEXT') as FieldType,
                            isRequired: fieldRow.is_required === 'true' || fieldRow.is_required === true,
                            isVisible: fieldRow.is_visible !== 'false',
                            isDisabled: fieldRow.is_disabled === 'true',
                            placeholder: fieldRow.placeholder || '',
                            order: parseInt(fieldRow.order) || fieldIndex + 1,
                            value: fieldRow.default_value || undefined
                        }

                        // Handle field-specific properties based on sidebar template
                        if (baseField.type === 'DROPDOWN' || baseField.type === 'RADIO' || baseField.type === 'CHECKBOX') {
                            const fieldWithOptions = {
                                ...baseField,
                                options: fieldRow.options ? fieldRow.options.split(',').map((opt: string) => opt.trim()) : []
                            }

                            // Add masterdata properties if present
                            if (fieldRow.report_type === 'masterdata') {
                                return {
                                    ...fieldWithOptions,
                                    reportType: fieldRow.report_type,
                                    collection: fieldRow.collection,
                                    searchKey: fieldRow.search_key
                                } as any
                            }

                            // Add aggregateShow if present
                            if (fieldRow.aggregate_show === 'true') {
                                return {
                                    ...fieldWithOptions,
                                    aggregateShow: true
                                } as any
                            }

                            return fieldWithOptions as any
                        }

                        if (baseField.type === 'NUMBER' || baseField.type === 'CURRENCY' || baseField.type === 'DECIMAL') {
                            const numericField = {
                                ...baseField,
                                min: fieldRow.min_value ? parseFloat(fieldRow.min_value) : undefined,
                                max: fieldRow.max_value ? parseFloat(fieldRow.max_value) : undefined
                            }

                            if (baseField.type === 'CURRENCY' || baseField.type === 'DECIMAL') {
                                return {
                                    ...numericField,
                                    decimalCount: parseInt(fieldRow.decimal_count) || 2
                                } as any
                            }

                            return numericField as any
                        }

                        if (baseField.type === 'DATETIME') {
                            const dateField = {
                                ...baseField,
                                pickers: fieldRow.pickers ? fieldRow.pickers.split(',').map((p: string) => p.trim()) : ['DATE', 'TIME'],
                                showFormat: fieldRow.show_format || 'DD/MM/YYYY HH:mm',
                                submitFormat: fieldRow.submit_format || 'YYYY-MM-DD HH:mm:ss'
                            }

                            // Add decode format and min/max if present
                            if (fieldRow.decode_format) {
                                return {
                                    ...dateField,
                                    decodeFormat: fieldRow.decode_format,
                                    min: fieldRow.min_value || undefined,
                                    max: fieldRow.max_value || undefined
                                } as any
                            }

                            return dateField as any
                        }

                        if (baseField.type === 'IMAGE') {
                            return {
                                ...baseField,
                                pickers: fieldRow.pickers ? fieldRow.pickers.split(',').map((p: string) => p.trim()) : ['REAR_CAM', 'FRONT_CAM', 'GALLERY']
                            } as any
                        }

                        if (baseField.type === 'MAP') {
                            const mapField = {
                                ...baseField
                            }

                            if (fieldRow.aggregate_show === 'true') {
                                return {
                                    ...mapField,
                                    aggregateShow: true
                                } as any
                            }

                            return mapField as any
                        }

                        if (baseField.type === 'LOUNGE_FILE') {
                            return {
                                ...baseField,
                                dir: fieldRow.dir || null
                            } as any
                        }

                        if (baseField.type === 'ITEM_LIST') {
                            const itemListField = {
                                ...baseField,
                                fields: [], // Will be populated with sub-fields if needed
                                needFill: fieldRow.need_fill === 'true',
                                itemDeletable: fieldRow.item_deletable !== 'false',
                                itemEditable: fieldRow.item_editable !== 'false',
                                itemAddable: fieldRow.item_addable !== 'false'
                            }

                            if (fieldRow.aggregate_show === 'true') {
                                return {
                                    ...itemListField,
                                    aggregateShow: true
                                } as any
                            }

                            return itemListField as any
                        }

                        // Handle TEXT_AREA and other text types
                        if (baseField.type === 'TEXT_AREA') {
                            return baseField as any
                        }

                        return baseField as any
                    })

                return {
                    id: nodeRow.node_id || `node_${index}`,
                    name: nodeRow.node_name || 'Untitled Node',
                    iconURL: nodeRow.icon_url || 'https://ldap.byonchat2.com/iconsolo/barang_masuk/permintaan_pesanan.PNG',
                    order: parseInt(nodeRow.order) || index + 1,
                    type: nodeRow.node_type || 'FORM',
                    _vsb: 'ACTIVE',
                    showBtns: nodeRow.show_btns ? nodeRow.show_btns.split(',').map((btn: string) => btn.trim()) : ['SUBMIT'],
                    hideForCms: nodeRow.hide_for_cms === 'true',
                    locTitle: nodeRow.loc_title || nodeRow.node_name || 'Untitled',
                    submitType: nodeRow.submit_type || 'SUBMIT',
                    groups: nodeRow.groups ? nodeRow.groups.split(',').map((group: string) => group.trim()) : ['USER'],
                    routing: {
                        defaultDest: {
                            node: {
                                workflowId: workflow._id,
                                nodeId: index < nodesData.length - 1 ? nodesData[index + 1].node_id : 'END'
                            }
                        }
                    },
                    preview: {
                        title: nodeRow.node_name || 'Untitled Node',
                        subtitle: 'Generated from Excel Template'
                    },
                    assignment: {
                        type: 'AUTO'
                    },
                    locRequired: nodeRow.loc_required === 'true',
                    locPreview: nodeRow.loc_preview === 'true',
                    fieldsAfterSubmit: [],
                    fields: nodeFields,
                    reportAccess: {
                        byUserGroups: {
                            '*': 'ALL'
                        }
                    },
                    position: {
                        x: 100 + (index * 300),
                        y: 100
                    }
                }
            })

            workflow.nodes = nodes
            setGeneratedWorkflow(workflow)
            setSuccess('Workflow generated successfully!')

        } catch (err) {
            console.error('Error generating workflow:', err)
            setError(err instanceof Error ? err.message : 'Failed to generate workflow')
        } finally {
            setIsLoading(false)
        }
    }

    const [showJsonPreview, setShowJsonPreview] = useState(false)

    // Export generated workflow
    const exportWorkflow = () => {
        if (!generatedWorkflow) return

        const blob = new Blob([JSON.stringify(generatedWorkflow, null, 2)], {
            type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${generatedWorkflow._id}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setSuccess('Workflow exported successfully!')
        setTimeout(() => setSuccess(null), 3000)
    }

    // Open workflow in canvas
    const openInCanvas = () => {
        if (!generatedWorkflow) return

        const workflowUrl = `/?data=${encodeURIComponent(JSON.stringify(generatedWorkflow))}`
        window.open(workflowUrl, '_blank')
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Workflow Generator</h1>
                    <p className="text-muted-foreground">
                        Generate workflows from Excel templates
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                {/* Troubleshooting */}
                {error && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600">❌ Error Occurred</CardTitle>
                            <CardDescription>
                                Here's what went wrong and how to fix it
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                                <p className="text-red-800 font-medium">Error Details:</p>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium">🔧 Common Solutions:</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="p-2 bg-gray-50 rounded">
                                        <p className="font-medium">File Permission Error:</p>
                                        <ul className="list-disc list-inside text-gray-600 ml-2">
                                            <li>Close the Excel file completely before uploading</li>
                                            <li>Make sure no other programs are using the file</li>
                                            <li>Try saving the file with a different name</li>
                                        </ul>
                                    </div>

                                    <div className="p-2 bg-gray-50 rounded">
                                        <p className="font-medium">Sheet Names Error:</p>
                                        <ul className="list-disc list-inside text-gray-600 ml-2">
                                            <li>Ensure sheet names are exactly: <code>WorkflowInfo</code>, <code>Nodes</code>, <code>Fields</code></li>
                                            <li>Check for extra spaces or different capitalization</li>
                                            <li>Delete any extra empty sheets</li>
                                        </ul>
                                    </div>

                                    <div className="p-2 bg-gray-50 rounded">
                                        <p className="font-medium">Data Format Error:</p>
                                        <ul className="list-disc list-inside text-gray-600 ml-2">
                                            <li>Make sure all required columns have headers</li>
                                            <li>Remove empty rows between data</li>
                                            <li>Check that field_type values are valid</li>
                                            <li>Ensure node_id values match between Nodes and Fields sheets</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                    <p className="text-blue-800 font-medium">💡 Quick Fix:</p>
                                    <p className="text-blue-700 text-sm">
                                        Try downloading a fresh template and copying your data carefully,
                                        ensuring sheet names and column headers match exactly.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Step 1: Download Template */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5" />
                            Step 1: Download Template
                        </CardTitle>
                        <CardDescription>
                            Download the Excel template and fill it with your workflow data
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={downloadTemplate} className="w-full sm:w-auto">
                                <Download className="w-4 h-4 mr-2" />
                                Download Excel Template
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    // Download documentation
                                    const docUrl = '/EXCEL_TEMPLATE_GUIDE.md'
                                    const a = document.createElement('a')
                                    a.href = docUrl
                                    a.download = 'Excel_Template_Guide.md'
                                    document.body.appendChild(a)
                                    a.click()
                                    document.body.removeChild(a)
                                }}
                                className="w-full sm:w-auto"
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Download Guide
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    // Download quick test guide
                                    const docUrl = '/QUICK_TEST.md'
                                    const a = document.createElement('a')
                                    a.href = docUrl
                                    a.download = 'Quick_Test_Guide.md'
                                    document.body.appendChild(a)
                                    a.click()
                                    document.body.removeChild(a)
                                }}
                                className="w-full sm:w-auto"
                            >
                                🚀 Quick Test
                            </Button>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Open sample data in new tab
                                window.open('/SAMPLE_DATA.md', '_blank')
                            }}
                            className="w-full sm:w-auto"
                        >
                            View Sample Data
                        </Button>

                        <div className="mt-4 text-sm text-muted-foreground">
                            <p className="font-medium mb-2">Template includes 3 sheets:</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li><strong>WorkflowInfo:</strong> Basic workflow settings (ID, name, status)</li>
                                <li><strong>Nodes:</strong> Workflow steps/nodes configuration (2 sample nodes based on sidebar)</li>
                                <li><strong>Fields:</strong> Form fields for each node (19 comprehensive field examples from sidebar)</li>
                            </ul>
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <p className="font-medium text-blue-800">Field Types from Sidebar Template:</p>
                                <div className="mt-1 text-blue-700 text-xs grid grid-cols-2 gap-1">
                                    <span>• TEXT, TEXT_AREA</span>
                                    <span>• PHONENUMBER</span>
                                    <span>• NUMBER, DECIMAL, CURRENCY</span>
                                    <span>• DROPDOWN (Options/Masterdata)</span>
                                    <span>• RADIO (Options/Masterdata)</span>
                                    <span>• CHECKBOX (Options/Masterdata)</span>
                                    <span>• DATETIME (Date picker)</span>
                                    <span>• IMAGE (Camera/Gallery)</span>
                                    <span>• MAP (Location)</span>
                                    <span>• LOUNGE_FILE (Upload)</span>
                                    <span>• ITEM_LIST (Dynamic list)</span>
                                </div>
                            </div>
                            <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                                <p className="font-medium text-green-800">📋 Template Features:</p>
                                <ul className="mt-1 text-green-700 text-xs list-disc list-inside space-y-1">
                                    <li>Based on existing sidebar field definitions</li>
                                    <li>Complete field configurations with all properties</li>
                                    <li>Masterdata integration examples (mdKaryawan)</li>
                                    <li>Advanced field properties (aggregateShow, pickers, etc.)</li>
                                    <li>Real icon URLs from existing system</li>
                                </ul>
                            </div>
                            <div className="mt-3 p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                                <p className="font-medium text-amber-800">⚠️ Important Tips:</p>
                                <ul className="mt-1 text-amber-700 text-xs list-disc list-inside space-y-1">
                                    <li>Make sure Excel file is <strong>closed</strong> before uploading</li>
                                    <li>Sheet names must be exactly: WorkflowInfo, Nodes, Fields</li>
                                    <li>Don't leave empty rows between data</li>
                                    <li>Save as .xlsx format for best compatibility</li>
                                    <li>Template follows existing sidebar structure</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 2: Upload Excel */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            Step 2: Upload Excel File
                        </CardTitle>
                        <CardDescription>
                            Upload your completed Excel file to generate the workflow
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="excel-file">Select Excel File</Label>
                            <Input
                                id="excel-file"
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileUpload}
                                ref={fileInputRef}
                            />
                        </div>

                        {file && (
                            <div className="text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-600">✓</span>
                                    Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    File ready for processing. Make sure the Excel file is closed.
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={generateWorkflow}
                            disabled={!file || isLoading}
                            className="w-full sm:w-auto"
                        >
                            <Wand2 className="w-4 h-4 mr-2" />
                            {isLoading ? 'Generating...' : 'Generate Workflow'}
                        </Button>

                        <div className="text-xs text-gray-500 mt-2">
                            <p className="font-medium mb-1">Before generating:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Ensure Excel file is completely closed</li>
                                <li>Check all 3 sheets exist with correct names</li>
                                <li>Verify data format matches template</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Step 3: Generated Workflow */}
                {generatedWorkflow && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 3: Generated Workflow</CardTitle>
                            <CardDescription>
                                Your workflow has been generated successfully
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <div className="font-medium">Workflow Name</div>
                                    <div className="text-muted-foreground">{generatedWorkflow.name}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Nodes</div>
                                    <div className="text-muted-foreground">{generatedWorkflow.nodes.length}</div>
                                </div>
                                <div>
                                    <div className="font-medium">Total Fields</div>
                                    <div className="text-muted-foreground">
                                        {generatedWorkflow.nodes.reduce((total, node) => total + node.fields.length, 0)}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-medium">Status</div>
                                    <div className="text-muted-foreground">{generatedWorkflow._vsb}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="font-medium">Nodes:</div>
                                <div className="grid gap-2 max-h-40 overflow-y-auto">
                                    {generatedWorkflow.nodes.map((node, index) => (
                                        <div key={node.id} className="text-sm border rounded p-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-medium">{index + 1}. {node.name}</div>
                                                    <div className="text-muted-foreground text-xs">
                                                        ID: {node.id} • Type: {node.type} • Fields: {node.fields.length}
                                                    </div>
                                                </div>
                                                <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    Order: {node.order}
                                                </div>
                                            </div>
                                            {node.fields.length > 0 && (
                                                <div className="mt-2 text-xs">
                                                    <div className="font-medium mb-1">Fields:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {node.fields.slice(0, 3).map((field, i) => (
                                                            <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                                {field.label} ({field.type})
                                                            </span>
                                                        ))}
                                                        {node.fields.length > 3 && (
                                                            <span className="text-gray-500 text-xs">
                                                                +{node.fields.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button onClick={exportWorkflow} variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export JSON
                                </Button>
                                <Button
                                    onClick={() => setShowJsonPreview(!showJsonPreview)}
                                    variant="outline"
                                >
                                    {showJsonPreview ? 'Hide' : 'Preview'} JSON
                                </Button>
                                <Button onClick={openInCanvas}>
                                    Open in Canvas
                                </Button>
                            </div>

                            {/* JSON Preview */}
                            {showJsonPreview && (
                                <div className="mt-4">
                                    <div className="font-medium mb-2">JSON Preview:</div>
                                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono max-h-60 overflow-auto">
                                        <pre>{JSON.stringify(generatedWorkflow, null, 2)}</pre>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(generatedWorkflow, null, 2))
                                            setSuccess('JSON copied to clipboard!')
                                            setTimeout(() => setSuccess(null), 2000)
                                        }}
                                    >
                                        Copy JSON
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
