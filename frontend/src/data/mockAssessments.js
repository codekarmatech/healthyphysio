/**
 * Mock assessment data for development and testing
 */

export const mockAssessments = [
  {
    id: 1,
    patient_id: 101,
    patient_name: "John Smith",
    therapist_id: 201,
    therapist_name: "Dr. Sarah Johnson",
    template_id: "neuro-assessment",
    title: "Neurological Assessment",
    type: "Neurological",
    status: "completed",
    created_at: "2023-11-15T09:30:00Z",
    updated_at: "2023-11-15T11:45:00Z",
    affected_areas: ["brain", "spine", "peripheral_nerves"],
    data: {
      "name": "John Smith",
      "age": 45,
      "gender": "Male",
      "diagnosis": "Post-stroke rehabilitation",
      "date-of-assessment": "2023-11-15",
      "primary-complaint": "Left-sided weakness and difficulty with fine motor tasks",
      "secondary-complaints": "Occasional headaches and fatigue",
      "onset": "Sudden",
      "duration": "3 months",
      "past-medical-history": "Ischemic stroke 3 months ago, Hypertension, Type 2 Diabetes",
      "surgical-history": "None",
      "medications": "Aspirin, Lisinopril, Metformin",
      "allergies": "Penicillin",
      "consciousness": "Alert",
      "orientation": ["Person", "Place", "Time"],
      "memory": "Intact",
      "attention": "Normal",
      "cn-i": "Normal",
      "cn-ii": "Normal",
      "cn-iii-iv-vi": "Normal",
      "cn-v": "Normal",
      "cn-vii": "Impaired",
      "cn-viii": "Normal",
      "cn-ix-x": "Normal",
      "cn-xi": "Normal",
      "cn-xii": "Normal",
      "muscle-tone": "Hypertonic",
      "muscle-strength": [
        ["4/5", "5/5"],
        ["3/5", "5/5"],
        ["3/5", "5/5"],
        ["2/5", "5/5"],
        ["2/5", "5/5"],
        ["2/5", "5/5"],
        ["3/5", "5/5"],
        ["3/5", "5/5"],
        ["4/5", "5/5"],
        ["4/5", "5/5"],
        ["3/5", "5/5"],
        ["3/5", "5/5"]
      ],
      "coordination": "Impaired",
      "light-touch": [
        ["Normal", "Normal"],
        ["Normal", "Normal"],
        ["Impaired", "Normal"],
        ["Impaired", "Normal"],
        ["Impaired", "Normal"],
        ["Normal", "Normal"],
        ["Normal", "Normal"],
        ["Normal", "Normal"],
        ["Normal", "Normal"],
        ["Normal", "Normal"],
        ["Normal", "Normal"],
        ["Normal", "Normal"]
      ],
      "proprioception": [
        ["Impaired", "Normal"],
        ["Normal", "Normal"]
      ],
      "deep-tendon-reflexes": [
        ["3+", "2+"],
        ["3+", "2+"],
        ["3+", "2+"],
        ["2+", "2+"],
        ["2+", "2+"]
      ],
      "pathological-reflexes": [
        ["Present", "Absent"],
        ["Present", "Absent"],
        ["Absent", "Absent"]
      ],
      "mobility": "Requires Assistance",
      "transfers": "Requires Assistance",
      "gait": "Spastic",
      "balance": "Impaired",
      "adl": "Requires Assistance",
      "assessment": "Patient presents with left hemiparesis following ischemic stroke 3 months ago. Demonstrates moderate weakness in left upper and lower extremities with associated hypertonia. Functional mobility is limited and requires assistance for most activities.",
      "short-term-goals": "1. Improve left UE strength by 1 grade in 4 weeks\n2. Independent transfers with minimal assistance in 3 weeks\n3. Improve fine motor coordination for self-feeding in 4 weeks",
      "long-term-goals": "1. Independent mobility with assistive device\n2. Return to modified work duties\n3. Independent in all ADLs",
      "treatment-plan": "1. Neuromuscular re-education\n2. Progressive resistance training\n3. Task-specific training for ADLs\n4. Balance and gait training\n5. Constraint-induced movement therapy",
      "frequency": "3 times per week",
      "treatment-duration": "8 weeks"
    }
  },
  {
    id: 2,
    patient_id: 102,
    patient_name: "Emily Johnson",
    therapist_id: 201,
    therapist_name: "Dr. Sarah Johnson",
    template_id: "ortho-assessment",
    title: "Orthopedic Assessment",
    type: "Orthopedic",
    status: "completed",
    created_at: "2023-11-18T14:00:00Z",
    updated_at: "2023-11-18T15:30:00Z",
    affected_areas: ["shoulder", "rotator_cuff", "biceps"],
    data: {
      "name": "Emily Johnson",
      "age": 32,
      "gender": "Female",
      "occupation": "Software Developer",
      "date-of-assessment": "2023-11-18",
      "primary-complaint": "Right shoulder pain with overhead activities",
      "secondary-complaints": "Difficulty sleeping on right side",
      "onset": "Gradual",
      "duration": "2 months",
      "mechanism": "Repetitive computer use and recent increase in tennis playing",
      "pain-location": "Anterolateral shoulder, radiating to deltoid",
      "pain-quality": "Sharp with movement, dull ache at rest",
      "pain-intensity": "6/10 with activity, 3/10 at rest",
      "aggravating-factors": "Overhead reaching, lifting, sleeping on affected side",
      "relieving-factors": "Rest, ice, anti-inflammatory medication",
      "past-medical-history": "None significant",
      "surgical-history": "Appendectomy 10 years ago",
      "medications": "Ibuprofen as needed",
      "allergies": "None",
      "observation-posture": "Forward head, rounded shoulders, elevated right scapula",
      "observation-swelling": "Minimal swelling anteriorly",
      "observation-redness": "None",
      "observation-atrophy": "Mild supraspinatus and infraspinatus atrophy on right",
      "palpation-findings": "Tenderness over supraspinatus tendon, bicipital groove, and anterior acromion",
      "rom-shoulder-flexion": [
        ["170°", "180°"]
      ],
      "rom-shoulder-extension": [
        ["45°", "50°"]
      ],
      "rom-shoulder-abduction": [
        ["160°", "180°"]
      ],
      "rom-shoulder-internal-rotation": [
        ["60°", "70°"]
      ],
      "rom-shoulder-external-rotation": [
        ["80°", "90°"]
      ],
      "special-tests": [
        ["Neer Impingement Test", "Positive", "Negative"],
        ["Hawkins-Kennedy Test", "Positive", "Negative"],
        ["Empty Can Test", "Positive", "Negative"],
        ["Speed's Test", "Positive", "Negative"],
        ["O'Brien's Test", "Negative", "Negative"],
        ["Apprehension Test", "Negative", "Negative"]
      ],
      "strength-testing": [
        ["Shoulder Flexion", "4/5", "5/5"],
        ["Shoulder Abduction", "4/5", "5/5"],
        ["Shoulder External Rotation", "3+/5", "5/5"],
        ["Shoulder Internal Rotation", "4/5", "5/5"],
        ["Elbow Flexion", "5/5", "5/5"],
        ["Elbow Extension", "5/5", "5/5"]
      ],
      "neurological-findings": "Sensation intact in all dermatomes. DTRs normal and symmetric. No radicular symptoms.",
      "functional-limitations": "Difficulty with overhead activities, lifting objects, and computer work for extended periods",
      "assessment": "Patient presents with signs and symptoms consistent with right rotator cuff tendinopathy and subacromial impingement syndrome, likely due to repetitive overhead activities and poor posture.",
      "short-term-goals": "1. Decrease pain to 2/10 with activity in 2 weeks\n2. Improve posture awareness and correction in 2 weeks\n3. Increase pain-free ROM by 15° in all planes in 3 weeks",
      "long-term-goals": "1. Return to pain-free tennis in 8 weeks\n2. Full pain-free ROM in 6 weeks\n3. Return to unrestricted work activities in 4 weeks",
      "treatment-plan": "1. Manual therapy: soft tissue mobilization, joint mobilization\n2. Therapeutic exercise: rotator cuff strengthening, scapular stabilization\n3. Postural education and correction\n4. Activity modification\n5. Modalities: ice, electrical stimulation as needed",
      "frequency": "2 times per week",
      "treatment-duration": "6 weeks"
    }
  },
  {
    id: 3,
    patient_id: 103,
    patient_name: "Michael Brown",
    therapist_id: 201,
    therapist_name: "Dr. Sarah Johnson",
    template_id: "ortho-assessment",
    title: "Orthopedic Assessment",
    type: "Orthopedic",
    status: "pending",
    created_at: "2023-11-20T10:15:00Z",
    updated_at: "2023-11-20T10:15:00Z",
    affected_areas: ["knee", "acl", "meniscus"],
    data: {
      "name": "Michael Brown",
      "age": 28,
      "gender": "Male",
      "occupation": "Construction Worker",
      "date-of-assessment": "2023-11-20"
    }
  },
  {
    id: 4,
    patient_id: 104,
    patient_name: "Sophia Garcia",
    therapist_id: 201,
    therapist_name: "Dr. Sarah Johnson",
    template_id: "neuro-assessment",
    title: "Neurological Assessment",
    type: "Neurological",
    status: "pending",
    created_at: "2023-11-21T13:45:00Z",
    updated_at: "2023-11-21T13:45:00Z",
    affected_areas: ["spine", "lumbar", "sciatic_nerve"],
    data: {
      "name": "Sophia Garcia",
      "age": 41,
      "gender": "Female",
      "diagnosis": "Lumbar Radiculopathy",
      "date-of-assessment": "2023-11-21"
    }
  },
  {
    id: 5,
    patient_id: 105,
    patient_name: "Robert Wilson",
    therapist_id: 201,
    therapist_name: "Dr. Sarah Johnson",
    template_id: "ortho-assessment",
    title: "Orthopedic Assessment",
    type: "Orthopedic",
    status: "completed",
    created_at: "2023-11-10T09:00:00Z",
    updated_at: "2023-11-10T10:30:00Z",
    affected_areas: ["ankle", "achilles_tendon"],
    data: {
      "name": "Robert Wilson",
      "age": 35,
      "gender": "Male",
      "occupation": "Marathon Runner",
      "date-of-assessment": "2023-11-10",
      "primary-complaint": "Left Achilles tendon pain",
      "secondary-complaints": "Stiffness in the morning",
      "onset": "Gradual",
      "duration": "6 weeks",
      "mechanism": "Increased running mileage",
      "pain-location": "Posterior heel and Achilles tendon",
      "pain-quality": "Sharp with initial steps, dull ache during activity",
      "pain-intensity": "7/10 with running, 3/10 at rest",
      "aggravating-factors": "Running, jumping, prolonged walking",
      "relieving-factors": "Rest, ice, elevation",
      "assessment": "Achilles tendinopathy with possible insertional component",
      "treatment-plan": "1. Activity modification\n2. Eccentric strengthening\n3. Soft tissue mobilization\n4. Gradual return to running program",
      "frequency": "2 times per week",
      "treatment-duration": "6 weeks"
    }
  }
];

export default mockAssessments;