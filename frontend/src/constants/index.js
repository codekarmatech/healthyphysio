// Theme Constants
export const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  secondary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407',
  }
};

// Company Information
export const COMPANY_INFO = {
  name: 'PhysioWay',
  tagline: 'Your Health, Our Priority',
  slogans: [
    'Your Health, Our Priority',
    'Our Aim, Your Fitness',
    'Healing Starts, Here with Us'
  ],
  description: 'Experience world-class physiotherapy at home with our team of certified professionals.',
  phone: '+91 6353202177',
  email: 'contact@physioway.com',
  website: 'https://physioway.com',
  serviceAreas: ['Delhi NCR', 'Mumbai', 'Bangalore'],
  workingHours: {
    weekdays: 'Mon-Sat: 8AM-8PM',
    weekend: 'Sun: 10AM-6PM'
  },
  socialMedia: {
    facebook: 'https://facebook.com/physioway',
    instagram: 'https://instagram.com/physioway',
    linkedin: 'https://linkedin.com/company/physioway',
    twitter: 'https://twitter.com/physioway'
  },
  itPartner: {
    name: 'Codingbullz',
    fullName: 'Codingbull Technovations Pvt. LTD',
    website: 'https://www.codingbullz.com',
    logo: '/images/partners/codingbullz-logo.png',
    description: 'Leading technology partner specializing in healthcare solutions, digital transformation, and innovative software development. With expertise in modern web technologies, mobile applications, and cloud infrastructure, Codingbull Technovations has been instrumental in building PhysioWay\'s cutting-edge platform.'
  },
  founder: {
    name: 'Dr. Rajavi Dixit',
    title: 'Founder & Chief Neurological Physiotherapist',
    specialization: 'Neurological Physiotherapy',
    description: 'A young and highly experienced neurological physiotherapist with a passion for revolutionizing home-based healthcare. Dr. Rajavi Dixit founded PhysioWay with the vision of making quality physiotherapy accessible to everyone, combining clinical expertise with innovative technology.',
    qualifications: [
      'Masters in Neurological Physiotherapy',
      'Certified Neuro-Developmental Therapist',
      'Advanced Stroke Rehabilitation Specialist',
      'Digital Health Innovation Certified'
    ],
    experience: '8+ years in neurological rehabilitation',
    achievements: [
      'Treated 2000+ neurological patients',
      'Pioneer in home-based neuro physiotherapy',
      'Published researcher in rehabilitation sciences',
      'Healthcare technology innovator'
    ],
    vision: 'To transform physiotherapy delivery through technology and make expert neurological care accessible to every patient in their home environment.'
  }
};

// Statistics
export const STATS = [
  { number: '5000+', label: 'Patients Treated', icon: '👥' },
  { number: '50+', label: 'Expert Therapists', icon: '🏥' },
  { number: '24/7', label: 'Support Available', icon: '🕐' },
  { number: '98%', label: 'Success Rate', icon: '📈' }
];

// Services Data
export const SERVICES = {
  main: [
    {
      id: 'orthopedic',
      title: 'Orthopedic Physiotherapy',
      description: 'Specialized treatment for musculoskeletal conditions, injuries, and post-surgical rehabilitation.',
      icon: '🦴',
      features: ['Joint mobilization', 'Muscle strengthening', 'Pain management', 'Post-surgery recovery'],
      conditions: ['Arthritis', 'Fractures', 'Sports injuries', 'Back pain', 'Neck pain', 'Joint replacements']
    },
    {
      id: 'neurological',
      title: 'Neurological Physiotherapy',
      description: 'Rehabilitation for nervous system disorders to improve movement and functional independence.',
      icon: '🧠',
      features: ['Balance training', 'Gait re-education', 'Strength exercises', 'Coordination therapy'],
      conditions: ['Stroke', 'Cerebral palsy', 'Multiple sclerosis', 'Parkinson\'s disease', 'Spinal cord injuries']
    },
    {
      id: 'cardiopulmonary',
      title: 'Cardiopulmonary Physiotherapy',
      description: 'Specialized care for heart and lung conditions to improve cardiovascular and respiratory health.',
      icon: '❤️',
      features: ['Breathing exercises', 'Chest physiotherapy', 'Endurance training', 'Airway clearance'],
      conditions: ['COPD', 'Asthma', 'Post-cardiac surgery', 'Pneumonia', 'Chronic bronchitis']
    },
    {
      id: 'pediatric',
      title: 'Pediatric Physiotherapy',
      description: 'Fun and engaging therapy sessions designed specifically for children\'s developmental needs.',
      icon: '👶',
      features: ['Motor skill development', 'Play-based therapy', 'Coordination training', 'Strength building'],
      conditions: ['Developmental delays', 'Cerebral palsy', 'Muscular dystrophy', 'Autism spectrum disorders']
    },
    {
      id: 'geriatric',
      title: 'Geriatric Physiotherapy',
      description: 'Specialized care for older adults focusing on mobility, independence, and fall prevention.',
      icon: '👴',
      features: ['Fall prevention', 'Balance training', 'Mobility enhancement', 'Pain management'],
      conditions: ['Osteoporosis', 'Arthritis', 'Balance disorders', 'Post-surgical recovery']
    },
    {
      id: 'womens-health',
      title: 'Women\'s Health Physiotherapy',
      description: 'Specialized care for women\'s health issues including pregnancy and pelvic floor dysfunction.',
      icon: '👩',
      features: ['Pelvic floor therapy', 'Prenatal care', 'Postnatal recovery', 'Pain management'],
      conditions: ['Pregnancy-related pain', 'Pelvic floor dysfunction', 'Diastasis recti', 'Incontinence']
    }
  ],
  additional: [
    {
      title: 'Home Physiotherapy',
      description: 'Professional physiotherapy services delivered at your doorstep for maximum convenience.',
      icon: '🏠',
      features: ['Personalized treatment plans', 'Flexible scheduling', 'Professional equipment']
    },
    {
      title: 'Online Consultations',
      description: 'Virtual consultations with certified physiotherapists for assessment and follow-up care.',
      icon: '💻',
      features: ['Video consultations', 'Digital assessments', '24/7 support']
    },
    {
      title: 'Progress Tracking',
      description: 'Advanced digital tracking system to monitor your recovery progress and treatment effectiveness.',
      icon: '📊',
      features: ['Real-time monitoring', 'Detailed reports', 'Goal tracking']
    },
    {
      title: 'Doctor Oversight',
      description: 'Every treatment is overseen by qualified doctors ensuring the highest standard of care.',
      icon: '👨‍⚕️',
      features: ['Medical supervision', 'Treatment validation', 'Safety protocols']
    }
  ]
};

