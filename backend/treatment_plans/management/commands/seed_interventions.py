"""
Management command to seed physiotherapy interventions database.
This provides comprehensive intervention data for treatment plan creation.

Usage: python manage.py seed_interventions
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from treatment_plans.models import Intervention

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with comprehensive physiotherapy interventions'

    def handle(self, *args, **options):
        self.stdout.write('Seeding physiotherapy interventions...')
        
        # Get or create a system user for created_by field
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            admin_user = User.objects.filter(is_superuser=True).first()
        
        interventions_data = self.get_interventions_data()
        
        created_count = 0
        updated_count = 0
        
        for intervention_data in interventions_data:
            intervention, created = Intervention.objects.update_or_create(
                name=intervention_data['name'],
                defaults={
                    'description': intervention_data['description'],
                    'category': intervention_data['category'],
                    'is_active': True,
                    'created_by': admin_user
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded interventions: {created_count} created, {updated_count} updated'
            )
        )

    def get_interventions_data(self):
        """
        Comprehensive list of physiotherapy interventions organized by category.
        Based on standard physiotherapy practice guidelines and evidence-based treatments.
        """
        return [
            # ============================================
            # MANUAL THERAPY TECHNIQUES
            # ============================================
            {
                'name': 'Soft Tissue Mobilization',
                'description': 'Manual manipulation of soft tissues including muscles, tendons, and fascia to reduce pain, improve circulation, and restore normal tissue mobility.',
                'category': 'Manual Therapy'
            },
            {
                'name': 'Joint Mobilization',
                'description': 'Passive movement techniques applied to joint surfaces to restore optimal motion, reduce pain, and normalize joint mechanics. Graded from I-IV based on amplitude.',
                'category': 'Manual Therapy'
            },
            {
                'name': 'Joint Manipulation',
                'description': 'High-velocity, low-amplitude thrust technique applied to joints to restore mobility and reduce pain. Requires specialized training.',
                'category': 'Manual Therapy'
            },
            {
                'name': 'Myofascial Release',
                'description': 'Sustained pressure applied to myofascial connective tissue to eliminate pain and restore motion by releasing fascial restrictions.',
                'category': 'Manual Therapy'
            },
            {
                'name': 'Trigger Point Therapy',
                'description': 'Direct pressure applied to hyperirritable spots in skeletal muscle to relieve pain and restore normal muscle function.',
                'category': 'Manual Therapy'
            },
            {
                'name': 'Deep Tissue Massage',
                'description': 'Firm pressure massage targeting deeper muscle layers and connective tissue to release chronic muscle tension and adhesions.',
                'category': 'Manual Therapy'
            },
            {
                'name': 'Manual Lymphatic Drainage',
                'description': 'Gentle massage technique to encourage lymph flow and reduce swelling, particularly useful for post-surgical edema.',
                'category': 'Manual Therapy'
            },
            {
                'name': 'Muscle Energy Technique (MET)',
                'description': 'Active technique where patient contracts muscles against resistance to improve joint mobility and muscle function.',
                'category': 'Manual Therapy'
            },
            {
                'name': 'Proprioceptive Neuromuscular Facilitation (PNF)',
                'description': 'Advanced stretching technique combining passive stretching with isometric contractions to improve flexibility and strength.',
                'category': 'Manual Therapy'
            },
            {
                'name': 'Craniosacral Therapy',
                'description': 'Gentle manipulation of skull and sacrum to improve cerebrospinal fluid flow and relieve tension in the central nervous system.',
                'category': 'Manual Therapy'
            },
            
            # ============================================
            # THERAPEUTIC EXERCISES
            # ============================================
            {
                'name': 'Range of Motion Exercises (ROM)',
                'description': 'Exercises to maintain or improve joint flexibility. Includes passive, active-assisted, and active ROM exercises.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Stretching Exercises',
                'description': 'Systematic lengthening of muscles and soft tissues to improve flexibility, reduce stiffness, and prevent injury.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Strengthening Exercises - Isometric',
                'description': 'Static muscle contractions without joint movement. Ideal for early rehabilitation when joint movement is limited.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Strengthening Exercises - Isotonic',
                'description': 'Dynamic exercises with constant resistance through full range of motion. Includes concentric and eccentric contractions.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Strengthening Exercises - Isokinetic',
                'description': 'Exercises performed at constant speed with variable resistance using specialized equipment.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Resistance Band Exercises',
                'description': 'Progressive resistance training using elastic bands of varying resistance levels for strengthening.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Core Stabilization Exercises',
                'description': 'Exercises targeting deep abdominal and back muscles to improve trunk stability and protect the spine.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Balance Training',
                'description': 'Exercises to improve static and dynamic balance, proprioception, and fall prevention.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Coordination Exercises',
                'description': 'Activities to improve motor control, timing, and smooth movement patterns.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Plyometric Exercises',
                'description': 'High-intensity exercises involving rapid stretching and contracting of muscles to develop power.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Aquatic Therapy Exercises',
                'description': 'Exercises performed in water to reduce joint stress while providing resistance for strengthening.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Breathing Exercises',
                'description': 'Techniques to improve respiratory function, chest mobility, and relaxation.',
                'category': 'Therapeutic Exercise'
            },
            {
                'name': 'Postural Correction Exercises',
                'description': 'Exercises designed to correct postural imbalances and improve alignment.',
                'category': 'Therapeutic Exercise'
            },
            
            # ============================================
            # ELECTROTHERAPY MODALITIES
            # ============================================
            {
                'name': 'Transcutaneous Electrical Nerve Stimulation (TENS)',
                'description': 'Low-voltage electrical current applied through skin electrodes for pain relief by stimulating sensory nerves.',
                'category': 'Electrotherapy'
            },
            {
                'name': 'Interferential Current Therapy (IFT)',
                'description': 'Medium frequency electrical currents that intersect to produce low-frequency stimulation for deep tissue pain relief.',
                'category': 'Electrotherapy'
            },
            {
                'name': 'Neuromuscular Electrical Stimulation (NMES)',
                'description': 'Electrical stimulation to activate muscles, improve strength, and prevent atrophy in weakened or paralyzed muscles.',
                'category': 'Electrotherapy'
            },
            {
                'name': 'Functional Electrical Stimulation (FES)',
                'description': 'Electrical stimulation applied during functional activities to assist movement in neurologically impaired patients.',
                'category': 'Electrotherapy'
            },
            {
                'name': 'High-Voltage Pulsed Current (HVPC)',
                'description': 'High-voltage, low-amperage current for wound healing, edema reduction, and pain management.',
                'category': 'Electrotherapy'
            },
            {
                'name': 'Russian Current Stimulation',
                'description': 'Medium-frequency alternating current for muscle strengthening, particularly in athletes.',
                'category': 'Electrotherapy'
            },
            {
                'name': 'Iontophoresis',
                'description': 'Use of electrical current to deliver medication through the skin for localized treatment.',
                'category': 'Electrotherapy'
            },
            
            # ============================================
            # THERMAL MODALITIES
            # ============================================
            {
                'name': 'Hot Pack Application',
                'description': 'Superficial heat therapy using moist heat packs to increase blood flow, reduce muscle spasm, and relieve pain.',
                'category': 'Thermal Therapy'
            },
            {
                'name': 'Cold Pack Application (Cryotherapy)',
                'description': 'Application of cold to reduce inflammation, swelling, pain, and muscle spasm in acute injuries.',
                'category': 'Thermal Therapy'
            },
            {
                'name': 'Ice Massage',
                'description': 'Direct application of ice to small areas for intense cooling effect and pain relief.',
                'category': 'Thermal Therapy'
            },
            {
                'name': 'Contrast Bath Therapy',
                'description': 'Alternating immersion in hot and cold water to improve circulation and reduce swelling.',
                'category': 'Thermal Therapy'
            },
            {
                'name': 'Paraffin Wax Bath',
                'description': 'Warm paraffin wax application for deep heat therapy, particularly for hands and feet in arthritis.',
                'category': 'Thermal Therapy'
            },
            {
                'name': 'Fluidotherapy',
                'description': 'Dry heat therapy using heated air and cellulose particles for desensitization and pain relief.',
                'category': 'Thermal Therapy'
            },
            {
                'name': 'Infrared Therapy',
                'description': 'Radiant heat therapy using infrared lamps for superficial heating and pain relief.',
                'category': 'Thermal Therapy'
            },
            
            # ============================================
            # ULTRASOUND & MECHANICAL MODALITIES
            # ============================================
            {
                'name': 'Therapeutic Ultrasound',
                'description': 'High-frequency sound waves for deep tissue heating, promoting healing and reducing pain and inflammation.',
                'category': 'Ultrasound Therapy'
            },
            {
                'name': 'Phonophoresis',
                'description': 'Use of ultrasound to enhance transdermal delivery of topical medications.',
                'category': 'Ultrasound Therapy'
            },
            {
                'name': 'Extracorporeal Shockwave Therapy (ESWT)',
                'description': 'High-energy acoustic waves for treating chronic tendinopathies and calcific conditions.',
                'category': 'Mechanical Therapy'
            },
            {
                'name': 'Mechanical Traction - Cervical',
                'description': 'Mechanical force applied to cervical spine to decompress vertebrae and relieve nerve compression.',
                'category': 'Mechanical Therapy'
            },
            {
                'name': 'Mechanical Traction - Lumbar',
                'description': 'Mechanical force applied to lumbar spine for disc decompression and pain relief.',
                'category': 'Mechanical Therapy'
            },
            {
                'name': 'Continuous Passive Motion (CPM)',
                'description': 'Motorized device providing continuous passive movement to joints post-surgery to prevent stiffness.',
                'category': 'Mechanical Therapy'
            },
            {
                'name': 'Pneumatic Compression Therapy',
                'description': 'Intermittent compression using inflatable sleeves to reduce edema and improve circulation.',
                'category': 'Mechanical Therapy'
            },
            
            # ============================================
            # GAIT & MOBILITY TRAINING
            # ============================================
            {
                'name': 'Gait Training',
                'description': 'Systematic training to improve walking pattern, efficiency, and safety with or without assistive devices.',
                'category': 'Gait & Mobility'
            },
            {
                'name': 'Stair Climbing Training',
                'description': 'Progressive training for safe and efficient stair navigation.',
                'category': 'Gait & Mobility'
            },
            {
                'name': 'Transfer Training',
                'description': 'Training for safe movement between surfaces (bed to chair, chair to toilet, etc.).',
                'category': 'Gait & Mobility'
            },
            {
                'name': 'Wheelchair Mobility Training',
                'description': 'Training for efficient and safe wheelchair propulsion and maneuvering.',
                'category': 'Gait & Mobility'
            },
            {
                'name': 'Assistive Device Training',
                'description': 'Training in proper use of canes, walkers, crutches, and other mobility aids.',
                'category': 'Gait & Mobility'
            },
            {
                'name': 'Fall Prevention Training',
                'description': 'Comprehensive program to identify fall risks and implement prevention strategies.',
                'category': 'Gait & Mobility'
            },
            
            # ============================================
            # NEUROLOGICAL REHABILITATION
            # ============================================
            {
                'name': 'Bobath/NDT Approach',
                'description': 'Neurodevelopmental treatment approach for patients with neurological conditions to improve movement quality.',
                'category': 'Neurological Rehab'
            },
            {
                'name': 'Motor Relearning Programme',
                'description': 'Task-specific training approach for relearning motor skills after neurological injury.',
                'category': 'Neurological Rehab'
            },
            {
                'name': 'Constraint-Induced Movement Therapy (CIMT)',
                'description': 'Intensive therapy constraining the unaffected limb to force use of the affected limb in stroke patients.',
                'category': 'Neurological Rehab'
            },
            {
                'name': 'Mirror Therapy',
                'description': 'Use of mirror reflection to create visual feedback for motor recovery and pain reduction.',
                'category': 'Neurological Rehab'
            },
            {
                'name': 'Task-Oriented Training',
                'description': 'Practice of functional tasks to improve motor learning and real-world performance.',
                'category': 'Neurological Rehab'
            },
            {
                'name': 'Vestibular Rehabilitation',
                'description': 'Specialized exercises to address dizziness, vertigo, and balance problems from vestibular disorders.',
                'category': 'Neurological Rehab'
            },
            
            # ============================================
            # CARDIOPULMONARY REHABILITATION
            # ============================================
            {
                'name': 'Aerobic Conditioning',
                'description': 'Progressive cardiovascular exercise to improve heart and lung function and endurance.',
                'category': 'Cardiopulmonary'
            },
            {
                'name': 'Chest Physiotherapy',
                'description': 'Techniques including percussion, vibration, and postural drainage to clear airway secretions.',
                'category': 'Cardiopulmonary'
            },
            {
                'name': 'Incentive Spirometry',
                'description': 'Breathing exercises using a spirometer to improve lung expansion and prevent complications.',
                'category': 'Cardiopulmonary'
            },
            {
                'name': 'Diaphragmatic Breathing',
                'description': 'Training in proper diaphragm use for efficient breathing and relaxation.',
                'category': 'Cardiopulmonary'
            },
            {
                'name': 'Pursed Lip Breathing',
                'description': 'Breathing technique to slow breathing rate and improve oxygen exchange in COPD patients.',
                'category': 'Cardiopulmonary'
            },
            {
                'name': 'Active Cycle of Breathing Technique (ACBT)',
                'description': 'Combination of breathing control, thoracic expansion, and forced expiration for airway clearance.',
                'category': 'Cardiopulmonary'
            },
            
            # ============================================
            # SPORTS REHABILITATION
            # ============================================
            {
                'name': 'Sport-Specific Training',
                'description': 'Exercises and drills tailored to the demands of specific sports for return to play.',
                'category': 'Sports Rehab'
            },
            {
                'name': 'Agility Training',
                'description': 'Exercises to improve quick directional changes, reaction time, and athletic performance.',
                'category': 'Sports Rehab'
            },
            {
                'name': 'Speed Training',
                'description': 'Progressive exercises to improve running speed and acceleration.',
                'category': 'Sports Rehab'
            },
            {
                'name': 'Return to Sport Testing',
                'description': 'Standardized assessments to determine readiness for return to athletic activities.',
                'category': 'Sports Rehab'
            },
            {
                'name': 'Kinesiology Taping',
                'description': 'Application of elastic therapeutic tape to support muscles and joints during activity.',
                'category': 'Sports Rehab'
            },
            {
                'name': 'Athletic Taping',
                'description': 'Rigid taping techniques to stabilize joints and prevent injury during sports.',
                'category': 'Sports Rehab'
            },
            
            # ============================================
            # PAIN MANAGEMENT
            # ============================================
            {
                'name': 'Pain Education',
                'description': 'Patient education about pain neuroscience to improve understanding and self-management.',
                'category': 'Pain Management'
            },
            {
                'name': 'Relaxation Techniques',
                'description': 'Progressive muscle relaxation, guided imagery, and other techniques for pain and stress reduction.',
                'category': 'Pain Management'
            },
            {
                'name': 'Graded Motor Imagery',
                'description': 'Progressive program of laterality recognition, motor imagery, and mirror therapy for chronic pain.',
                'category': 'Pain Management'
            },
            {
                'name': 'Desensitization Techniques',
                'description': 'Progressive exposure to stimuli to reduce hypersensitivity in affected areas.',
                'category': 'Pain Management'
            },
            {
                'name': 'Acupressure',
                'description': 'Application of pressure to specific points to relieve pain and promote healing.',
                'category': 'Pain Management'
            },
            {
                'name': 'Dry Needling',
                'description': 'Insertion of thin needles into trigger points to release muscle tension and reduce pain.',
                'category': 'Pain Management'
            },
            
            # ============================================
            # PEDIATRIC INTERVENTIONS
            # ============================================
            {
                'name': 'Developmental Exercises',
                'description': 'Age-appropriate activities to promote normal motor development in children.',
                'category': 'Pediatric'
            },
            {
                'name': 'Sensory Integration Therapy',
                'description': 'Activities to help children process and respond appropriately to sensory information.',
                'category': 'Pediatric'
            },
            {
                'name': 'Play-Based Therapy',
                'description': 'Therapeutic activities disguised as play to engage children in rehabilitation.',
                'category': 'Pediatric'
            },
            {
                'name': 'Torticollis Treatment',
                'description': 'Stretching and positioning techniques to correct congenital muscular torticollis.',
                'category': 'Pediatric'
            },
            
            # ============================================
            # GERIATRIC INTERVENTIONS
            # ============================================
            {
                'name': 'Functional Training for Elderly',
                'description': 'Exercises focused on maintaining independence in daily activities for older adults.',
                'category': 'Geriatric'
            },
            {
                'name': 'Osteoporosis Exercise Program',
                'description': 'Weight-bearing and resistance exercises to maintain bone density and prevent fractures.',
                'category': 'Geriatric'
            },
            {
                'name': 'Arthritis Management Program',
                'description': 'Comprehensive exercise and education program for managing arthritis symptoms.',
                'category': 'Geriatric'
            },
            
            # ============================================
            # WOMEN'S HEALTH
            # ============================================
            {
                'name': 'Pelvic Floor Exercises',
                'description': 'Kegel exercises and related techniques to strengthen pelvic floor muscles.',
                'category': "Women's Health"
            },
            {
                'name': 'Prenatal Exercise Program',
                'description': 'Safe exercises during pregnancy to maintain fitness and prepare for delivery.',
                'category': "Women's Health"
            },
            {
                'name': 'Postnatal Rehabilitation',
                'description': 'Recovery exercises after childbirth including diastasis recti treatment.',
                'category': "Women's Health"
            },
            {
                'name': 'Incontinence Management',
                'description': 'Bladder training and pelvic floor rehabilitation for urinary incontinence.',
                'category': "Women's Health"
            },
            
            # ============================================
            # ORTHOPEDIC SPECIFIC
            # ============================================
            {
                'name': 'Post-Surgical Rehabilitation Protocol',
                'description': 'Structured rehabilitation program following orthopedic surgery based on surgical procedure.',
                'category': 'Orthopedic'
            },
            {
                'name': 'Fracture Rehabilitation',
                'description': 'Progressive rehabilitation following bone fracture healing.',
                'category': 'Orthopedic'
            },
            {
                'name': 'Joint Replacement Rehabilitation',
                'description': 'Comprehensive program for recovery after hip, knee, or shoulder replacement surgery.',
                'category': 'Orthopedic'
            },
            {
                'name': 'Spinal Stabilization Program',
                'description': 'Exercises to strengthen muscles supporting the spine and prevent recurrent back pain.',
                'category': 'Orthopedic'
            },
            {
                'name': 'Rotator Cuff Rehabilitation',
                'description': 'Progressive strengthening program for rotator cuff injuries and post-surgical recovery.',
                'category': 'Orthopedic'
            },
            {
                'name': 'ACL Rehabilitation Protocol',
                'description': 'Phased rehabilitation program following ACL reconstruction surgery.',
                'category': 'Orthopedic'
            },
            {
                'name': 'Tendinopathy Management',
                'description': 'Eccentric loading exercises and progressive rehabilitation for tendon injuries.',
                'category': 'Orthopedic'
            },
            
            # ============================================
            # PATIENT EDUCATION
            # ============================================
            {
                'name': 'Home Exercise Program Instruction',
                'description': 'Teaching and demonstration of exercises for independent home practice.',
                'category': 'Patient Education'
            },
            {
                'name': 'Ergonomic Assessment and Training',
                'description': 'Evaluation and modification of work environment and postures to prevent injury.',
                'category': 'Patient Education'
            },
            {
                'name': 'Body Mechanics Training',
                'description': 'Education on proper lifting, bending, and movement techniques to prevent injury.',
                'category': 'Patient Education'
            },
            {
                'name': 'Activity Modification Counseling',
                'description': 'Guidance on modifying daily activities to reduce pain and prevent further injury.',
                'category': 'Patient Education'
            },
            {
                'name': 'Self-Management Strategies',
                'description': 'Teaching patients techniques to independently manage their condition.',
                'category': 'Patient Education'
            },
        ]
