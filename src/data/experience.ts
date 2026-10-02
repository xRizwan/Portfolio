// Career history and the "Skills & tools" toolbox for the Experience page.
// Sources: the supplied resumes plus the user's corrections (titles, promotion, extra stack).

export interface TechChip {
  /** Simple Icons slug in /public/tech, when a logo is available. */
  icon?: string;
  /** Short text badge used when no logo is available. */
  badge?: string;
  brand: string;
  /** Readable text colour on the dark page (pre-computed for contrast). */
  text: string;
  tile?: string;
}

export interface Role {
  company: string;
  dates: string;
  kind: string;
  titles: { title: string; dates: string }[];
  summary: string;
  points: string[];
  contributed: string[];
  stack: string[];
}

export interface ToolboxRow {
  label: string;
  items: string[];
}

export const experienceIntro = {
  eyebrow: 'Experience / Since 2020',
  headline: ['A few chapters', 'of building software.'],
  // About me, in the user's own terms: always learning, likes hard problems.
  about: {
    lead: "I'm a software engineer who is always learning something new.",
    body: 'For the past five-plus years I have built web products end to end, on payroll, HR and workforce products, client and open-source codebases, and mobile payments. Along the way I went from writing shared UI libraries and APIs to leading a team. Now I am learning machine learning the same way I learned everything else: by building things.',
    traits: [
      {
        title: 'Always learning',
        text: "I get restless when I'm not picking up something new.",
      },
      {
        title: 'Hard problems',
        text: "I enjoy a problem most when I don't know how to solve it yet.",
      },
      {
        title: 'Digging for answers',
        text: 'I search, read and try things until it makes sense, and I like to know why it works.',
      },
    ],
  },
};