// Why Choose Us
export const WHY_CHOOSE_US = [
  {
    title: 'Transparency',
    description: 'Complete transparency in treatment plans, progress, and billing with detailed digital records.',
    icon: '🔍',
    features: ['Clear pricing', 'Progress reports', 'Treatment documentation']
  },
  {
    title: 'Convenience',
    description: 'We come to you! No need to travel for physiotherapy sessions.',
    icon: '🚗',
    features: ['Home visits', 'Flexible timing', 'Equipment provided']
  },
  {
    title: 'Expert Team',
    description: 'Certified physiotherapists with years of experience and continuous training.',
    icon: '🎓',
    features: ['Licensed professionals', '5+ years experience', 'Ongoing education']
  },
  {
    title: 'Technology-Driven',
    description: 'Modern digital platform for seamless communication and progress tracking.',
    icon: '📱',
    features: ['Mobile app', 'Digital tracking', 'Video consultations']
  },
  {
    title: 'Doctor Oversight',
    description: 'Every patient treatment is supervised by qualified medical doctors.',
    icon: '👨‍⚕️',
    features: ['Medical supervision', 'Treatment validation', 'Safety protocols']
  },
  {
    title: 'Personalized Care',
    description: 'Customized treatment plans tailored to your specific condition and goals.',
    icon: '🎯',
    features: ['Individual assessment', 'Custom exercises', 'Goal-oriented therapy']
  },
  {
    title: 'Insurance Support',
    description: 'We work with major insurance providers to make quality care affordable.',
    icon: '🛡️',
    features: ['Insurance claims', 'Cashless treatment', 'Flexible payments']
  },
  {
    title: '24/7 Support',
    description: 'Round-the-clock support for emergencies and urgent consultations.',
    icon: '🕐',
    features: ['Emergency care', 'Helpline support', 'Quick response']
  }
];

// Navigation Items
export const NAVIGATION = {
  main: [
    { name: 'Home', href: '/', id: 'home' },
    { name: 'Services', href: '/services', id: 'services' },
    { name: 'About Us', href: '/about', id: 'about' },
    { name: 'Blog', href: '/blog', id: 'blog' },
    { name: 'Contact', href: '/contact', id: 'contact' }
  ],
  services: [
    { name: 'Orthopedic Physiotherapy', href: '/services/orthopedic' },
    { name: 'Neurological Physiotherapy', href: '/services/neurological' },
    { name: 'Cardiopulmonary Physiotherapy', href: '/services/cardiopulmonary' },
    { name: 'Pediatric Physiotherapy', href: '/services/pediatric' },
    { name: 'Geriatric Physiotherapy', href: '/services/geriatric' },
    { name: 'Women\'s Health', href: '/services/womens-health' }
  ]
};

// Blog Categories
export const BLOG_CATEGORIES = [
  'Treatment Tips',
  'Exercise Guides',
  'Health & Wellness',
  'Recovery Stories',
  'Technology in Healthcare',
  'Preventive Care'
];

// Common CSS Classes for DRY principle
export const CSS_CLASSES = {
  button: {
    primary: 'px-6 py-3 rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105',
    secondary: 'px-6 py-3 rounded-lg text-primary-600 bg-white border-2 border-primary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-300',
    outline: 'px-6 py-3 rounded-lg border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white transition-all duration-300'
  },
  card: {
    base: 'bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105',
    padding: 'p-6 lg:p-8'
  },
  section: {
    padding: 'py-16 lg:py-20',
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
  },
  heading: {
    h1: 'text-4xl lg:text-6xl font-bold text-gray-900',
    h2: 'text-3xl lg:text-5xl font-bold text-gray-900',
    h3: 'text-2xl lg:text-3xl font-bold text-gray-900',
    gradient: 'bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent'
  },
  animation: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    slideInLeft: 'animate-slide-in-left',
    slideInRight: 'animate-slide-in-right'
  }
};
