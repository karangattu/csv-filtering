import React from 'react';
import { FilterCondition } from './FilterCondition';
import { Plus, Trash2, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

export function FilterGroup({ node, columns, types, addCondition, addGroup, removeNode, updateNode, depth = 0 }) {
    const isRoot = depth === 0;

    return (
        <div className={cn(
            "flex flex-col gap-2",
            !isRoot && "ml-8 p-4 border-l-2 border-blue-200 bg-gray-50/50 rounded-r-lg my-2"
        )}>
            <div className="flex items-center gap-4 mb-2">
                {/* Logic Toggle */}
                <div className="flex items-center bg-gray-200 rounded p-1 text-xs font-semibold">
                    <button
                        className={cn("px-3 py-1 rounded transition-all", node.logic === 'AND' ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-blue-600")}
                        onClick={() => updateNode(node.id, { logic: 'AND' })}
                    >
                        AND
                    </button>
                    <button
                        className={cn("px-3 py-1 rounded transition-all", node.logic === 'OR' ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-blue-600")}
                        onClick={() => updateNode(node.id, { logic: 'OR' })}
                    >
                        OR
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => addCondition(node.id)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
                    >
                        <Plus size={14} /> Condition
                    </button>
                    <button
                        onClick={() => addGroup(node.id)}
                        className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
                    >
                        <Plus size={14} /> Group
                    </button>
                </div>

                {!isRoot && (
                    <button
                        onClick={() => removeNode(node.id)}
                        className="ml-auto p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Remove group"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Children */}
            <div className="flex flex-col">
                {node.children.length === 0 && (
                    <div className="text-sm text-gray-400 italic p-2">No conditions. Add one to start filtering.</div>
                )}
                {node.children.map((child, index) => (
                    <React.Fragment key={child.id}>
                        {/* Visual connector (optional) */}
                        {child.type === 'group' ? (
                            <FilterGroup
                                node={child}
                                columns={columns}
                                types={types}
                                addCondition={addCondition}
                                addGroup={addGroup}
                                removeNode={removeNode}
                                updateNode={updateNode}
                                depth={depth + 1}
                            />
                        ) : (
                            <FilterCondition
                                node={child}
                                columns={columns}
                                types={types}
                                updateNode={updateNode}
                                removeNode={removeNode}
                            />
                        )}
                        {/* Logic Label between items */}
                        {index < node.children.length - 1 && (
                            <div className="ml-4 text-xs font-bold text-gray-400 py-1 uppercase tracking-wider">
                                {node.logic}
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
