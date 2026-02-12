import React, { useState, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import AceEditor from 'react-ace';
import type { WorkflowData, NodeItem, FieldItem } from './workflowData';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FiCode, FiEye } from 'react-icons/fi';


import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';

interface WorkflowCanvasProps {
    setSelectedNode: (node: any) => void;
}

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ setSelectedNode }) => {
    const [workflowData, setWorkflowData] = useState<WorkflowData>({
        _id: 'workflowTemplate',
        name: 'Workflow Template',
        notifWorker: 5,
        _vsb: 'ACTIVE',
        nodes: [],
        _class: 'biz.byonchat.v2.services.workflow.models.Workflow',
    });

    useEffect(() => {
        console.log("Updated workflowData:", workflowData);
    }, [workflowData]);

    const [isCodeView, setIsCodeView] = useState(false); // State untuk switch view
    const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // const [, drop] = useDrop(() => ({
    //   accept: ['NODE', 'FIELD'],
    //   drop: (item: any, monitor) => {

    //     const clientOffset = monitor.getClientOffset();
    //     if (!clientOffset) return;

    //     console.log('Dropped item:', item);
    //     console.log('Cursor position:', clientOffset);

    //     setWorkflowData((prev) => {
    //       let newWorkflow = { ...prev };

    //       if (monitor.getItemType() === 'NODE') {
    //         const maxId = newWorkflow.nodes.reduce((max, node) => {
    //           const match = node.id.match(/\d+$/);
    //           const nodeId = match ? parseInt(match[0]) : 0;
    //           return Math.max(max, nodeId);
    //         }, 0);

    //         const newId = maxId + 1;
    //         const formId = "form" + newId;
    //         const newItem = { ...item, id: formId };

    //         // Buat array baru
    //         newWorkflow = {
    //           ...newWorkflow,
    //           nodes: [...newWorkflow.nodes, newItem]
    //         };
    //       }

    //       if (monitor.getItemType() === 'FIELD') {
    //         const updatedNodes = newWorkflow.nodes.map((node) => {
    //           const nodeRef = nodeRefs.current.get(node.id);
    //           if (!nodeRef) return node;

    //           const rect = nodeRef.getBoundingClientRect();
    //           const isTarget =
    //             clientOffset.x >= rect.left &&
    //             clientOffset.x <= rect.right &&
    //             clientOffset.y >= rect.top &&
    //             clientOffset.y <= rect.bottom;

    //           if (!isTarget) return node;

    //           const baseKey = item.key;
    //           let newKey = baseKey;
    //           let counter = 1;

    //           while ((node.fields || []).some(f => f.key === newKey)) {
    //             newKey = `${baseKey}_${counter}`;
    //             counter++;
    //           }

    //           const newField = { ...item, key: newKey };
    //           return {
    //             ...node,
    //             fields: [...(node.fields || []), newField]
    //           };
    //         });

    //         newWorkflow = {
    //           ...newWorkflow,
    //           nodes: updatedNodes
    //         };
    //       }

    //       return newWorkflow;
    //     });
    //   },
    // }));

    const [, drop] = useDrop({
        accept: ['NODE', 'FIELD'],
        drop: (item: any, monitor) => {
            if (!monitor.didDrop()) {
                if (monitor.getItemType() === 'NODE') {
                    handleDrop(item);
                }

                if (monitor.getItemType() === 'FIELD') {
                    const clientOffset = monitor.getClientOffset();
                    if (clientOffset) {
                        handleDropField(item, clientOffset);
                    }
                }
            }
        },
    });

    const handleDrop = (item: NodeItem) => {
        setWorkflowData((prev) => {
            // Cari ID tertinggi dari node yang sudah ada
            const maxId = prev.nodes.reduce((max, node) => {
                const match = node.id.match(/\d+$/); // ambil angka di akhir ID
                const nodeId = match ? parseInt(match[0]) : 0;
                return Math.max(max, nodeId);
            }, 0);

            const newId = maxId + 1;
            const formId = "form" + newId;

            // Buat node baru dengan ID baru
            const newItem: NodeItem = {
                ...item,
                id: formId,
            };

            return {
                ...prev,
                nodes: [...prev.nodes, newItem], // simpan node baru
            };
        });
    };


    const handleDropField = (item: FieldItem, clientOffset: { x: number; y: number }) => {
        setWorkflowData((prev) => {
            const updatedNodes = prev.nodes.map((node) => {
                const nodeRef = nodeRefs.current.get(node.id);
                if (!nodeRef) return node;

                const rect = nodeRef.getBoundingClientRect();
                const isInside =
                    clientOffset.x >= rect.left &&
                    clientOffset.x <= rect.right &&
                    clientOffset.y >= rect.top &&
                    clientOffset.y <= rect.bottom;

                if (!isInside) return node;

                // Salin fields yang ada
                const currentFields = node.fields || [];

                let baseKey = item.key;
                let newKey = baseKey;
                let counter = 1;

                while (currentFields.some((f) => f.key === newKey)) {
                    newKey = `${baseKey}_${counter}`;
                    counter++;
                }

                const newItem = { ...item, key: newKey };

                return {
                    ...node,
                    fields: [...currentFields, newItem],
                };
            });

            return {
                ...prev,
                nodes: updatedNodes,
            };
        });
    };


    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const [droppablePrefix, nodeId] = result.source.droppableId.split('-');

        if (!nodeId) return;

        setWorkflowData(prev => {
            const updatedNodes = [...prev.nodes];
            const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);

            if (nodeIndex === -1 || !updatedNodes[nodeIndex].fields) return prev;

            const fields = [...(updatedNodes[nodeIndex].fields ?? [])];
            const [movedItem] = fields.splice(result.source.index, 1);
            fields.splice(result.destination.index, 0, movedItem);
            updatedNodes[nodeIndex].fields = fields;

            return {
                ...prev,
                nodes: updatedNodes,
            };
        });
    };

    const handleEditorChange = (newValue: string) => {
        try {
            const parsedData = JSON.parse(newValue);
            setWorkflowData(parsedData);
        } catch (error) {
            console.error("JSON parse error:", error);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2));
    };

    const handlePretty = () => {
        try {
            const prettyJSON = JSON.stringify(JSON.parse(JSON.stringify(workflowData)), null, 2);
            setWorkflowData(JSON.parse(prettyJSON));
        } catch (error) {
            console.error("Failed to pretty format:", error);
        }
    };

    const handleDeleteNode = (nodeId: string) => {
        setWorkflowData(prev => ({
            ...prev,
            nodes: prev.nodes.filter(n => n.id !== nodeId),
        }));
    };

    const handleDeleteField = (nodeId: string, fieldIndex: number) => {
        setWorkflowData(prev => ({
            ...prev,
            nodes: prev.nodes.map(node =>
                node.id === nodeId
                    ? {
                        ...node,
                        fields: node.fields?.filter((_, index) => index !== fieldIndex),
                    }
                    : node
            ),
        }));
    };

    const [expandedFields, setExpandedFields] = useState<string[]>([]);

    const toggleFieldDetail = (key: string) => {
        setExpandedFields((prev) =>
            prev.includes(key)
                ? prev.filter((k) => k !== key)
                : [...prev, key]
        );
    };

    const updateField = (nodeId: string, fieldIndex: number, key: string, value: any) => {
        setWorkflowData(prev => {
            const newData = { ...prev };
            const node = newData.nodes.find(n => n.id === nodeId);
            if (node) {
                node.fields[fieldIndex] = {
                    ...node.fields[fieldIndex],
                    [key]: value
                };
            }
            return newData;
        });
    };

    const canvasRef = useRef<HTMLDivElement | null>(null);
    drop(canvasRef); // hubungkan ref ke drop target


    return (
        <div ref={canvasRef} className="workflow-canvas">
            <h2>Workflow Canvas</h2>
            <p>Drag and drop nodes here to create your workflow.</p>

            {/* Tombol Switch View */}
            <div className="switch-view-buttons">
                <button
                    onClick={() => setIsCodeView(false)}
                    className={`switch-view-button ${!isCodeView ? 'active' : ''}`}
                >
                    <FiEye className="icon" />
                    Drag-and-Drop View
                </button>
                <button
                    onClick={() => setIsCodeView(true)}
                    className={`switch-view-button ${isCodeView ? 'active' : ''}`}
                >
                    <FiCode className="icon" />
                    Code Editor View
                </button>
            </div>

            {/* Switch View */}
            {isCodeView ? (
                <AceEditor
                    mode="json"
                    theme="monokai"
                    value={JSON.stringify(workflowData, null, 2)}
                    onChange={handleEditorChange}
                    name="workflow-editor"
                    editorProps={{ $blockScrolling: true }}
                    setOptions={{ useWorker: false }}
                    className="code-editor"
                />
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="drag-drop-view">
                        {workflowData.nodes.map((node) => (
                            <div
                                key={node.id}
                                ref={(el) => {
                                    if (el) nodeRefs.current.set(node.id, el);
                                    else nodeRefs.current.delete(node.id);
                                }}
                                className="node"
                            >
                                <button
                                    className="close-btn"
                                    onClick={() => handleDeleteNode(node.id)}
                                >
                                    ×
                                </button>

                                <h3>{node.name}</h3>

                                <Droppable droppableId={`droppable-${node.id}`}>
                                    {(provided) => (
                                        <ul ref={provided.innerRef} {...provided.droppableProps}>
                                            {node.fields?.map((field, index) => {
                                                const key = field.key || index.toString();
                                                const isExpanded = expandedFields.includes(key);
                                                return (
                                                    <Draggable key={key} draggableId={key} index={index}>
                                                        {(provided) => (
                                                            <li
                                                                className="field"
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                    <strong>{field.label}</strong>
                                                                    <div>
                                                                        <button className='toggle' onClick={() => toggleFieldDetail(key)}>
                                                                            {isExpanded ? 'Sembunyikan' : 'Lihat Detail'}
                                                                        </button>
                                                                        <button
                                                                            className="close-btn small"
                                                                            onClick={() => handleDeleteField(node.id, index)}
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {isExpanded && (
                                                                    <div className="field-details">
                                                                        {/* field details code */}
                                                                    </div>
                                                                )}
                                                            </li>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            )}
        </div>
    );
};

export default WorkflowCanvas;
