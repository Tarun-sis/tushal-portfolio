
/**
 * Central content file.
 * Edit text, projects, services and contact details here.
 * No invented prices, testimonials or statistics.
 */

const env = import.meta.env;

export const siteConfig = {
  name: 'Tushal Sisodia',
  role: 'Website creator & student developer',
  location: 'Delhi, India',

  /**
   * Public contact details.
   * Configure these in the root .env file.
   * Empty values mean the relevant contact option is unavailable.
   */
  email: (env.VITE_CONTACT_EMAIL ?? '').trim(),
  whatsapp: (env.VITE_WHATSAPP ?? '').trim(),

  footerCredit: 'Developed by Tushal Sisodia',

  /**
   * Path to a real portrait inside public/.
   * Example: '/portrait.jpg'
   * Empty means the abstract placeholder is shown.
   */
  portraitSrc: '',

  /** Show the brief intro animation once per browser session. */
  showLoader: true,
} as const;

export const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Process', href: '#process' },
  { label: 'Contact', href: '#contact' },
] as const;

export const hero = {
  eyebrow: 'Student Developer · Delhi, India',
  lines: ['Websites That Bring', 'Your Ideas to'],
  highlight: 'Life.',
  description:
    'I design and build modern, responsive websites with thoughtful details, smooth interactions, and a focus on real-world usability.',
  primaryCta: { label: 'Explore My Work', href: '#projects' },
  secondaryCta: { label: 'Get in Touch', href: '#contact' },
};

export const websiteTypes = [
  'Business website',
  'Landing page',
  'Portfolio website',
  'Website redesign',
  'Responsive design',
  'Contact form or database integration',
  'Not sure yet',
] as const;

export type WebsiteType = (typeof websiteTypes)[number];

export interface ServiceItem {
  icon: string;
  title: string;
  benefit: string;
  type: WebsiteType;
}

export const services: ServiceItem[] = [
  {
    icon: 'Store',
    title: 'Business Websites',
    type: 'Business website',
    benefit:
      'A clear, professional home on the web so customers can find what you offer, see who you are, and get in touch.',
  },
  {
    icon: 'Rocket',
    title: 'Landing Pages',
    type: 'Landing page',
    benefit:
      'One focused page for an offer, launch or event, designed to guide visitors toward a single action.',
  },
  {
    icon: 'UserRound',
    title: 'Portfolio Websites',
    type: 'Portfolio website',
    benefit:
      'Present your work and story with a tidy, memorable site that makes a strong first impression.',
  },
  {
    icon: 'RefreshCw',
    title: 'Website Redesign',
    type: 'Website redesign',
    benefit:
      'Give an outdated or hard-to-use site a fresh look, clearer navigation and a layout that works on phones.',
  },
  {
    icon: 'Smartphone',
    title: 'Responsive Design',
    type: 'Responsive design',
    benefit:
      'Make your website comfortable to use on phones, tablets and desktop screens.',
  },
  {
    icon: 'DatabaseZap',
    title: 'Contact Forms',
    type: 'Contact form or database integration',
    benefit:
      'Let visitors send enquiries that are saved securely, so you can follow up without missing messages.',
  },
];

export interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  linkLabel: string;
  image: {
    src: string;
    alt: string;
    note: string;
  };
}

export const projects: Project[] = [
  {
    id: 'personal',
    name: 'My Portfolio Website',
    description:
      'My personal portfolio showcasing my projects, skills, and website development work.',
    url: 'https://tushalsisodia-dev.vercel.app/',
    linkLabel: 'Visit Live Project',
    image: {
      src: '/projects/portfolio-preview.svg',
      alt: 'Original illustrated preview of Tushal’s dark portfolio interface with lime accents; not a live-site screenshot.',
      note: 'Original interface illustration · not a screenshot',
    },
  },
  {
    id: 'civiclens',
    name: 'CivicLens AI',
    description:
      'An AI-assisted civic intelligence prototype for reporting, prioritising, and tracking civic issues.',
    url: 'https://civiclens-ai-bic.vercel.app/',
    linkLabel: 'Visit Live Project',
    image: {
      src: '/projects/civiclens-preview.svg',
      alt: 'Original CivicLens-style dashboard illustration with an abstract city map, issue categories, and example status panels; not live civic data.',
      note: 'Original dashboard illustration · example content',
    },
  },
  {
    id: 'urbannest',
    name: 'UrbanNest Studio',
    description:
      'A real-estate website experience featuring modern property presentation and a polished browsing interface.',
    url: 'https://urbannest-studio.vercel.app/',
    linkLabel: 'Visit Live Project',
    image: {
      src: '/projects/urbannest-preview.svg',
      alt: 'Original warm-toned UrbanNest Studio website illustration featuring an elegant living room interior; not a live-site screenshot.',
      note: 'Original interior illustration · not a screenshot',
    },
  },
];

export const capabilities = [
  {
    icon: 'Smartphone',
    title: 'Responsive frontend development',
    desc: 'Layouts that adapt cleanly from small phones to wide desktop screens.',
  },
  {
    icon: 'Palette',
    title: 'Modern website design',
    desc: 'Considered typography, spacing and colour so a business looks credible.',
  },
  {
    icon: 'MousePointerClick',
    title: 'Interactive interfaces',
    desc: 'Tasteful motion and working interactions that help visitors, not distract them.',
  },
  {
    icon: 'CloudUpload',
    title: 'Website deployment',
    desc: 'Publishing the finished site and explaining how it is maintained.',
  },
  {
    icon: 'Mail',
    title: 'Contact form integration',
    desc: 'Enquiry forms with validation and spam protection, wired to a real backend.',
  },
  {
    icon: 'Database',
    title: 'Database-backed features',
    desc: 'Forms that validate on the server and store enquiries in a Supabase database, with spam protection.',
  },
];

export const processSteps = [
  {
    n: '01',
    title: 'Discover',
    desc: 'Understand the business, its customers, and their goals.',
  },
  {
    n: '02',
    title: 'Design',
    desc: 'Plan the layout, visual identity, and customer experience.',
  },
  {
    n: '03',
    title: 'Build',
    desc: 'Develop a responsive website and implement the agreed features.',
  },
  {
    n: '04',
    title: 'Launch',
    desc: 'Test the website, deploy it, and explain how to maintain it.',
  },
];

export const faqItems = [
  {
    q: 'What types of websites can you create?',
    a: 'Business websites, landing pages, portfolios, responsive redesigns, and contact forms connected to a database. If you are unsure, tell me about your business and I will suggest what fits.',
  },
  {
    q: 'Can you create a website for a local shop?',
    a: 'Yes, that is exactly what I focus on. A local shop site can show what you sell, where you are, when you are open and how to contact you.',
  },
  {
    q: 'Will the website work on mobile?',
    a: 'Yes. Every site I build is responsive and checked on small phone screens, tablets and desktops, because many local customers browse on a phone.',
  },
  {
    q: 'How can I request a website?',
    a: 'Fill in the enquiry form below with a few details about your business and what you need. I will read it and reply using the contact detail you provide. There is no obligation.',
  },
  {
    q: 'Can an existing website be redesigned?',
    a: 'Often, yes. I can improve the look, navigation and mobile layout. It depends on how the current site is built and whether I can access its files or content, so I will tell you honestly what is possible.',
  },
  {
    q: 'Who handles domain and hosting costs?',
    a: 'Domain names and paid hosting are provided by third-party companies and are paid for directly by the business owner. I can explain the options and help set things up, but they are not automatically included.',
  },
];

export const footerServices = services.map((service) => service.title);
