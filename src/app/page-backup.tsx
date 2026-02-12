"use client"


import Image from "next/image";
import type { WorkflowData, NodeItem, FieldItem } from '@/app/builder/data/workflowData';
import { createNewNodeTemplate } from '@/app/builder/data/nodeTemplates';

import { useState, useEffect, useCallback } from "react"
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


export default function Home() {
  const [currentView, setCurrentView] = useState<"node" | "code">("node")
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    _id: 'workflowTemplate',
    name: 'Workflow Template',
    notifWorker: 5,
    _vsb: 'ACTIVE',
    nodes: [],
    _class: 'biz.byonchat.v2.services.workflow.models.Workflow'
  })
  const [codeContent, setCodeContent] = useState<string>('')
  const [nodePopoverStates, setNodePopoverStates] = useState<Record<string, { open: boolean; value: string }>>({})
  const [fieldDialogState, setFieldDialogState] = useState<{
    open: boolean;
    nodeId: string;
    fieldKey: string;
    field: FieldItem | null;
  }>({
    open: false,
    nodeId: '',
    fieldKey: '',
    field: null
  })
  const [tempFieldProperties, setTempFieldProperties] = useState<Record<string, any>>({})
  const [newPropertyKey, setNewPropertyKey] = useState('')
  const [newPropertyValue, setNewPropertyValue] = useState('')
  const [minimizedNodes, setMinimizedNodes] = useState<Record<string, boolean>>({})
  const [deletingNodes, setDeletingNodes] = useState<Record<string, boolean>>({})
  const [workflowDialogState, setWorkflowDialogState] = useState<{
    open: boolean;
  }>({
    open: false
  })
  const [tempWorkflowProperties, setTempWorkflowProperties] = useState<Record<string, any>>({})
  const [newWorkflowPropertyKey, setNewWorkflowPropertyKey] = useState('')
  const [newWorkflowPropertyValue, setNewWorkflowPropertyValue] = useState('')
  const [nodeDialogState, setNodeDialogState] = useState<{
    open: boolean;
    nodeId: string;
  }>({
    open: false,
    nodeId: ''
  })
  const [tempNodeProperties, setTempNodeProperties] = useState<Record<string, any>>({})
  const [newNodePropertyKey, setNewNodePropertyKey] = useState('')
  const [newNodePropertyValue, setNewNodePropertyValue] = useState('')
  const [draggedField, setDraggedField] = useState<{ nodeId: string; fieldIndex: number } | null>(null)
  const [draggedNode, setDraggedNode] = useState<number | null>(null)
  const [minimizedFields, setMinimizedFields] = useState<Record<string, boolean>>({})

  // Define drag item types
  const ItemTypes = {
    FIELD: 'field',
    NODE: 'node'
  }

  // DraggableField component using react-dnd
  const DraggableField = ({ 
    field, 
    fieldIndex, 
    nodeId, 
    parentPath = '', 
    level = 0,
    moveField 
  }: {
    field: any,
    fieldIndex: number,
    nodeId: string,
    parentPath?: string,
    level?: number,
    moveField: (dragIndex: number, hoverIndex: number) => void
  }) => {
    const fieldPath = parentPath ? `${parentPath}.${field.key}` : field.key;
    const hasSubFields = field.fields && Array.isArray(field.fields) && field.fields.length > 0;
    const canHaveSubFields = field.fields !== undefined;

    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.FIELD,
      item: { index: fieldIndex, nodeId },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    })

    const [, drop] = useDrop({
      accept: ItemTypes.FIELD,
      hover: (item: { index: number, nodeId: string }) => {
        if (!drag) return
        if (item.nodeId !== nodeId) return

        const dragIndex = item.index
        const hoverIndex = fieldIndex

        if (dragIndex === hoverIndex) return

        moveField(dragIndex, hoverIndex)
        item.index = hoverIndex
      },
    })

    return (
      <div ref={(node) => drag(drop(node))} className={`ml-${level * 4}`}>
        <div
          className={`bg-gray-800 p-3 rounded-lg group relative transition-all duration-200 hover:bg-gray-750 ${
            isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          } min-h-[60px] flex flex-col justify-center cursor-move`}
        >
          {/* Drag handle */}
          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>

          {/* Field content */}
          <div
            className="cursor-pointer hover:bg-gray-700 transition-colors p-2 -m-2 rounded-lg ml-4 mr-16"
            onClick={() => openFieldDialog(nodeId, field)}
          >
            {/* Main field info */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded flex-shrink-0">
                  #{field.order || fieldIndex + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium block truncate">
                      {field.label}
                    </span>
                    {canHaveSubFields && (
                      <span className="text-xs text-blue-400 bg-blue-900 px-2 py-1 rounded">
                        Container ({(field.fields || []).length})
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

            {/* Additional field info - compact */}
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
              {field.key !== field.label && (
                <span>Key: {field.key}</span>
              )}
            </div>
          </div>

          {/* Control buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            {/* Container controls */}
            {canHaveSubFields && (
              <div className="flex gap-1 mb-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer text-xs"
                      title="Add sub-field"
                    >
                      +
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Command>
                      <CommandInput placeholder="Search field..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No field found.</CommandEmpty>
                        <CommandGroup>
                          {fields.map((availableField) => (
                            <CommandItem
                              key={availableField.key}
                              value={availableField.key}
                              onSelect={() => {
                                addSubField(nodeId, field.key, availableField);
                              }}
                            >
                              {availableField.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {hasSubFields && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFieldMinimize(fieldPath);
                    }}
                    className="p-1 rounded bg-gray-600 hover:bg-gray-500 transition-colors cursor-pointer text-xs"
                    title={minimizedFields[fieldPath] ? "Expand" : "Collapse"}
                  >
                    {minimizedFields[fieldPath] ? "+" : "-"}
                  </button>
                )}
              </div>
            )}

            {/* Arrow buttons */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveFieldUpInContainer(nodeId, field.key);
                }}
                disabled={fieldIndex === 0}
                className={`p-1 rounded bg-gray-600 hover:bg-gray-500 transition-colors ${
                  fieldIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Move up"
              >
                <ArrowUp className="w-3 h-3 text-gray-300" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveFieldDownInContainer(nodeId, field.key);
                }}
                disabled={fieldIndex === field.fields?.length - 1}
                className={`p-1 rounded bg-gray-600 hover:bg-gray-500 transition-colors ${
                  fieldIndex === field.fields?.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Move down"
              >
                <ArrowDown className="w-3 h-3 text-gray-300" />
              </button>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Remove field "${field.label}"?`)) {
                  if (parentPath) {
                    // Remove sub-field
                    const pathParts = parentPath.split('.');
                    // Implementation for removing nested field would go here
                  } else {
                    // Remove main field
                    const updatedFields = workflowData.nodes.find(n => n.id === nodeId)?.fields.filter(f => f.key !== field.key) || [];
                    setWorkflowData(prev => ({
                      ...prev,
                      nodes: prev.nodes.map(n =>
                        n.id === nodeId
                          ? { ...n, fields: updatedFields }
                          : n
                      )
                    }));
                    updateFieldOrder(nodeId, updatedFields);
                  }
                }
              }}
              className="p-1 rounded bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
              title="Delete field"
            >
              <span className="text-white text-xs font-bold">✕</span>
            </button>
          </div>
        </div>

        {/* Render sub-fields */}
        {hasSubFields && !minimizedFields[fieldPath] && (
          <div className="ml-4 mt-2 space-y-2 border-l-2 border-gray-600 pl-4">
            <div className="text-xs text-gray-400 mb-2">
              {field.fields.length} sub-field{field.fields.length !== 1 ? 's' : ''}
            </div>
            {field.fields.map((subField: any, subIndex: number) => (
              <DraggableField
                key={subField.key}
                field={subField}
                fieldIndex={subIndex}
                nodeId={nodeId}
                parentPath={fieldPath}
                level={level + 1}
                moveField={(dragIndex: number, hoverIndex: number) => {
                  // Handle sub-field reordering
                  const node = workflowData.nodes.find(n => n.id === nodeId);
                  if (!node) return;
                  
                  const parentField = node.fields.find(f => f.key === field.key);
                  if (!parentField || !parentField.fields) return;
                  
                  const newSubFields = [...parentField.fields];
                  const draggedItem = newSubFields[dragIndex];
                  newSubFields.splice(dragIndex, 1);
                  newSubFields.splice(hoverIndex, 0, draggedItem);
                  
                  updateSubFieldOrder(nodeId, field.key, newSubFields);
                }}
              />
            ))}
          </div>
        )}

        {/* Empty state for container fields */}
        {canHaveSubFields && (!field.fields || field.fields.length === 0) && !minimizedFields[fieldPath] && (
          <div className="ml-4 mt-2 text-gray-500 text-xs italic border-l-2 border-gray-600 pl-4">
            No sub-fields added. Use the "+" button to add sub-fields.
          </div>
        )}
      </div>
    );
  };

  const getNodePopoverState = (nodeId: string) => {
    return nodePopoverStates[nodeId] || { open: false, value: "" }
  }

  const setNodePopoverState = (nodeId: string, state: { open?: boolean; value?: string }) => {
    setNodePopoverStates(prev => ({
      ...prev,
      [nodeId]: {
        ...getNodePopoverState(nodeId),
        ...state
      }
    }))
  }

  const openFieldDialog = (nodeId: string, field: FieldItem) => {
    setFieldDialogState({
      open: true,
      nodeId,
      fieldKey: field.key,
      field
    })
    setTempFieldProperties({ ...field })
  }

  const closeFieldDialog = () => {
    setFieldDialogState({ open: false, nodeId: '', fieldKey: '', field: null })
    setTempFieldProperties({})
    setNewPropertyKey('')
    setNewPropertyValue('')
  }

  const saveFieldProperties = () => {
    if (!fieldDialogState.field) return

    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === fieldDialogState.nodeId
          ? {
            ...node,
            fields: node.fields.map(field =>
              field.key === fieldDialogState.fieldKey
                ? { ...field, ...tempFieldProperties } as FieldItem
                : field
            )
          }
          : node
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

  const toggleNodeMinimize = (nodeId: string) => {
    setMinimizedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }))
  }

  const deleteNode = (nodeId: string) => {
    // Start delete animation
    setDeletingNodes(prev => ({ ...prev, [nodeId]: true }))

    // Wait for animation to complete before actually removing the node
    setTimeout(() => {
      const updatedNodes = workflowData.nodes.filter(node => node.id !== nodeId)

      setWorkflowData(prev => ({
        ...prev,
        nodes: updatedNodes
      }))

      // Update node order after deletion
      updateNodeOrder(updatedNodes)

      // Clean up related states
      setMinimizedNodes(prev => {
        const { [nodeId]: removed, ...rest } = prev
        return rest
      })
      setNodePopoverStates(prev => {
        const { [nodeId]: removed, ...rest } = prev
        return rest
      })
      setDeletingNodes(prev => {
        const { [nodeId]: removed, ...rest } = prev
        return rest
      })
    }, 300) // Match animation duration
  }

  const openWorkflowDialog = () => {
    setWorkflowDialogState({ open: true })
    // Copy workflow properties excluding nodes and _class
    const { nodes, _class, ...workflowProps } = workflowData
    setTempWorkflowProperties({ ...workflowProps })
  }

  const closeWorkflowDialog = () => {
    setWorkflowDialogState({ open: false })
    setTempWorkflowProperties({})
    setNewWorkflowPropertyKey('')
    setNewWorkflowPropertyValue('')
  }

  const saveWorkflowProperties = () => {
    setWorkflowData(prev => ({
      ...prev,
      ...tempWorkflowProperties
    }))
    closeWorkflowDialog()
  }

  const addNewWorkflowProperty = () => {
    if (newWorkflowPropertyKey.trim() && newWorkflowPropertyValue.trim()) {
      setTempWorkflowProperties(prev => ({
        ...prev,
        [newWorkflowPropertyKey]: newWorkflowPropertyValue
      }))
      setNewWorkflowPropertyKey('')
      setNewWorkflowPropertyValue('')
    }
  }

  const removeWorkflowProperty = (key: string) => {
    setTempWorkflowProperties(prev => {
      const { [key]: removed, ...rest } = prev
      return rest
    })
  }

  const updateWorkflowPropertyValue = (key: string, value: any) => {
    setTempWorkflowProperties(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const openNodeDialog = (nodeId: string) => {
    setNodeDialogState({ open: true, nodeId })
    // Copy node properties excluding fields and order
    const node = workflowData.nodes.find(n => n.id === nodeId)
    if (node) {
      const { fields, order, ...nodeProps } = node
      setTempNodeProperties({ ...nodeProps })
    }
  }

  const closeNodeDialog = () => {
    setNodeDialogState({ open: false, nodeId: '' })
    setTempNodeProperties({})
    setNewNodePropertyKey('')
    setNewNodePropertyValue('')
  }

  const saveNodeProperties = () => {
    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeDialogState.nodeId
          ? { ...node, ...tempNodeProperties }
          : node
      )
    }))
    closeNodeDialog()
  }

  const addNewNodeProperty = () => {
    if (newNodePropertyKey.trim() && newNodePropertyValue.trim()) {
      setTempNodeProperties(prev => ({
        ...prev,
        [newNodePropertyKey]: newNodePropertyValue
      }))
      setNewNodePropertyKey('')
      setNewNodePropertyValue('')
    }
  }

  const removeNodeProperty = (key: string) => {
    setTempNodeProperties(prev => {
      const { [key]: removed, ...rest } = prev
      return rest
    })
  }

  const updateNodePropertyValue = (key: string, value: any) => {
    setTempNodeProperties(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const moveField = useCallback((nodeId: string, dragIndex: number, hoverIndex: number) => {
    const node = workflowData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const newFields = [...node.fields];
    const draggedField = newFields[dragIndex];
    
    newFields.splice(dragIndex, 1);
    newFields.splice(hoverIndex, 0, draggedField);

    // Auto-assign order based on new array index
    const fieldsWithOrder = newFields.map((field, index) => ({
      ...field,
      order: index + 1
    }));

    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId
          ? { ...n, fields: fieldsWithOrder }
          : n
      )
    }));
  }, [workflowData.nodes]);

  // DraggableNode component
  const DraggableNode = ({ 
    node, 
    nodeIndex, 
    moveNode 
  }: {
    node: NodeItem,
    nodeIndex: number,
    moveNode: (dragIndex: number, hoverIndex: number) => void
  }) => {
    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.NODE,
      item: { index: nodeIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    })

    const [, drop] = useDrop({
      accept: ItemTypes.NODE,
      hover: (item: { index: number }) => {
        if (!drag) return

        const dragIndex = item.index
        const hoverIndex = nodeIndex

        if (dragIndex === hoverIndex) return

        moveNode(dragIndex, hoverIndex)
        item.index = hoverIndex
      },
    })

    return (
      <div
        ref={(node) => drag(drop(node))}
        className={`bg-black w-full p-5 rounded-4xl transition-all duration-300 ease-in-out overflow-visible relative ${
          deletingNodes[node.id]
            ? 'opacity-0 scale-95 transform -translate-y-2'
            : 'opacity-100 scale-100 transform translate-y-0'
        } ${
          isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        } cursor-move`}
      >
        {/* Node drag handle */}
        <div className="absolute left-2 top-10 transform -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-100 transition-opacity">
          <GripVertical className="w-5 h-5 text-gray-500" />
        </div>

        <div className="flex justify-between items-center mb-4">
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors group ml-6"
            onClick={() => openNodeDialog(node.id)}
          >
            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded flex-shrink-0">
              #{node.order || nodeIndex + 1}
            </span>
            <h1 className="text-sm lg:text-xl text-white font-bold">{node.name}</h1>
            <Pencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex gap-2">
            <Popover
              open={getNodePopoverState(node.id).open}
              onOpenChange={(open) => setNodePopoverState(node.id, { open })}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={getNodePopoverState(node.id).open}
                  className="w-auto justify-between"
                >
                  {getNodePopoverState(node.id).value
                    ? fields.find((field) => field.key === getNodePopoverState(node.id).value)?.label
                    : "Add Field"}
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
                              const generateUniqueKey = (baseKey: string, existingFields: FieldItem[]): string => {
                                let counter = 1;
                                let newKey = baseKey;

                                while (existingFields.some(f => f.key === newKey)) {
                                  newKey = `${baseKey}_${counter}`;
                                  counter++;
                                }

                                return newKey;
                              };

                              const uniqueKey = generateUniqueKey(selectedField.key, node.fields);

                              // Create a new field with unique key and preserve all properties
                              const newField = {
                                ...selectedField,
                                key: uniqueKey,
                                order: node.fields.length + 1 // Auto-assign order
                              };

                              // Add field to the current node
                              const updatedFields = [...node.fields, newField];

                              setWorkflowData(prev => ({
                                ...prev,
                                nodes: prev.nodes.map(n =>
                                  n.id === node.id
                                    ? {
                                      ...n,
                                      fields: updatedFields
                                    }
                                    : n
                                )
                              }));

                              // Update field order
                              updateFieldOrder(node.id, updatedFields);
                            }

                            setNodePopoverState(node.id, { value: "", open: false })
                          }}
                        >
                          {field.label}
                          <Check
                            className={cn(
                              "ml-auto",
                              getNodePopoverState(node.id).value === field.key ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="secondary"
              onClick={() => toggleNodeMinimize(node.id)}
            >
              {minimizedNodes[node.id] ? 'Expand' : 'Minimize'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm(`Are you sure you want to delete node "${node.name}"?`)) {
                  deleteNode(node.id)
                }
              }}
              disabled={deletingNodes[node.id]}
            >
              {deletingNodes[node.id] ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Display node fields */}
        <div className={`overflow-visible transition-all duration-300 ease-in-out ${
          minimizedNodes[node.id]
            ? 'max-h-0 opacity-0 overflow-hidden'
            : 'max-h-none opacity-100 overflow-visible'
        }`}>
          <div className="flex flex-col gap-3 w-full pt-4 overflow-visible">
            {node.fields && node.fields.length > 0 ? (
              <>
                {/* Field count indicator */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">
                    {node.fields.length} field{node.fields.length !== 1 ? 's' : ''} added
                  </span>
                  <div className="flex gap-1">
                    <span className="text-xs text-gray-500">
                      Drag to reorder • Click to edit
                    </span>
                  </div>
                </div>

                {/* Fields container with full height - no scroll */}
                <div className="space-y-3 w-full">
                  {node.fields.map((field, fieldIndex) => (
                    <DraggableField
                      key={field.key}
                      field={field}
                      fieldIndex={fieldIndex}
                      nodeId={node.id}
                      moveField={(dragIndex: number, hoverIndex: number) => 
                        moveField(node.id, dragIndex, hoverIndex)
                      }
                    />
                  ))}
                </div>

                {/* Collapse indicator when there are many fields */}
                {node.fields.length > 5 && (
                  <div className="text-center">
                    <button
                      onClick={() => toggleNodeMinimize(node.id)}
                      className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {minimizedNodes[node.id] ? 'Show all fields' : `Showing ${node.fields.length} fields • Click to collapse`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-400 text-center py-6 border-2 border-dashed border-gray-600 rounded-lg">
                <p className="text-sm">No fields added yet</p>
                <p className="text-xs mt-1">Use "Add Field" button above to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const moveNode = useCallback((dragIndex: number, hoverIndex: number) => {
    const newNodes = [...workflowData.nodes];
    const draggedNode = newNodes[dragIndex];
    
    newNodes.splice(dragIndex, 1);
    newNodes.splice(hoverIndex, 0, draggedNode);

    // Auto-assign order based on new array index
    const nodesWithOrder = newNodes.map((node, index) => ({
      ...node,
      order: index + 1
    }));

    setWorkflowData(prev => ({
      ...prev,
      nodes: nodesWithOrder
    }));
  }, [workflowData.nodes]);
    console.log('moveFieldDownInContainer called:', { nodeId, fieldKey })
    console.log('workflowData.nodes:', workflowData.nodes)

    const node = workflowData.nodes.find(n => n.id === nodeId)
    console.log('found node:', node)

    if (!node || !node.fields) {
      console.log('Node or node.fields is undefined')
      return
    }

    const currentFieldIndex = node.fields.findIndex(f => f.key === fieldKey)

    // Can't move down if already at the bottom
    if (currentFieldIndex >= node.fields.length - 1) return

    const newFields = [...node.fields]
    // Swap with the field below
    const temp = newFields[currentFieldIndex]
    newFields[currentFieldIndex] = newFields[currentFieldIndex + 1]
    newFields[currentFieldIndex + 1] = temp

    // Update the workflow data
    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId
          ? { ...n, fields: newFields }
          : n
      )
    }))

    // Update field order
    updateFieldOrder(nodeId, newFields)
  }

  const moveFieldUpInContainer = (nodeId: string, fieldKey: string) => {
    const node = workflowData.nodes.find(n => n.id === nodeId)
    if (!node || !node.fields) return // Add safety check

    const currentFieldIndex = node.fields.findIndex(f => f.key === fieldKey)

    // Can't move up if already at the top
    if (currentFieldIndex <= 0) return

    const newFields = [...node.fields]
    // Swap with the field above
    const temp = newFields[currentFieldIndex]
    newFields[currentFieldIndex] = newFields[currentFieldIndex - 1]
    newFields[currentFieldIndex - 1] = temp

    // Update the workflow data
    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === nodeId
          ? { ...n, fields: newFields }
          : n
      )
    }))

    // Update field order
    updateFieldOrder(nodeId, newFields)
  }

  const updateFieldOrder = (nodeId: string, fields: FieldItem[]) => {
    // Auto-assign order based on array index
    const fieldsWithOrder = fields.map((field, index) => ({
      ...field,
      order: index + 1
    }))

    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId
          ? { ...node, fields: fieldsWithOrder }
          : node
      )
    }))
  }

  const updateNodeOrder = (nodes: NodeItem[]) => {
    // Auto-assign order based on array index
    const nodesWithOrder = nodes.map((node, index) => ({
      ...node,
      order: index + 1
    }))

    setWorkflowData(prev => ({
      ...prev,
      nodes: nodesWithOrder
    }))
  }

  const handleFieldDragStart = (e: React.DragEvent, nodeId: string, fieldIndex: number) => {
    setDraggedField({ nodeId, fieldIndex })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleFieldDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleFieldDrop = (e: React.DragEvent, targetNodeId: string, targetIndex: number) => {
    e.preventDefault()

    if (!draggedField || draggedField.nodeId !== targetNodeId) {
      setDraggedField(null)
      return
    }

    const node = workflowData.nodes.find(n => n.id === targetNodeId)
    if (!node) return

    // Don't do anything if dropping in the same position
    if (draggedField.fieldIndex === targetIndex) {
      setDraggedField(null)
      return
    }

    const newFields = [...node.fields]
    const draggedFieldData = newFields[draggedField.fieldIndex]

    // Remove the dragged field from its current position
    newFields.splice(draggedField.fieldIndex, 1)

    // Calculate the correct target index after removal
    // If we're moving from a higher index to a lower index, the target index stays the same
    // If we're moving from a lower index to a higher index, we need to adjust by -1
    const adjustedTargetIndex = draggedField.fieldIndex < targetIndex ? targetIndex - 1 : targetIndex

    // Insert at the new position
    newFields.splice(adjustedTargetIndex, 0, draggedFieldData)

    // Auto-assign order based on new array index and update the workflow data
    const fieldsWithOrder = newFields.map((field, index) => ({
      ...field,
      order: index + 1
    }))

    // Update the workflow data with the reordered fields
    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === targetNodeId
          ? { ...n, fields: fieldsWithOrder }
          : n
      )
    }))

    setDraggedField(null)
  }

  const handleNodeDragStart = (e: React.DragEvent, nodeIndex: number) => {
    setDraggedNode(nodeIndex)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleNodeDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleNodeDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()

    if (draggedNode === null) {
      setDraggedNode(null)
      return
    }

    // Don't do anything if dropping in the same position
    if (draggedNode === targetIndex) {
      setDraggedNode(null)
      return
    }

    const newNodes = [...workflowData.nodes]
    const draggedNodeData = newNodes[draggedNode]

    // Remove the dragged node from its current position
    newNodes.splice(draggedNode, 1)

    // Calculate the correct target index after removal
    const adjustedTargetIndex = draggedNode < targetIndex ? targetIndex - 1 : targetIndex

    // Insert at the new position
    newNodes.splice(adjustedTargetIndex, 0, draggedNodeData)

    // Update node order
    updateNodeOrder(newNodes)
    setDraggedNode(null)
  }

  const toggleFieldMinimize = (fieldKey: string) => {
    setMinimizedFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }))
  }

  const addSubField = (nodeId: string, parentFieldKey: string, selectedField: any) => {
    const generateUniqueKey = (baseKey: string, existingFields: any[]): string => {
      let counter = 1;
      let newKey = baseKey;

      while (existingFields.some(f => f.key === newKey)) {
        newKey = `${baseKey}_${counter}`;
        counter++;
      }

      return newKey;
    };

    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId
          ? {
            ...node,
            fields: node.fields.map(field =>
              field.key === parentFieldKey
                ? {
                  ...field,
                  fields: [
                    ...(field.fields || []),
                    {
                      ...selectedField,
                      key: generateUniqueKey(selectedField.key, field.fields || []),
                      order: (field.fields || []).length + 1
                    }
                  ]
                }
                : field
            )
          }
          : node
      )
    }));
  }

  const updateSubFieldOrder = (nodeId: string, parentFieldKey: string, subFields: any[]) => {
    const fieldsWithOrder = subFields.map((field, index) => ({
      ...field,
      order: index + 1
    }));

    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId
          ? {
            ...node,
            fields: node.fields.map(field =>
              field.key === parentFieldKey
                ? { ...field, fields: fieldsWithOrder }
                : field
            )
          }
          : node
      )
    }));
  }

  const FieldRenderer = ({
    field,
    fieldIndex,
    nodeId,
    parentPath = '',
    level = 0
  }: {
    field: any,
    fieldIndex: number,
    nodeId: string,
    parentPath?: string,
    level?: number
  }) => {
    const fieldPath = parentPath ? `${parentPath}.${field.key}` : field.key;
    const hasSubFields = field.fields && Array.isArray(field.fields) && field.fields.length > 0;
    const canHaveSubFields = field.fields !== undefined; // Has fields property (even if empty)

    return (
      <div className={`ml-${level * 4}`}>
        <div
          key={field.key}
          className={`bg-gray-800 p-3 rounded-lg group relative transition-all duration-200 hover:bg-gray-750 ${draggedField?.nodeId === nodeId && draggedField?.fieldIndex === fieldIndex
            ? 'opacity-50 scale-95'
            : 'opacity-100 scale-100'
            } min-h-[60px] flex flex-col justify-center`}
          draggable={true}
          onDragStart={(e) => handleFieldDragStart(e, nodeId, fieldIndex)}
          onDragOver={handleFieldDragOver}
          onDrop={(e) => handleFieldDrop(e, nodeId, fieldIndex)}
        >
          {/* Drag handle */}
          <div className="absolute left-1 top-1/2 transform -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>

          {/* Field content */}
          <div
            className="cursor-pointer hover:bg-gray-700 transition-colors p-2 -m-2 rounded-lg ml-4 mr-16"
            onClick={() => openFieldDialog(nodeId, field)}
          >
            {/* Main field info */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded flex-shrink-0">
                  #{field.order || fieldIndex + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium block truncate">
                      {field.label}
                    </span>
                    {canHaveSubFields && (
                      <span className="text-xs text-blue-400 bg-blue-900 px-2 py-1 rounded">
                        Container ({(field.fields || []).length})
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

            {/* Additional field info - compact */}
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
              {field.key !== field.label && (
                <span>Key: {field.key}</span>
              )}
            </div>
          </div>

          {/* Control buttons */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            {/* Container controls */}
            {canHaveSubFields && (
              <div className="flex gap-1 mb-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer text-xs"
                      title="Add sub-field"
                    >
                      +
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Command>
                      <CommandInput placeholder="Search field..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No field found.</CommandEmpty>
                        <CommandGroup>
                          {fields.map((availableField) => (
                            <CommandItem
                              key={availableField.key}
                              value={availableField.key}
                              onSelect={() => {
                                addSubField(nodeId, field.key, availableField);
                              }}
                            >
                              {availableField.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {hasSubFields && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFieldMinimize(fieldPath);
                    }}
                    className="p-1 rounded bg-gray-600 hover:bg-gray-500 transition-colors cursor-pointer text-xs"
                    title={minimizedFields[fieldPath] ? "Expand" : "Collapse"}
                  >
                    {minimizedFields[fieldPath] ? "+" : "-"}
                  </button>
                )}
              </div>
            )}

            {/* Arrow buttons */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveFieldUpInContainer(nodeId, field.key);
                }}
                disabled={fieldIndex === 0}
                className={`p-1 rounded bg-gray-600 hover:bg-gray-500 transition-colors ${fieldIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                title="Move up"
              >
                <ArrowUp className="w-3 h-3 text-gray-300" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveFieldDownInContainer(nodeId, field.key);
                }}
                disabled={fieldIndex === field.fields?.length - 1}
                className={`p-1 rounded bg-gray-600 hover:bg-gray-500 transition-colors ${fieldIndex === field.fields?.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                title="Move down"
              >
                <ArrowDown className="w-3 h-3 text-gray-300" />
              </button>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Remove field "${field.label}"?`)) {
                  if (parentPath) {
                    // Remove sub-field
                    const pathParts = parentPath.split('.');
                    // Implementation for removing nested field would go here
                  } else {
                    // Remove main field
                    const updatedFields = workflowData.nodes.find(n => n.id === nodeId)?.fields.filter(f => f.key !== field.key) || [];
                    setWorkflowData(prev => ({
                      ...prev,
                      nodes: prev.nodes.map(n =>
                        n.id === nodeId
                          ? { ...n, fields: updatedFields }
                          : n
                      )
                    }));
                    updateFieldOrder(nodeId, updatedFields);
                  }
                }
              }}
              className="p-1 rounded bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
              title="Delete field"
            >
              <span className="text-white text-xs font-bold">✕</span>
            </button>
          </div>
        </div>

        {/* Render sub-fields */}
        {hasSubFields && !minimizedFields[fieldPath] && (
          <div className="ml-4 mt-2 space-y-2 border-l-2 border-gray-600 pl-4">
            <div className="text-xs text-gray-400 mb-2">
              {field.fields.length} sub-field{field.fields.length !== 1 ? 's' : ''}
            </div>
            {field.fields.map((subField: any, subIndex: number) => (
              <FieldRenderer
                key={subField.key}
                field={subField}
                fieldIndex={subIndex}
                nodeId={nodeId}
                parentPath={fieldPath}
                level={level + 1}
              />
            ))}
          </div>
        )}

        {/* Empty state for container fields */}
        {canHaveSubFields && (!field.fields || field.fields.length === 0) && !minimizedFields[fieldPath] && (
          <div className="ml-4 mt-2 text-gray-500 text-xs italic border-l-2 border-gray-600 pl-4">
            No sub-fields added. Use the "+" button to add sub-fields.
          </div>
        )}
      </div>
    );
  };

  // Initialize code content when component mounts or workflowData changes
  useEffect(() => {
    setCodeContent(JSON.stringify(workflowData, null, 2))
  }, [workflowData])

  const handleSaveCode = () => {
    try {
      const parsed = JSON.parse(codeContent) as WorkflowData
      setWorkflowData(parsed) // Update the main data object
      alert("Code saved successfully!")
    } catch (error) {
      alert("Invalid JSON format. Please fix the syntax errors.")
    }
  }

  const handleFormatCode = () => {
    try {
      const parsed = JSON.parse(codeContent) as WorkflowData
      const formatted = JSON.stringify(parsed, null, 2)
      setCodeContent(formatted)
    } catch (error) {
      alert("Cannot format: Invalid JSON syntax")
    }
  }

  const handleExportCode = () => {
    try {
      const parsed = JSON.parse(codeContent) as WorkflowData
      const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'workflow.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert("Cannot export: Invalid JSON syntax")
    }
  }

  return (
    <div className="font-sans flex flex-col items-center justify-center min-h-screen pb-20 gap-16 lg:p-20 lg:pt-30 p-8 w-full">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-bold text-gray-800">Workflow Canvas</h1>
        <div className="flex gap-4">
          <Button
            variant={currentView === "node" ? "default" : "outline"}
            onClick={() => setCurrentView("node")}
          >
            Node View
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
        {currentView === "node" ? (
          <>
            <div className="flex justify-between items-center w-full">
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors group"
                onClick={openWorkflowDialog}
              >
                <h1 className="text-2xl font-bold text-gray-800">{workflowData.name || 'Workflow Template'}</h1>
                <Pencil className="w-5 h-5 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <Button variant="outline" onClick={() => {
                // Add a new node using template
                const newNode = createNewNodeTemplate();

                // Auto-assign order
                const newNodeWithOrder = {
                  ...newNode,
                  order: workflowData.nodes.length + 1
                };

                const updatedNodes = [...workflowData.nodes, newNodeWithOrder];

                setWorkflowData(prev => ({
                  ...prev,
                  nodes: updatedNodes
                }));

                // Update node order
                updateNodeOrder(updatedNodes);
              }}>
                Add Node
              </Button>
            </div>

            {workflowData.nodes && workflowData.nodes.length > 0 ? ( // Add safety check
              // Display existing nodes
              <div className="w-full space-y-4 overflow-visible">
                {workflowData.nodes.map((node, nodeIndex) => (
                  <div
                    key={node.id}
                    className={`bg-black w-full p-5 rounded-4xl transition-all duration-300 ease-in-out overflow-visible relative ${deletingNodes[node.id]
                      ? 'opacity-0 scale-95 transform -translate-y-2'
                      : 'opacity-100 scale-100 transform translate-y-0'
                      } ${draggedNode === nodeIndex
                        ? 'opacity-50 scale-95'
                        : 'opacity-100 scale-100'
                      }`}
                    draggable={true}
                    onDragStart={(e) => handleNodeDragStart(e, nodeIndex)}
                    onDragOver={handleNodeDragOver}
                    onDrop={(e) => handleNodeDrop(e, nodeIndex)}
                  >
                    {/* Node drag handle */}
                    <div className="absolute left-2 top-10 transform -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-100 transition-opacity">
                      <GripVertical className="w-5 h-5 text-gray-500" />
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors group ml-6"
                        onClick={() => openNodeDialog(node.id)}
                      >
                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded flex-shrink-0">
                          #{node.order || nodeIndex + 1}
                        </span>
                        <h1 className="text-sm lg:text-xl text-white font-bold">{node.name}</h1>
                        <Pencil className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="flex gap-2">
                        <Popover
                          open={getNodePopoverState(node.id).open}
                          onOpenChange={(open) => setNodePopoverState(node.id, { open })}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={getNodePopoverState(node.id).open}
                              className="w-auto justify-between"
                            >
                              {getNodePopoverState(node.id).value
                                ? fields.find((field) => field.key === getNodePopoverState(node.id).value)?.label
                                : "Add Field"}
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
                                          const generateUniqueKey = (baseKey: string, existingFields: FieldItem[]): string => {
                                            let counter = 1;
                                            let newKey = baseKey;

                                            while (existingFields.some(f => f.key === newKey)) {
                                              newKey = `${baseKey}_${counter}`;
                                              counter++;
                                            }

                                            return newKey;
                                          };

                                          const uniqueKey = generateUniqueKey(selectedField.key, node.fields);

                                          // Create a new field with unique key and preserve all properties
                                          const newField = {
                                            ...selectedField,
                                            key: uniqueKey,
                                            order: node.fields.length + 1 // Auto-assign order
                                          };

                                          // Add field to the current node
                                          const updatedFields = [...node.fields, newField];

                                          setWorkflowData(prev => ({
                                            ...prev,
                                            nodes: prev.nodes.map(n =>
                                              n.id === node.id
                                                ? {
                                                  ...n,
                                                  fields: updatedFields
                                                }
                                                : n
                                            )
                                          }));

                                          // Update field order
                                          updateFieldOrder(node.id, updatedFields);
                                        }

                                        setNodePopoverState(node.id, { value: "", open: false })
                                      }}
                                    >
                                      {field.label}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          getNodePopoverState(node.id).value === field.key ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="secondary"
                          onClick={() => toggleNodeMinimize(node.id)}
                        >
                          {minimizedNodes[node.id] ? 'Expand' : 'Minimize'}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete node "${node.name}"?`)) {
                              deleteNode(node.id)
                            }
                          }}
                          disabled={deletingNodes[node.id]}
                        >
                          {deletingNodes[node.id] ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>

                    {/* Display node fields */}
                    <div className={`overflow-visible transition-all duration-300 ease-in-out ${minimizedNodes[node.id]
                      ? 'max-h-0 opacity-0 overflow-hidden'
                      : 'max-h-none opacity-100 overflow-visible'
                      }`}>
                      <div className="flex flex-col gap-3 w-full pt-4 overflow-visible">
                        {node.fields && node.fields.length > 0 ? (
                          <>
                            {/* Field count indicator */}
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-gray-400">
                                {node.fields.length} field{node.fields.length !== 1 ? 's' : ''} added
                              </span>
                              <div className="flex gap-1">
                                <span className="text-xs text-gray-500">
                                  Drag to reorder • Click to edit
                                </span>
                              </div>
                            </div>

                            {/* Fields container with full height - no scroll */}
                            <div className="space-y-3 w-full">
                              {node.fields.map((field, fieldIndex) => (
                                <FieldRenderer
                                  key={field.key}
                                  field={field}
                                  fieldIndex={fieldIndex}
                                  nodeId={node.id}
                                />
                              ))}
                            </div>

                            {/* Collapse indicator when there are many fields */}
                            {node.fields.length > 5 && (
                              <div className="text-center">
                                <button
                                  onClick={() => toggleNodeMinimize(node.id)}
                                  className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                  {minimizedNodes[node.id] ? 'Show all fields' : `Showing ${node.fields.length} fields • Click to collapse`}
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-gray-400 text-center py-6 border-2 border-dashed border-gray-600 rounded-lg">
                            <p className="text-sm">No fields added yet</p>
                            <p className="text-xs mt-1">Use "Add Field" button above to get started</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Display empty state
              <div className="bg-black w-full p-5 rounded-4xl">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-sm lg:text-xl text-white font-bold">No Nodes</h1>
                </div>
                <div className="flex flex-col gap-4 w-full">
                  <div className="text-gray-400 text-center py-8">
                    <p className="text-lg mb-2">No nodes in this workflow</p>
                    <p className="text-sm">Click "Add Node" button above to create your first node</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-800">Code Editor</h1>
            <div className="bg-gray-900 w-full h-full p-5 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg text-white font-bold">workflow.json</h2>
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
                  placeholder="Enter your JSON code here..."
                />
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

      {/* Workflow Properties Dialog */}
      <Dialog open={workflowDialogState.open} onOpenChange={(open) => !open && closeWorkflowDialog()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workflow Properties</DialogTitle>
            <DialogDescription>
              Manage workflow settings and metadata (nodes and _class cannot be edited here)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Display existing properties */}
            <div className="space-y-3">
              <h4 className="font-medium">Current Properties</h4>
              {Object.entries(tempWorkflowProperties).map(([key, value]) => (
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
                      updateWorkflowPropertyValue(key, newValue);
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeWorkflowProperty(key)}
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
                  value={newWorkflowPropertyKey}
                  onChange={(e) => setNewWorkflowPropertyKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Property value"
                  value={newWorkflowPropertyValue}
                  onChange={(e) => setNewWorkflowPropertyValue(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addNewWorkflowProperty}>Add</Button>
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
            <Button onClick={saveWorkflowProperties}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node Properties Dialog */}
      <Dialog open={nodeDialogState.open} onOpenChange={(open) => !open && closeNodeDialog()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Node Properties</DialogTitle>
            <DialogDescription>
              Manage node settings and metadata (fields and order cannot be edited here)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Display existing properties */}
            <div className="space-y-3">
              <h4 className="font-medium">Current Properties</h4>
              {Object.entries(tempNodeProperties).map(([key, value]) => (
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
                      updateNodePropertyValue(key, newValue);
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeNodeProperty(key)}
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
                  value={newNodePropertyKey}
                  onChange={(e) => setNewNodePropertyKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Property value"
                  value={newNodePropertyValue}
                  onChange={(e) => setNewNodePropertyValue(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addNewNodeProperty}>Add</Button>
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
            <Button onClick={saveNodeProperties}>Save Changes</Button>
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
  );
}
