"""
Management command to populate site_settings with initial data.
This creates all the necessary data for the frontend to display properly.
"""
from django.core.management.base import BaseCommand
from site_settings.models import (
    Service, ProcessStep, Testimonial, Statistic, WhyChooseUs
)


class Command(BaseCommand):
    help = 'Populate site_settings with initial data for PhysioWay'

    def handle(self, *args, **options):
        self.stdout.write('Populating site settings data...')
        
        self.create_services()
        self.create_process_steps()
        self.create_testimonials()
        self.create_statistics()
        self.create_why_choose_us()
        
        self.stdout.write(self.style.SUCCESS('Successfully populated all site settings data!'))

    def create_services(self):
        """Create physiotherapy services"""
        services_data = [
            {
                'slug': 'orthopedic',
                'icon': '🦴',
                'title': 'Orthopedic Physiotherapy',
                'description': 'Specialized treatment for musculoskeletal conditions, injuries, and post-surgical rehabilitation. Our expert physiotherapists use evidence-based techniques to restore mobility and reduce pain.',
                'long_description': 'Orthopedic physiotherapy focuses on the assessment, diagnosis, and treatment of musculoskeletal conditions affecting bones, joints, muscles, ligaments, and tendons. Our specialized therapists use a combination of manual therapy, therapeutic exercises, and modalities to help patients recover from injuries, surgeries, and chronic conditions. Whether you are dealing with sports injuries, arthritis, or post-operative rehabilitation, our personalized treatment plans are designed to restore function, reduce pain, and improve your quality of life.',
                'features': 'Joint mobilization, Muscle strengthening, Pain management, Post-surgery recovery, Manual therapy, Exercise prescription',
                'conditions': 'Arthritis, Fractures, Sports injuries, Back pain, Neck pain, Joint replacements, Tendinitis, Bursitis',
                'order': 1,
                'is_featured': True,
                'is_active': True
            },
            {
                'slug': 'neurological',
                'icon': '🧠',
                'title': 'Neurological Physiotherapy',
                'description': 'Rehabilitation for nervous system disorders to improve movement and functional independence. Specialized care for stroke recovery, Parkinson\'s disease, and other neurological conditions.',
                'long_description': 'Neurological physiotherapy is a specialized branch that focuses on treating individuals with neurological conditions affecting the brain, spinal cord, and peripheral nerves. Our expert neurological physiotherapists work with patients to improve movement, balance, coordination, and functional independence. Using evidence-based techniques and personalized rehabilitation programs, we help patients regain their abilities and maximize their quality of life after stroke, brain injury, or progressive neurological conditions.',
                'features': 'Balance training, Gait re-education, Strength exercises, Coordination therapy, Functional mobility training, Cognitive-motor integration',
                'conditions': 'Stroke, Cerebral palsy, Multiple sclerosis, Parkinson\'s disease, Spinal cord injuries, Bell\'s palsy, Brain injury',
                'order': 2,
                'is_featured': True,
                'is_active': True
            },
            {
                'slug': 'cardiopulmonary',
                'icon': '❤️',
                'title': 'Cardiopulmonary Physiotherapy',
                'description': 'Specialized care for heart and lung conditions to improve cardiovascular and respiratory health. Essential for COPD management and post-cardiac surgery rehabilitation.',
                'long_description': 'Cardiopulmonary physiotherapy addresses conditions affecting the heart and lungs, helping patients improve their cardiovascular and respiratory function. Our therapists are trained in specialized techniques to enhance breathing efficiency, increase exercise tolerance, and improve overall endurance. Whether you are recovering from cardiac surgery, managing COPD, or dealing with respiratory conditions, our comprehensive rehabilitation programs are designed to help you breathe easier and live better.',
                'features': 'Breathing exercises, Chest physiotherapy, Endurance training, Airway clearance techniques, Cardiac rehabilitation, Pulmonary function improvement',
                'conditions': 'COPD, Asthma, Post-cardiac surgery, Pneumonia, Chronic bronchitis, Pulmonary fibrosis, Heart failure',
                'order': 3,
                'is_featured': True,
                'is_active': True
            },
            {
                'slug': 'pediatric',
                'icon': '👶',
                'title': 'Pediatric Physiotherapy',
                'description': 'Fun and engaging therapy sessions designed specifically for children\'s developmental needs. Helping children achieve their motor milestones through play-based interventions.',
                'long_description': 'Pediatric physiotherapy focuses on the unique needs of infants, children, and adolescents. Our child-friendly therapists use play-based interventions and age-appropriate exercises to help children develop motor skills, improve coordination, and achieve their developmental milestones. We work closely with families to create supportive home programs and ensure that therapy is both effective and enjoyable for young patients.',
                'features': 'Motor skill development, Play-based therapy, Coordination training, Strength building, Developmental milestone support, Sensory integration',
                'conditions': 'Developmental delays, Cerebral palsy, Muscular dystrophy, Autism spectrum disorders, Torticollis, Down syndrome',
                'order': 4,
                'is_featured': True,
                'is_active': True
            },
            {
                'slug': 'geriatric',
                'icon': '👴',
                'title': 'Geriatric Physiotherapy',
                'description': 'Specialized care for older adults focusing on mobility, independence, and fall prevention. Helping seniors maintain quality of life and functional independence.',
                'long_description': 'Geriatric physiotherapy is dedicated to addressing the unique health challenges faced by older adults. Our therapists understand the complexities of aging and work to improve mobility, strength, balance, and overall functional independence. With a focus on fall prevention and maintaining quality of life, we help seniors stay active, safe, and independent in their daily activities.',
                'features': 'Fall prevention, Balance training, Mobility enhancement, Pain management, Strength conditioning, Joint flexibility exercises',
                'conditions': 'Osteoporosis, Arthritis, Balance disorders, Post-surgical recovery, Parkinson\'s disease, General deconditioning',
                'order': 5,
                'is_featured': True,
                'is_active': True
            },
            {
                'slug': 'womens-health',
                'icon': '👩',
                'title': 'Women\'s Health Physiotherapy',
                'description': 'Specialized care for women\'s health issues including pregnancy, postpartum recovery, and pelvic floor dysfunction. Compassionate care for every stage of life.',
                'long_description': 'Women\'s health physiotherapy addresses the unique physiological needs of women throughout all stages of life. Our specialized therapists provide compassionate, evidence-based care for conditions related to pregnancy, postpartum recovery, pelvic floor dysfunction, and more. We create personalized treatment plans that respect your comfort and privacy while helping you achieve optimal health and wellness.',
                'features': 'Pelvic floor therapy, Prenatal care, Postnatal recovery, Diastasis recti treatment, Incontinence management, Pregnancy-related pain relief',
                'conditions': 'Pregnancy-related pain, Pelvic floor dysfunction, Diastasis recti, Incontinence, Postpartum recovery, Pelvic organ prolapse',
                'order': 6,
                'is_featured': True,
                'is_active': True
            },
        ]
        
        created_count = 0
        for data in services_data:
            obj, created = Service.objects.update_or_create(
                slug=data['slug'],
                defaults=data
            )
            if created:
                created_count += 1
        
        self.stdout.write(f'  Services: {created_count} created, {len(services_data) - created_count} updated')

    def create_process_steps(self):
        """Create how it works process steps"""
        steps_data = [
            {
                'step_number': 1,
                'icon': '📞',
                'title': 'Book Consultation',
                'description': 'Schedule a free consultation call with our expert physiotherapists to discuss your condition and needs.',
                'is_active': True
            },
            {
                'step_number': 2,
                'icon': '📋',
                'title': 'Assessment',
                'description': 'Our physiotherapist visits your home for a comprehensive assessment and creates a personalized treatment plan.',
                'is_active': True
            },
            {
                'step_number': 3,
                'icon': '🏠',
                'title': 'Home Treatment',
                'description': 'Receive professional physiotherapy sessions in the comfort of your home with all necessary equipment provided.',
                'is_active': True
            },
            {
                'step_number': 4,
                'icon': '📈',
                'title': 'Track Progress',
                'description': 'Monitor your recovery with our digital tracking system and regular progress reports shared with you and your doctor.',
                'is_active': True
            },
            {
                'step_number': 5,
                'icon': '🎯',
                'title': 'Full Recovery',
                'description': 'Achieve your recovery goals with ongoing support, maintenance exercises, and follow-up consultations to ensure lasting results.',
                'is_active': True
            },
        ]
        
        created_count = 0
        for data in steps_data:
            obj, created = ProcessStep.objects.update_or_create(
                step_number=data['step_number'],
                defaults=data
            )
            if created:
                created_count += 1
        
        self.stdout.write(f'  Process Steps: {created_count} created, {len(steps_data) - created_count} updated')

    def create_testimonials(self):
        """Create patient testimonials"""
        testimonials_data = [
            {
                'name': 'Ramesh Kumar',
                'condition': 'Post-Stroke Recovery',
                'location': 'Delhi NCR',
                'text': 'After my stroke, I couldn\'t walk or stand without support. PhysioWay\'s home physiotherapy changed my life. Within 3 months of dedicated treatment, I can now walk independently. The convenience of home visits made all the difference in my recovery journey.',
                'rating': 5,
                'is_featured': True,
                'is_active': True,
                'order': 1
            },
            {
                'name': 'Priya Sharma',
                'condition': 'Lower Back Pain',
                'location': 'Mumbai',
                'text': 'I had severe lower back pain for 2 years and tried many treatments without relief. PhysioWay\'s therapist identified the root cause in just 3 sessions. After 6 weeks of treatment, my pain is almost completely gone. Highly recommend their professional approach!',
                'rating': 5,
                'is_featured': True,
                'is_active': True,
                'order': 2
            },
            {
                'name': 'Sunita Verma',
                'condition': 'Post-Pregnancy Recovery',
                'location': 'Bangalore',
                'text': 'The women\'s health physiotherapy program helped me recover from diastasis recti after my second pregnancy. The therapist was knowledgeable, gentle, and very understanding. I regained my core strength and confidence within 2 months.',
                'rating': 5,
                'is_featured': True,
                'is_active': True,
                'order': 3
            },
            {
                'name': 'Anil Mehta',
                'condition': 'Knee Replacement Recovery',
                'location': 'Delhi NCR',
                'text': 'Post my knee replacement surgery, PhysioWay\'s home physiotherapy was a blessing. The therapist came with all equipment and guided me through every exercise. My recovery was faster than expected, and I\'m now walking without any support.',
                'rating': 5,
                'is_featured': True,
                'is_active': True,
                'order': 4
            },
            {
                'name': 'Kavitha Reddy',
                'condition': 'Parkinson\'s Disease Management',
                'location': 'Hyderabad',
                'text': 'My father has Parkinson\'s and was becoming increasingly dependent. The neurological physiotherapy program improved his balance and mobility significantly. The therapists are patient, skilled, and truly care about their patients.',
                'rating': 5,
                'is_featured': True,
                'is_active': True,
                'order': 5
            },
            {
                'name': 'Rajesh Gupta',
                'condition': 'Sports Injury Recovery',
                'location': 'Mumbai',
                'text': 'As a weekend cricketer, I injured my shoulder badly. PhysioWay\'s orthopedic physiotherapy got me back on the field in 8 weeks. The treatment plan was systematic, and I could track my progress through their app. Excellent service!',
                'rating': 5,
                'is_featured': False,
                'is_active': True,
                'order': 6
            },
        ]
        
        created_count = 0
        for data in testimonials_data:
            obj, created = Testimonial.objects.update_or_create(
                name=data['name'],
                condition=data['condition'],
                defaults=data
            )
            if created:
                created_count += 1
        
        self.stdout.write(f'  Testimonials: {created_count} created, {len(testimonials_data) - created_count} updated')

    def create_statistics(self):
        """Create statistics for landing page"""
        stats_data = [
            {
                'icon': '👥',
                'value': '5000+',
                'label': 'Patients Treated',
                'order': 1,
                'is_active': True
            },
            {
                'icon': '🏥',
                'value': '50+',
                'label': 'Expert Therapists',
                'order': 2,
                'is_active': True
            },
            {
                'icon': '🕐',
                'value': '24/7',
                'label': 'Support Available',
                'order': 3,
                'is_active': True
            },
            {
                'icon': '📈',
                'value': '98%',
                'label': 'Success Rate',
                'order': 4,
                'is_active': True
            },
        ]
        
        created_count = 0
        for data in stats_data:
            obj, created = Statistic.objects.update_or_create(
                label=data['label'],
                defaults=data
            )
            if created:
                created_count += 1
        
        self.stdout.write(f'  Statistics: {created_count} created, {len(stats_data) - created_count} updated')

    def create_why_choose_us(self):
        """Create why choose us items"""
        items_data = [
            {
                'icon': '🔍',
                'title': 'Transparency',
                'description': 'Complete transparency in treatment plans, progress, and billing with detailed digital records accessible anytime.',
                'order': 1,
                'is_active': True
            },
            {
                'icon': '🚗',
                'title': 'Convenience',
                'description': 'We come to you! No need to travel for physiotherapy sessions. Professional treatment in the comfort of your home.',
                'order': 2,
                'is_active': True
            },
            {
                'icon': '🎓',
                'title': 'Expert Team',
                'description': 'Certified physiotherapists with 5+ years of experience and continuous training in latest rehabilitation techniques.',
                'order': 3,
                'is_active': True
            },
            {
                'icon': '📱',
                'title': 'Technology-Driven',
                'description': 'Modern digital platform for seamless communication, appointment booking, and real-time progress tracking.',
                'order': 4,
                'is_active': True
            },
            {
                'icon': '👨‍⚕️',
                'title': 'Doctor Oversight',
                'description': 'Every patient treatment is supervised by qualified medical doctors ensuring the highest standard of care.',
                'order': 5,
                'is_active': True
            },
            {
                'icon': '🎯',
                'title': 'Personalized Care',
                'description': 'Customized treatment plans tailored to your specific condition, goals, and home environment.',
                'order': 6,
                'is_active': True
            },
            {
                'icon': '🛡️',
                'title': 'Insurance Support',
                'description': 'We work with major insurance providers to make quality physiotherapy care affordable and accessible.',
                'order': 7,
                'is_active': True
            },
            {
                'icon': '🕐',
                'title': '24/7 Support',
                'description': 'Round-the-clock support for emergencies, queries, and urgent consultations via phone and chat.',
                'order': 8,
                'is_active': True
            },
        ]
        
        created_count = 0
        for data in items_data:
            obj, created = WhyChooseUs.objects.update_or_create(
                title=data['title'],
                defaults=data
            )
            if created:
                created_count += 1
        
        self.stdout.write(f'  Why Choose Us: {created_count} created, {len(items_data) - created_count} updated')
