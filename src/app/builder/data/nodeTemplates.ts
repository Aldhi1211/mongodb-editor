// Template untuk NodeItem baru
import type { NodeItem } from './workflowData';

export const createNewNodeTemplate = (nodeId?: string): NodeItem => {
  const id = nodeId || `node_${Date.now()}`;
  
  return {
    id,
    name: 'New Node',
    iconURL: 'https://ldap.byonchat2.com/iconsolo/barang_masuk/permintaan_pesanan.PNG',
    order: 1,
    type: 'FORM',
    _vsb: 'ACTIVE',
    showBtns: ['CREATE_TASK'],
    hideForCms: true,
    locTitle: 'New Node',
    submitType: 'SUBMIT',
    groups: ['teknisi'],
    routing: {
      defaultDest: {
        node: {
          workflowId: 'workflowTemplate',
          nodeId: 'form3',
        },
      },
    },
    preview: {
      title: 'Submit By : ${$.$.userInfo.name}',
      subtitle: 'New Node Subtitle',
    },
    assignment: {
      type: 'ALL',
    },
    locRequired: false,
    locPreview: false,
    fieldsAfterSubmit: [],
    fields: [],
    reportAccess: {
      byUserGroups: {
        '*': 'ALL',
      },
    },
    position: {
      x: -75,
      y: -15,
    },
  };
};

// Template untuk node dengan konfigurasi khusus
export const createFormNodeTemplate = (name: string, customConfig?: Partial<NodeItem>): NodeItem => {
  const baseTemplate = createNewNodeTemplate();
  
  return {
    ...baseTemplate,
    name,
    locTitle: name,
    ...customConfig,
  };
};

// Template untuk node approval
export const createApprovalNodeTemplate = (name: string): NodeItem => {
  return createFormNodeTemplate(name, {
    type: 'APPROVAL',
    showBtns: ['APPROVE', 'REJECT'],
    groups: ['manager'],
    preview: {
      title: 'Approval Request',
      subtitle: `${name} - Pending Approval`,
    },
  });
};

// Template untuk node task
export const createTaskNodeTemplate = (name: string): NodeItem => {
  return createFormNodeTemplate(name, {
    type: 'TASK',
    showBtns: ['COMPLETE', 'CANCEL'],
    groups: ['worker'],
    preview: {
      title: 'Task Assignment',
      subtitle: `${name} - In Progress`,
    },
  });
};

// Daftar template yang tersedia
export const NODE_TEMPLATES = {
  FORM: {
    name: 'Form Node',
    description: 'Basic form for data input',
    create: (name?: string) => createFormNodeTemplate(name || 'Form Node'),
  },
  APPROVAL: {
    name: 'Approval Node',
    description: 'Node for approval workflow',
    create: (name?: string) => createApprovalNodeTemplate(name || 'Approval Node'),
  },
  TASK: {
    name: 'Task Node',
    description: 'Node for task assignment',
    create: (name?: string) => createTaskNodeTemplate(name || 'Task Node'),
  },
} as const;

export type NodeTemplateType = keyof typeof NODE_TEMPLATES;