export const chips: Record<string, TechChip> = {
  React: {
    icon: 'react',
    brand: '#61DAFB',
    text: '#61dafb',
    tile: '#20232a',
  },
  'Vue.js': {
    icon: 'vuedotjs',
    brand: '#4FC08D',
    text: '#4fc08d',
  },
  TypeScript: {
    icon: 'typescript',
    brand: '#3178C6',
    text: '#6096d3',
  },
  '.NET / ASP.NET Core': {
    icon: 'dotnet',
    brand: '#512BD4',
    text: '#967fe5',
  },
  Storybook: {
    icon: 'storybook',
    brand: '#FF4785',
    text: '#ff4785',
  },
  Histoire: {
    badge: 'Hi',
    brand: '#1b1b1b',
    text: '#c9d3c0',
    tile: '#c9d3c0',
  },
  Vitest: {
    icon: 'vitest',
    brand: '#1b1b1b',
    text: '#00ff74',
    tile: '#00FF74',
  },
  Figma: {
    icon: 'figma',
    brand: '#F24E1E',
    text: '#f46339',
  },
  'Next.js': {
    icon: 'nextdotjs',
    brand: '#000',
    text: '#979797',
  },
  'React Native': {
    icon: 'react',
    brand: '#61DAFB',
    text: '#61dafb',
    tile: '#20232a',
  },
  'Node.js': {
    icon: 'nodedotjs',
    brand: '#5FA04E',
    text: '#5fa04e',
  },
  'Express.js': {
    icon: 'express',
    brand: '#0A0A0A',
    text: '#8d8d8d',
  },
  PostgreSQL: {
    icon: 'postgresql',
    brand: '#4169E1',
    text: '#6c8be8',
  },
  GraphQL: {
    icon: 'graphql',
    brand: '#E10098',
    text: '#eb52b9',
  },
  Python: {
    icon: 'python',
    brand: '#3776AB',
    text: '#6495be',
  },
  'Apollo Client': {
    icon: 'apollographql',
    brand: '#311C87',
    text: '#9387c0',
  },
  Django: {
    icon: 'django',
    brand: '#44B78B',
    text: '#44b78b',
    tile: '#092E20',
  },
  Stripe: {
    icon: 'stripe',
    brand: '#635BFF',
    text: '#8680ff',
  },
  PayPal: {
    icon: 'paypal',
    brand: '#002991',
    text: '#798ec5',
  },
  Webhooks: {
    badge: '↯',
    brand: '#1b1b1b',
    text: '#c9d3c0',
    tile: '#c9d3c0',
  },
  JavaScript: {
    icon: 'javascript',
    brand: '#1b1b1b',
    text: '#f7df1e',
    tile: '#F7DF1E',
  },
  'C#': {
    badge: 'C#',
    brand: '#fff',
    text: '#af8ab9',
    tile: '#68217A',
  },
  'C++': {
    icon: 'cplusplus',
    brand: '#00599C',
    text: '#679cc3',
  },
  SQL: {
    badge: 'SQL',
    brand: '#1b1b1b',
    text: '#c9d3c0',
    tile: '#c9d3c0',
  },
  HTML5: {
    icon: 'html5',
    brand: '#E34F26',
    text: '#e66440',
  },
  'CSS / Sass': {
    icon: 'sass',
    brand: '#CC6699',
    text: '#d278a5',
  },
  Nuxt: {
    icon: 'nuxt',
    brand: '#00A86B',
    text: '#00a86b',
  },
  Redux: {
    icon: 'redux',
    brand: '#764ABC',
    text: '#a284d1',
  },
  'TanStack Query': {
    icon: 'reactquery',
    brand: '#FF4154',
    text: '#ff5869',
  },
  Pinia: {
    badge: 'Pi',
    brand: '#1b1b1b',
    text: '#ffd859',
    tile: '#FFD859',
  },
  Vite: {
    icon: 'vite',
    brand: '#9135FF',
    text: '#b475ff',
  },
  'Tailwind CSS': {
    icon: 'tailwindcss',
    brand: '#06B6D4',
    text: '#06b6d4',
  },
  'Material UI': {
    icon: 'mui',
    brand: '#007FFF',
    text: '#1f8eff',
  },
  'shadcn/ui': {
    icon: 'shadcnui',
    brand: '#000',
    text: '#979797',
  },
  FastAPI: {
    icon: 'fastapi',
    brand: '#009688',
    text: '#1fa396',
  },
  'REST APIs': {
    badge: '{ }',
    brand: '#1b1b1b',
    text: '#c9d3c0',
    tile: '#c9d3c0',
  },
  WebSockets: {
    badge: 'WS',
    brand: '#1b1b1b',
    text: '#c9d3c0',
    tile: '#c9d3c0',
  },
  'Swagger / OpenAPI': {
    icon: 'swagger',
    brand: '#1b1b1b',
    text: '#85ea2d',
    tile: '#85EA2D',
  },
  MongoDB: {
    icon: 'mongodb',
    brand: '#47A248',
    text: '#47a248',
  },
  Redis: {
    icon: 'redis',
    brand: '#FF4438',
    text: '#ff5a50',
  },
  Supabase: {
    icon: 'supabase',
    brand: '#249361',
    text: '#3ea074',
  },
  Firebase: {
    icon: 'firebase',
    brand: '#DD2C00',
    text: '#e86f52',
  },
  AWS: {
    badge: 'aws',
    brand: '#FF9900',
    text: '#ff9900',
    tile: '#232F3E',
  },
  Docker: {
    icon: 'docker',
    brand: '#2496ED',
    text: '#2496ed',
  },
  Git: {
    icon: 'git',
    brand: '#F03C2E',
    text: '#f4685d',
  },
  'Azure DevOps': {
    badge: 'Az',
    brand: '#fff',
    text: '#3a96de',
    tile: '#0078D4',
  },
  Vercel: {
    icon: 'vercel',
    brand: '#000',
    text: '#979797',
  },
  PyTorch: {
    icon: 'pytorch',
    brand: '#EE4C2C',
    text: '#f06145',
  },
  TensorFlow: {
    icon: 'tensorflow',
    brand: '#FF6F00',
    text: '#ff6f00',
  },
  'scikit-learn': {
    icon: 'scikitlearn',
    brand: '#F7931E',
    text: '#f7931e',
  },
  NumPy: {
    icon: 'numpy',
    brand: '#013243',
    text: '#79949c',
  },
  pandas: {
    icon: 'pandas',
    brand: '#150458',
    text: '#938bb2',
  },
  'Hugging Face': {
    icon: 'huggingface',
    brand: '#1b1b1b',
    text: '#ffd21e',
    tile: '#FFD21E',
  },
  'AWS Lambda': {
    badge: 'λ',
    brand: '#FF9900',
    text: '#ff9900',
    tile: '#232F3E',
  },
  'Amazon S3': {
    badge: 'S3',
    brand: '#FF9900',
    text: '#ff9900',
    tile: '#232F3E',
  },
  'Amazon EC2': {
    badge: 'EC2',
    brand: '#FF9900',
    text: '#ff9900',
    tile: '#232F3E',
  },
  'AWS Step Functions': {
    badge: 'SF',
    brand: '#FF9900',
    text: '#ff9900',
    tile: '#232F3E',
  },
  AutoGluon: {
    badge: 'AG',
    brand: '#1F8FA6',
    text: '#5cc4d8',
    tile: '#10303a',
  },
  'Amazon SageMaker': {
    badge: 'SM',
    brand: '#FF9900',
    text: '#ff9900',
    tile: '#232F3E',
  },
  RAG: {
    badge: 'RAG',
    brand: '#1b1b1b',
    text: '#c9d3c0',
    tile: '#c9d3c0',
  },
  'Vector databases': {
    badge: 'Vec',
    brand: '#1b1b1b',
    text: '#c9d3c0',
    tile: '#c9d3c0',
  },
  'Semantic search': {
    badge: '⌕',
    brand: '#1b1b1b',
    text: '#c9d3c0',
    tile: '#c9d3c0',
  },
  Unity: {
    icon: 'unity',
    brand: '#000',
    text: '#c9d3c0',
  },
  Godot: {
    icon: 'godotengine',
    brand: '#478CBF',
    text: '#5d9ac7',
  },
  'LÖVE (Love2D)': {
    badge: '♥',
    brand: '#fff',
    text: '#ea60a5',
    tile: '#E74A99',
  },
  'Claude Code': {
    icon: 'claude',
    brand: '#D97757',
    text: '#d97757',
  },
  'OpenAI Codex': {
    badge: 'Cx',
    brand: '#fff',
    text: '#909090',
    tile: '#111',
  },
  Gemini: {
    icon: 'googlegemini',
    brand: '#8E75B2',
    text: '#9c86bb',
  },
  Cursor: {
    icon: 'cursor',
    brand: '#000',
    text: '#979797',
  },
};

