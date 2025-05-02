# Equipment Management System

This module adds equipment management and allocation functionality to the HealthyPhysio application.

## Features

- Equipment inventory management
- Equipment allocation to therapists and patients
- Request system for therapists to request equipment for patients
- Approval workflow for administrators
- Tracking of equipment status, location, and return dates
- Overdue equipment tracking and extra charges calculation

## Backend Components

- **Models**:
  - `Equipment`: Stores equipment details (name, description, photo, price, etc.)
  - `EquipmentAllocation`: Tracks equipment allocation to therapists and patients
  - `AllocationRequest`: Manages requests from therapists for equipment allocation

- **APIs**:
  - Equipment CRUD operations
  - Allocation management
  - Request approval/rejection

## Frontend Components

- Equipment listing and detail pages
- Equipment allocation management
- Request creation and management interfaces
- Integration with admin, therapist, and patient dashboards

## Installation and Setup

1. The backend code has been added to the `equipment` app
2. The frontend components have been added to the `src/pages/equipment` directory
3. Routes have been added to `App.js`
4. Navigation links have been added to the sidebar

## Next Steps

To complete the installation:

1. Run migrations to create the database tables:
   ```
   python manage.py makemigrations equipment
   python manage.py migrate
   ```

2. Test the API endpoints:
   - `/api/equipment/equipment/` - Equipment CRUD
   - `/api/equipment/allocations/` - Allocation management
   - `/api/equipment/requests/` - Request management

3. Test the frontend routes:
   - `/equipment` - Equipment listing
   - `/equipment/:id` - Equipment details
   - `/equipment/new` - Add new equipment (admin only)
   - `/equipment/requests` - View allocation requests
   - `/therapist/equipment/requests/new` - Create allocation request (therapist only)

## Permissions

- **Admin**: Full access to all equipment management features
- **Therapist**: Can view equipment, request allocations, and return equipment
- **Patient**: Can view allocated equipment
- **Doctor**: Can view equipment

## Data Model

### Equipment
- name: CharField
- description: TextField
- photo: ImageField
- price: DecimalField
- serial_number: CharField
- purchase_date: DateField
- is_available: BooleanField

### EquipmentAllocation
- equipment: ForeignKey(Equipment)
- therapist: ForeignKey(Therapist)
- patient: ForeignKey(Patient)
- allocated_by: ForeignKey(User)
- allocation_date: DateTimeField
- expected_return_date: DateField
- actual_return_date: DateField (nullable)
- status: CharField (choices: pending, approved, rejected, returned, overdue)
- location: CharField (choices: therapist, patient)
- notes: TextField
- extension_reason: TextField
- extra_charges: DecimalField

### AllocationRequest
- equipment: ForeignKey(Equipment)
- therapist: ForeignKey(Therapist)
- patient: ForeignKey(Patient)
- requested_date: DateTimeField
- requested_until: DateField
- status: CharField (choices: pending, approved, rejected)
- location: CharField (choices: therapist, patient)
- reason: TextField
- admin_notes: TextField