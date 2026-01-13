import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // We need uuid, I forgot to install it. I'll use simple random string for now.

const generateId = () => Math.random().toString(36).substr(2, 9);

export function useFilter(initialData) {
    const [filterTree, setFilterTree] = useState({
        id: generateId(),
        type: 'group',
        logic: 'AND',
        children: []
    });

    const addCondition = (parentId) => {
        const newCondition = {
            id: generateId(),
            type: 'condition',
            field: '',
            operator: 'is',
            value: ''
        };

        setFilterTree(prev => insertNode(prev, parentId, newCondition));
    };

    const addGroup = (parentId) => {
        const newGroup = {
            id: generateId(),
            type: 'group',
            logic: 'AND',
            children: []
        };
        setFilterTree(prev => insertNode(prev, parentId, newGroup));
    };

    const removeNode = (nodeId) => {
        setFilterTree(prev => deleteNode(prev, nodeId));
    };

    const updateNode = (nodeId, updates) => {
        setFilterTree(prev => modifyNode(prev, nodeId, updates));
    };

    return {
        filterTree,
        addCondition,
        addGroup,
        removeNode,
        updateNode,
        setFilterTree
    };
}

// Helpers for recursive immutable updates
function insertNode(root, parentId, newNode) {
    if (root.id === parentId && root.type === 'group') {
        return { ...root, children: [...root.children, newNode] };
    }
    if (root.children) {
        return {
            ...root,
            children: root.children.map(child => insertNode(child, parentId, newNode))
        };
    }
    return root;
}

function deleteNode(root, nodeId) {
    if (root.children) {
        return {
            ...root,
            children: root.children
                .filter(child => child.id !== nodeId)
                .map(child => deleteNode(child, nodeId))
        };
    }
    return root;
}

function modifyNode(root, nodeId, updates) {
    if (root.id === nodeId) {
        return { ...root, ...updates };
    }
    if (root.children) {
        return {
            ...root,
            children: root.children.map(child => modifyNode(child, nodeId, updates))
        };
    }
    return root;
}