export const roles: Role[] = [
  {
    dates: 'Nov 2022 — Present',
    kind: 'Payroll, HR & workforce SaaS',
    company: 'Worklio',
    titles: [
      {
        title: 'Frontend Engineer',
        dates: 'Nov 2022 — Present',
      },
    ],
    summary:
      'Embedded and white-label payroll and HR products, including WageTime: React and Vue frontends, shared TypeScript SDK and UI packages, and C#/.NET APIs.',
    points: [
      'Built complex scheduling workflows: recurring schedules, employee and team assignments, daily, weekly, and monthly calendars, schedule changes, conflict review, and time-off-aware coverage.',
      'Delivered workforce features across Time & Attendance, timesheets and timecard rules, Time Off, company and holiday calendars, Pulse Surveys, NPS, absence analytics, tasks, and earned-wage access.',
      'Contributed to ASP.NET Core REST APIs and their API-model and business layers, coordinating frontend and backend contracts across modules.',
      'Built and maintained reusable React and Vue component libraries with Storybook and Histoire, keeping core and partner-branded experiences consistent.',
      'Translated Figma designs into responsive, production-ready interfaces connected to backend services through typed API clients.',
      'Implemented and tested TypeScript domain utilities, component stories, and complex UI state flows with Vitest and shared monorepo tooling.',
    ],
    contributed: [],
    stack: [
      'React',
      'Vue.js',
      'TypeScript',
      '.NET / ASP.NET Core',
      'Storybook',
      'Histoire',
      'Vitest',
      'Figma',
    ],
  },
  {
    dates: 'Oct 2021 — Nov 2022',
    kind: 'Distributed engineering for client & open-source products',
    company: 'GitStart',
    titles: [
      {
        title: 'Technical Team Lead',
        dates: 'Apr 2022 — Nov 2022',
      },
      {
        title: 'Full-Stack Software Engineer',
        dates: 'Oct 2021 — Apr 2022',
      },
    ],
    summary:
      'Full-stack delivery for client and open-source codebases, then leading a distributed team’s technical work.',
    points: [
      'As team lead: served as the primary code reviewer for a distributed team, enforcing quality standards and guiding implementation decisions.',
      'As team lead: converted complex requirements into actionable tasks and coordinated delivery across contributors.',
      'Architected backend services with Node.js, Express.js, and PostgreSQL for reliable web products.',
      'Built React and Next.js interfaces and integrated them with backend APIs across client and open-source projects.',
      'Delivered React Native mobile features for client applications alongside the web work.',
    ],
    contributed: [
      'Instrumental',
      'Immunefi',
      'Omnivore',
      'Konch',
      'Paycrow',
      'Sourcegraph',
      'Parabol',
      'Appsmith',
    ],
    stack: [
      'React',
      'Next.js',
      'React Native',
      'Node.js',
      'Express.js',
      'PostgreSQL',
      'TypeScript',
      'GraphQL',
      'Python',
      'Apollo Client',
    ],
  },
  {
    dates: 'Aug 2020 — Jul 2021',
    kind: 'Web, mobile & payments',
    company: 'Avybe',
    titles: [
      {
        title: 'Full-Stack Software Engineer',
        dates: 'Aug 2020 — Jul 2021',
      },
    ],
    summary: 'Backend APIs, production mobile apps, and payment flows.',
    points: [
      'Designed secure, scalable backend APIs and integrated them with frontend workflows.',
      'Integrated PayPal and Stripe, using webhooks for real-time transaction updates and payment processing.',
      'Built and shipped production React Native applications connected to backend APIs and payment workflows.',
      'Translated Figma designs into responsive web interfaces that stay consistent across devices.',
      'Reduced load times in an existing mobile application by 30% through refactoring and performance tuning.',
    ],
    contributed: [],
    stack: [
      'React Native',
      'React',
      'Node.js',
      'Python',
      'Django',
      'Stripe',
      'PayPal',
      'Webhooks',
      'Figma',
    ],
  },
];

