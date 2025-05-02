import api from './api';

const equipmentService = {
  // Equipment Categories
  getAllCategories: () => {
    return api.get('/equipment/categories/');
  },
  
  getCategoryById: (id) => {
    return api.get(`/equipment/categories/${id}/`);
  },
  
  createCategory: (categoryData) => {
    return api.post('/equipment/categories/', categoryData);
  },
  
  updateCategory: (id, categoryData) => {
    return api.patch(`/equipment/categories/${id}/`, categoryData);
  },
  
  deleteCategory: (id) => {
    return api.delete(`/equipment/categories/${id}/`);
  },
  
  // Equipment CRUD operations
  getAllEquipment: (categoryId = null) => {
    const url = categoryId 
      ? `/equipment/equipment/?category=${categoryId}` 
      : '/equipment/equipment/';
    return api.get(url);
  },
  
  getEquipmentById: (id) => {
    return api.get(`/equipment/equipment/${id}/`);
  },
  
  getAvailableEquipment: (categoryId = null) => {
    const url = categoryId 
      ? `/equipment/equipment/available/?category=${categoryId}` 
      : '/equipment/equipment/available/';
    return api.get(url);
  },
  
  checkSerialNumberExists: (serialNumber, excludeId = null) => {
    let url = `/equipment/equipment/check_serial_number_exists/?serial_number=${encodeURIComponent(serialNumber)}`;
    if (excludeId) {
      url += `&exclude_id=${excludeId}`;
    }
    return api.get(url);
  },
  
  createEquipment: (equipmentData) => {
    const formData = new FormData();
    
    // Add all fields to formData
    Object.keys(equipmentData).forEach(key => {
      if (key === 'photo' && equipmentData[key] instanceof File) {
        formData.append(key, equipmentData[key]);
      } else if (equipmentData[key] !== null && equipmentData[key] !== undefined) {
        formData.append(key, equipmentData[key]);
      }
    });
    
    return api.post('/equipment/equipment/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  updateEquipment: (id, equipmentData) => {
    const formData = new FormData();
    
    // Add all fields to formData
    Object.keys(equipmentData).forEach(key => {
      if (key === 'photo' && equipmentData[key] instanceof File) {
        formData.append(key, equipmentData[key]);
      } else if (equipmentData[key] !== null && equipmentData[key] !== undefined) {
        formData.append(key, equipmentData[key]);
      }
    });
    
    return api.patch(`/equipment/equipment/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  deleteEquipment: (id) => {
    return api.delete(`/equipment/equipment/${id}/`);
  },
  
  // Equipment Allocation operations
  getAllAllocations: () => {
    return api.get('/equipment/allocations/');
  },
  
  getAllocationById: (id) => {
    return api.get(`/equipment/allocations/${id}/`);
  },
  
  createAllocation: (allocationData) => {
    return api.post('/equipment/allocations/', allocationData);
  },
  
  updateAllocation: (id, allocationData) => {
    return api.patch(`/equipment/allocations/${id}/`, allocationData);
  },
  
  returnEquipment: (id) => {
    return api.post(`/equipment/allocations/${id}/return_equipment/`);
  },
  
  extendReturnDate: (id, newReturnDate, reason) => {
    return api.post(`/equipment/allocations/${id}/extend_return_date/`, {
      new_return_date: newReturnDate,
      reason: reason
    });
  },
  
  // Allocation Request operations
  getAllRequests: () => {
    return api.get('/equipment/requests/');
  },
  
  getRequestsForTherapist: (therapistId) => {
    return api.get(`/equipment/requests/?therapist=${therapistId}`);
  },
  
  getRequestById: (id) => {
    return api.get(`/equipment/requests/${id}/`);
  },
  
  createRequest: (requestData) => {
    return api.post('/equipment/requests/', requestData);
  },
  
  approveRequest: (id, adminNotes = '', notifyPatient = true, notifyTherapist = true) => {
    return api.post(`/equipment/requests/${id}/approve/`, {
      admin_notes: adminNotes,
      notify_patient: notifyPatient,
      notify_therapist: notifyTherapist
    });
  },
  
  rejectRequest: (id, adminNotes = '', notifyPatient = true, notifyTherapist = true) => {
    return api.post(`/equipment/requests/${id}/reject/`, {
      admin_notes: adminNotes,
      notify_patient: notifyPatient,
      notify_therapist: notifyTherapist
    });
  },
  
  // Notification methods
  getNotifications: () => {
    return api.get('/notifications/equipment/');
  },
  
  markNotificationAsRead: (id) => {
    return api.post(`/notifications/${id}/mark-read/`);
  }
};

export default equipmentService;