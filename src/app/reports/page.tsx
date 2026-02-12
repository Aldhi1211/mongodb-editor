"use client"

import Image from "next/image";
import type { ReportData, ReportFieldItem } from '@/app/builder/data/reportData';
import { createNewReportTemplate } from '@/app/builder/data/reportData';

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from 'next/navigation'
import { Check, ChevronsUpDown, Pencil, GripVertical, ArrowUp, ArrowDown } from "lucide-react"
import fields from '@/components/app-sidebar';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Define drag item types
const ItemTypes = {
    FIELD: 'field'
}

export default function ReportCanvas() {
    const searchParams = useSearchParams()
    const [currentView, setCurrentView] = useState<"report" | "code">("report")
    const [reportData, setReportData] = useState<ReportData>(createNewReportTemplate())

    // Load report data from URL parameter or sessionStorage
    useEffect(() => {
        const dataParam = searchParams.get('data')
        const idParam = searchParams.get('id')
        
        if (dataParam) {
            // Legacy: Load from URL parameter (for backward compatibility)
            try {
                const decodedData = JSON.parse(decodeURIComponent(dataParam)) as ReportData
                setReportData(decodedData)
            } catch (error) {
                console.error('Failed to parse report data from URL:', error)
            }
        } else if (idParam) {
            // New: Load from sessionStorage using ID
            try {
                const storedData = sessionStorage.getItem(idParam)
                if (storedData) {
                    const reportData = JSON.parse(storedData) as ReportData
                    setReportData(reportData)
                    // Clean up sessionStorage after loading
                    sessionStorage.removeItem(idParam)
                } else {
                    console.error('Report data not found in sessionStorage for ID:', idParam)
                }
            } catch (error) {
                console.error('Failed to parse report data from sessionStorage:', error)
            }
        }
    }, [searchParams])
    const [codeContent, setCodeContent] = useState<string>('')
    const [fieldDialogState, setFieldDialogState] = useState<{
        open: boolean;
        fieldKey: string;
        field: ReportFieldItem | null;
    }>({
        open: false,
        fieldKey: '',
        field: null
    })
    const [tempFieldProperties, setTempFieldProperties] = useState<Record<string, any>>({})
    const [newPropertyKey, setNewPropertyKey] = useState('')
    const [newPropertyValue, setNewPropertyValue] = useState('')
    const [reportDialogState, setReportDialogState] = useState<{
        open: boolean;
    }>({
        open: false
    })
    const [tempReportProperties, setTempReportProperties] = useState<Record<string, any>>({})
    const [newReportPropertyKey, setNewReportPropertyKey] = useState('')
    const [newReportPropertyValue, setNewReportPropertyValue] = useState('')

    const openFieldDialog = (field: ReportFieldItem) => {
        setFieldDialogState({
            open: true,
            fieldKey: field.key,
            field
        })
        setTempFieldProperties({ ...field })
    }

    const closeFieldDialog = () => {
        setFieldDialogState({ open: false, fieldKey: '', field: null })
        setTempFieldProperties({})
        setNewPropertyKey('')
        setNewPropertyValue('')
    }

    const saveFieldProperties = () => {
        if (!fieldDialogState.field) return

        setReportData(prev => ({
            ...prev,
            fields: prev.fields.map(field =>
                field.key === fieldDialogState.fieldKey
                    ? { ...field, ...tempFieldProperties } as ReportFieldItem
                    : field
            )
        }))
        closeFieldDialog()
    }

    const addNewProperty = () => {
        if (newPropertyKey.trim() && newPropertyValue.trim()) {
            setTempFieldProperties(prev => ({
                ...prev,
                [newPropertyKey]: newPropertyValue
            }))
            setNewPropertyKey('')
            setNewPropertyValue('')
        }
    }

    const removeProperty = (key: string) => {
        setTempFieldProperties(prev => {
            const { [key]: removed, ...rest } = prev
            return rest
        })
    }

    const updatePropertyValue = (key: string, value: any) => {
        setTempFieldProperties(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const openReportDialog = () => {
        setReportDialogState({ open: true })
        // Copy report properties excluding fields and _class
        const { fields, _class, ...reportProps } = reportData
        setTempReportProperties({ ...reportProps })
    }

    const closeReportDialog = () => {
        setReportDialogState({ open: false })
        setTempReportProperties({})
        setNewReportPropertyKey('')
        setNewReportPropertyValue('')
    }

    const saveReportProperties = () => {
        setReportData(prev => ({
            ...prev,
            ...tempReportProperties
        }))
        closeReportDialog()
    }

    const addNewReportProperty = () => {
        if (newReportPropertyKey.trim() && newReportPropertyValue.trim()) {
            setTempReportProperties(prev => ({
                ...prev,
                [newReportPropertyKey]: newReportPropertyValue
            }))
            setNewReportPropertyKey('')
            setNewReportPropertyValue('')
        }
    }

    const removeReportProperty = (key: string) => {
        setTempReportProperties(prev => {
            const { [key]: removed, ...rest } = prev
            return rest
        })
    }

    const updateReportPropertyValue = (key: string, value: any) => {
        setTempReportProperties(prev => ({
            ...prev,
            [key]: value
        }))
    }

    // React DnD functions
    const moveField = useCallback((dragIndex: number, hoverIndex: number) => {
        const newFields = [...reportData.fields];
        const draggedField = newFields[dragIndex];

        newFields.splice(dragIndex, 1);
        newFields.splice(hoverIndex, 0, draggedField);

        // Auto-assign order based on new array index
        const fieldsWithOrder = newFields.map((field, index) => ({
            ...field,
            order: index
        }));

        setReportData(prev => ({
            ...prev,
            fields: fieldsWithOrder
        }));
    }, [reportData.fields]);

    // DraggableField component using react-dnd
    const DraggableField = ({
        field,
        fieldIndex,
        moveField
    }: {
        field: ReportFieldItem,
        fieldIndex: number,
        moveField: (dragIndex: number, hoverIndex: number) => void
    }) => {
        const ref = useRef<HTMLDivElement>(null);

        const [{ isDragging }, drag] = useDrag({
            type: ItemTypes.FIELD,
            item: {
                index: fieldIndex
            },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        })

        const [, drop] = useDrop({
            accept: ItemTypes.FIELD,
            hover: (item: { index: number }) => {
                if (!ref.current) return

                const dragIndex = item.index
                const hoverIndex = fieldIndex

                if (dragIndex === hoverIndex) return

                moveField(dragIndex, hoverIndex)
                item.index = hoverIndex
            },
        })

        drag(drop(ref));

        return (
            <div ref={ref}>
                <div
                    className={`bg-gray-800 p-3 rounded-lg group relative transition-all duration-200 hover:bg-gray-750 ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                        } min-h-[60px] flex flex-col justify-center cursor-move`}
                >
                    {/* Drag handle */}
                    <div
                        className="absolute left-1 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Drag to reorder fields"
                    >
                        <GripVertical className="w-4 h-4 text-gray-500" />
                    </div>

                    {/* Field content */}
                    <div
                        className="cursor-pointer hover:bg-gray-700 transition-colors p-2 -m-2 rounded-lg ml-4 mr-16"
                        onClick={() => openFieldDialog(field)}
                    >
                        {/* Main field info */}
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded flex-shrink-0">
                                    #{field.order}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium block truncate">
                                            {field.label}
                                        </span>
                                        {(field as any).formula && (
                                            <span className="text-xs text-green-400 bg-green-900 px-2 py-1 rounded">
                                                Formula
                                            </span>
                                        )}
                                        {field.ref && (
                                            <span className="text-xs text-blue-400 bg-blue-900 px-2 py-1 rounded">
                                                Reference
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-gray-400 text-xs">
                                        {field.type}
                                        {field.isRequired && <span className="text-red-400 ml-1">*</span>}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Additional field info */}
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {field.key !== field.label && (
                                <span>Key: {field.key}</span>
                            )}
                            {(field as any).formula && (
                                <span className="ml-2">Formula: {(field as any).formula}</span>
                            )}
                        </div>
                    </div>

                    {/* Control buttons */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        {/* Delete button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Remove field "${field.label}"?`)) {
                                    const updatedFields = reportData.fields.filter(f => f.key !== field.key);
                                    const fieldsWithOrder = updatedFields.map((field, index) => ({
                                        ...field,
                                        order: index
                                    }));
                                    setReportData(prev => ({
                                        ...prev,
                                        fields: fieldsWithOrder
                                    }));
                                }
                            }}
                            className="p-1 rounded bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
                            title="Delete field"
                        >
                            <span className="text-white text-xs font-bold">✕</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Function to convert MongoDB syntax to standard JSON
    const convertMongoToJSON = (mongoString: string): string => {
        return mongoString
            // Convert NumberLong() to regular numbers
            .replace(/NumberLong\((-?\d+)\)/g, '$1')
            // Convert NumberInt() to regular numbers
            .replace(/NumberInt\((-?\d+)\)/g, '$1')
            // Convert ObjectId() to string
            .replace(/ObjectId\("([^"]+)"\)/g, '"$1"')
            // Convert ISODate() to string
            .replace(/ISODate\("([^"]+)"\)/g, '"$1"')
            // Remove trailing commas before closing brackets/braces
            .replace(/,(\s*[}\]])/g, '$1')
            // Convert undefined to null
            .replace(/:\s*undefined/g, ': null')
            // Handle MongoDB-style comments (// comments)
            .replace(/\/\/.*$/gm, '')
            // Clean up extra whitespace
            .replace(/\s+$/gm, '');
    };

    // Initialize code content when component mounts or reportData changes
    useEffect(() => {
        setCodeContent(JSON.stringify(reportData, null, 2))
    }, [reportData])

    const handleSaveCode = () => {
        try {
            // First try to convert MongoDB syntax to standard JSON
            let processedContent = codeContent;

            // Check if content contains MongoDB syntax
            if (processedContent.includes('NumberLong') ||
                processedContent.includes('NumberInt') ||
                processedContent.includes('ObjectId') ||
                processedContent.includes('ISODate')) {
                processedContent = convertMongoToJSON(processedContent);
            }

            const parsed = JSON.parse(processedContent) as ReportData
            setReportData(parsed) // Update the main data object

            // Update the code content with the processed version
            setCodeContent(JSON.stringify(parsed, null, 2));

            alert("Code saved successfully! MongoDB syntax has been converted to standard JSON.")
        } catch (error) {
            alert("Invalid JSON format. Please fix the syntax errors.\n\nSupported MongoDB conversions:\n- NumberLong() → number\n- NumberInt() → number\n- ObjectId() → string\n- ISODate() → string\n- Trailing commas removal")
        }
    }

    const handleFormatCode = () => {
        try {
            // First try to convert MongoDB syntax to standard JSON
            let processedContent = codeContent;

            // Check if content contains MongoDB syntax
            if (processedContent.includes('NumberLong') ||
                processedContent.includes('NumberInt') ||
                processedContent.includes('ObjectId') ||
                processedContent.includes('ISODate')) {
                processedContent = convertMongoToJSON(processedContent);
            }

            const parsed = JSON.parse(processedContent) as ReportData
            const formatted = JSON.stringify(parsed, null, 2)
            setCodeContent(formatted)
        } catch (error) {
            alert("Cannot format: Invalid JSON syntax.\n\nIf using MongoDB syntax, ensure proper format:\n- NumberLong(-999999999)\n- ObjectId(\"507f1f77bcf86cd799439011\")\n- etc.")
        }
    }

    const handleExportCode = () => {
        try {
            // First try to convert MongoDB syntax to standard JSON
            let processedContent = codeContent;

            // Check if content contains MongoDB syntax
            if (processedContent.includes('NumberLong') ||
                processedContent.includes('NumberInt') ||
                processedContent.includes('ObjectId') ||
                processedContent.includes('ISODate')) {
                processedContent = convertMongoToJSON(processedContent);
            }

            const parsed = JSON.parse(processedContent) as ReportData
            const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'report.json'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            alert("Cannot export: Invalid JSON syntax.\n\nIf using MongoDB syntax, ensure proper format before exporting.")
        }
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="font-sans flex flex-col items-center justify-center min-h-screen pb-20 gap-16 lg:p-20 lg:pt-30 p-8 w-full">
                <div className="flex flex-col items-center gap-4">
                    <h1 className="text-4xl font-bold text-gray-800">Report Canvas</h1>
                    <div className="flex gap-4">
                        <Button
                            variant={currentView === "report" ? "default" : "outline"}
                            onClick={() => setCurrentView("report")}
                        >
                            Report View
                        </Button>
                        <Button
                            variant={currentView === "code" ? "default" : "outline"}
                            onClick={() => setCurrentView("code")}
                        >
                            Code View
                        </Button>
                    </div>
                </div>

                <main className="flex flex-col gap-[32px] items-center sm:items-start bg-amber-200 w-full h-full p-5 rounded-2xl lg:w-200">
                    {currentView === "report" ? (
                        <>
                            <div className="flex justify-between items-center w-full">
                                <div
                                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors group"
                                    onClick={openReportDialog}
                                >
                                    <h1 className="text-2xl font-bold text-gray-800">{reportData.name || 'New Report'}</h1>
                                    <Pencil className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-auto justify-between"
                                        >
                                            Add Field
                                            <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Command>
                                            <CommandInput placeholder="Search field..." className="h-9" />
                                            <CommandList>
                                                <CommandEmpty>No field found.</CommandEmpty>
                                                <CommandGroup>
                                                    {fields.map((field) => (
                                                        <CommandItem
                                                            key={field.key}
                                                            value={field.key}
                                                            onSelect={(currentValue) => {
                                                                // Find the selected field from sidebar
                                                                const selectedField = fields.find(f => f.key === currentValue);

                                                                if (selectedField) {
                                                                    // Generate unique key for the field
                                                                    const generateUniqueKey = (baseKey: string, existingFields: ReportFieldItem[]): string => {
                                                                        let counter = 1;
                                                                        let newKey = baseKey;

                                                                        while (existingFields.some(f => f.key === newKey)) {
                                                                            newKey = `${baseKey}_${counter}`;
                                                                            counter++;
                                                                        }

                                                                        return newKey;
                                                                    };

                                                                    const uniqueKey = generateUniqueKey(selectedField.key, reportData.fields);

                                                                    // Create a new field with unique key and preserve all properties
                                                                    const newField: ReportFieldItem = {
                                                                        ...selectedField,
                                                                        key: uniqueKey,
                                                                        order: reportData.fields.length // Auto-assign order
                                                                    };

                                                                    // Add field to the report
                                                                    const updatedFields = [...reportData.fields, newField];
                                                                    const fieldsWithOrder = updatedFields.map((field, index) => ({
                                                                        ...field,
                                                                        order: index
                                                                    }));

                                                                    setReportData(prev => ({
                                                                        ...prev,
                                                                        fields: fieldsWithOrder
                                                                    }));
                                                                }
                                                            }}
                                                        >
                                                            {field.label}
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Report Fields Container */}
                            <div className="bg-black w-full p-5 rounded-4xl">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-sm lg:text-xl text-white font-bold">Report Fields</h1>
                                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                                            {reportData.fields.length} field{reportData.fields.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 w-full pt-4">
                                    {reportData.fields && reportData.fields.length > 0 ? (
                                        <>
                                            {/* Field count indicator */}
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-gray-400">
                                                    {reportData.fields.length} field{reportData.fields.length !== 1 ? 's' : ''} added
                                                </span>
                                                <div className="flex gap-1">
                                                    <span className="text-xs text-gray-500">
                                                        Drag to reorder • Click to edit
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Fields container */}
                                            <div className="space-y-3 w-full">
                                                {reportData.fields.map((field, fieldIndex) => (
                                                    <DraggableField
                                                        key={`report-field-${field.key}-${fieldIndex}`}
                                                        field={field}
                                                        fieldIndex={fieldIndex}
                                                        moveField={moveField}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-gray-400 text-center py-6 border-2 border-dashed border-gray-600 rounded-lg">
                                            <p className="text-sm">No fields added yet</p>
                                            <p className="text-xs mt-1">Use "Add Field" button above to get started</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-gray-800">Code Editor</h1>
                            <div className="bg-gray-900 w-full h-full p-5 rounded-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg text-white font-bold">report.json</h2>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={handleSaveCode}>Save</Button>
                                        <Button variant="outline" size="sm" onClick={handleFormatCode}>Format</Button>
                                        <Button variant="outline" size="sm" onClick={handleExportCode}>Export</Button>
                                    </div>
                                </div>
                                <div className="bg-black rounded-lg p-4 h-96 overflow-auto">
                                    <textarea
                                        value={codeContent}
                                        onChange={(e) => setCodeContent(e.target.value)}
                                        className="w-full h-full bg-transparent text-green-400 text-sm font-mono leading-relaxed resize-none border-none outline-none"
                                        spellCheck="false"
                                        placeholder="Enter your JSON code here...&#10;&#10;Supports MongoDB syntax:&#10;- NumberLong(-999999999)&#10;- NumberInt(123)&#10;- ObjectId(&quot;507f1f77bcf86cd799439011&quot;)&#10;- ISODate(&quot;2023-01-01T00:00:00Z&quot;)&#10;- Trailing commas"
                                    />
                                </div>
                                <div className="text-xs text-gray-400 mt-2 px-2">
                                    💡 <strong>MongoDB Support:</strong> You can paste MongoDB format directly.
                                    It will be automatically converted to standard JSON when saved.
                                    <br />
                                    <strong>Supported:</strong> NumberLong(), NumberInt(), ObjectId(), ISODate(), trailing commas
                                </div>
                            </div>
                        </>
                    )}
                </main>

                {/* Field Properties Dialog */}
                <Dialog open={fieldDialogState.open} onOpenChange={(open) => !open && closeFieldDialog()}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Field Properties</DialogTitle>
                            <DialogDescription>
                                {fieldDialogState.field?.label} ({fieldDialogState.field?.type})
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Display existing properties */}
                            <div className="space-y-3">
                                <h4 className="font-medium">Current Properties</h4>
                                {Object.entries(tempFieldProperties)
                                    .filter(([key]) => key !== 'order') // Exclude order from being editable
                                    .map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                            <span className="font-mono text-sm min-w-[100px]">{key}:</span>
                                            {typeof value === 'boolean' ? (
                                                // Checkbox for boolean values
                                                <div className="flex items-center gap-2 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={value}
                                                        onChange={(e) => updatePropertyValue(key, e.target.checked)}
                                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                    />
                                                    <span className="text-sm text-gray-600">
                                                        {value ? 'true' : 'false'}
                                                    </span>
                                                </div>
                                            ) : typeof value === 'number' ? (
                                                // Number input for numeric values
                                                <Input
                                                    type="number"
                                                    value={value}
                                                    onChange={(e) => updatePropertyValue(key, Number(e.target.value))}
                                                    className="flex-1"
                                                />
                                            ) : Array.isArray(value) ? (
                                                // Text input for arrays (displayed as JSON)
                                                <Input
                                                    value={JSON.stringify(value)}
                                                    onChange={(e) => {
                                                        try {
                                                            const newValue = JSON.parse(e.target.value);
                                                            updatePropertyValue(key, newValue);
                                                        } catch {
                                                            // Keep as string if parsing fails
                                                            updatePropertyValue(key, e.target.value);
                                                        }
                                                    }}
                                                    placeholder='e.g., ["option1", "option2"]'
                                                    className="flex-1"
                                                />
                                            ) : typeof value === 'object' && value !== null ? (
                                                // Text input for objects (displayed as JSON)
                                                <Input
                                                    value={JSON.stringify(value)}
                                                    onChange={(e) => {
                                                        try {
                                                            const newValue = JSON.parse(e.target.value);
                                                            updatePropertyValue(key, newValue);
                                                        } catch {
                                                            // Keep as string if parsing fails
                                                            updatePropertyValue(key, e.target.value);
                                                        }
                                                    }}
                                                    placeholder='e.g., {"key": "value"}'
                                                    className="flex-1"
                                                />
                                            ) : (
                                                // Text input for strings and other types
                                                <Input
                                                    value={String(value)}
                                                    onChange={(e) => {
                                                        let newValue: any = e.target.value;
                                                        // Try to parse as JSON if it looks like JSON
                                                        if (newValue.startsWith('{') || newValue.startsWith('[') || newValue === 'true' || newValue === 'false' || !isNaN(Number(newValue))) {
                                                            try {
                                                                newValue = JSON.parse(newValue);
                                                            } catch {
                                                                // Keep as string if parsing fails
                                                            }
                                                        }
                                                        updatePropertyValue(key, newValue);
                                                    }}
                                                    className="flex-1"
                                                />
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeProperty(key)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))}
                            </div>

                            {/* Add new property */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Add New Property</h4>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Property key"
                                        value={newPropertyKey}
                                        onChange={(e) => setNewPropertyKey(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Property value"
                                        value={newPropertyValue}
                                        onChange={(e) => setNewPropertyValue(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button onClick={addNewProperty}>Add</Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Tip: Use JSON format for objects/arrays (e.g., ["option1", "option2"])
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={saveFieldProperties}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Report Properties Dialog */}
                <Dialog open={reportDialogState.open} onOpenChange={(open) => !open && closeReportDialog()}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Report Properties</DialogTitle>
                            <DialogDescription>
                                Manage report settings and metadata (fields and _class cannot be edited here)
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Display existing properties */}
                            <div className="space-y-3">
                                <h4 className="font-medium">Current Properties</h4>
                                {Object.entries(tempReportProperties).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                        <span className="font-mono text-sm min-w-[100px]">{key}:</span>
                                        <Input
                                            value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            onChange={(e) => {
                                                let newValue: any = e.target.value;
                                                // Try to parse as JSON if it looks like JSON
                                                if (newValue.startsWith('{') || newValue.startsWith('[') || newValue === 'true' || newValue === 'false' || !isNaN(Number(newValue))) {
                                                    try {
                                                        newValue = JSON.parse(newValue);
                                                    } catch {
                                                        // Keep as string if parsing fails
                                                    }
                                                }
                                                updateReportPropertyValue(key, newValue);
                                            }}
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeReportProperty(key)}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            {/* Add new property */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Add New Property</h4>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Property key"
                                        value={newReportPropertyKey}
                                        onChange={(e) => setNewReportPropertyKey(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Property value"
                                        value={newReportPropertyValue}
                                        onChange={(e) => setNewReportPropertyValue(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button onClick={addNewReportProperty}>Add</Button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Tip: Use JSON format for objects/arrays (e.g., ["option1", "option2"])
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={saveReportProperties}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <footer className="flex gap-[24px] flex-wrap items-center justify-center mt-auto">
                    <a
                        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                        href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Image
                            aria-hidden
                            src="/file.svg"
                            alt="File icon"
                            width={16}
                            height={16}
                        />
                        Learn
                    </a>
                    <a
                        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                        href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Image
                            aria-hidden
                            src="/window.svg"
                            alt="Window icon"
                            width={16}
                            height={16}
                        />
                        Examples
                    </a>
                    <a
                        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                        href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Image
                            aria-hidden
                            src="/globe.svg"
                            alt="Globe icon"
                            width={16}
                            height={16}
                        />
                        Go to nextjs.org →
                    </a>
                </footer>
            </div>
        </DndProvider>
    );
}