export const toolbox: ToolboxRow[] = [
  {
    label: 'Languages',
    items: ['TypeScript', 'JavaScript', 'Python', 'C#', 'C++', 'SQL', 'HTML5', 'CSS / Sass'],
  },
  {
    label: 'Frontend',
    items: [
      'React',
      'Vue.js',
      'Next.js',
      'Nuxt',
      'React Native',
      'Redux',
      'TanStack Query',
      'Apollo Client',
      'Pinia',
      'Vite',
      'Tailwind CSS',
      'Material UI',
      'shadcn/ui',
    ],
  },
  {
    label: 'Backend & APIs',
    items: [
      '.NET / ASP.NET Core',
      'Node.js',
      'Express.js',
      'Django',
      'FastAPI',
      'GraphQL',
      'REST APIs',
      'WebSockets',
      'Swagger / OpenAPI',
      'Webhooks',
    ],
  },
  {
    label: 'Databases',
    items: ['PostgreSQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase'],
  },
  {
    label: 'Cloud & DevOps',
    items: [
      'AWS',
      'AWS Lambda',
      'Amazon S3',
      'Amazon EC2',
      'AWS Step Functions',
      'Docker',
      'Git',
      'Azure DevOps',
      'Vercel',
    ],
  },
  {
    label: 'Payments',
    items: ['Stripe', 'PayPal'],
  },
  {
    label: 'UI quality & testing',
    items: ['Vitest', 'Storybook', 'Histoire', 'Figma'],
  },
  {
    label: 'AI / ML',
    items: [
      'PyTorch',
      'TensorFlow',
      'scikit-learn',
      'NumPy',
      'pandas',
      'Hugging Face',
      'Amazon SageMaker',
      'AutoGluon',
      'RAG',
      'Vector databases',
      'Semantic search',
    ],
  },
  {
    label: 'Game development',
    items: ['Unity', 'Godot', 'LÖVE (Love2D)'],
  },
  {
    label: 'AI-assisted dev',
    items: ['Claude Code', 'OpenAI Codex', 'Gemini', 'Cursor'],
  },
];
