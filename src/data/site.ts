/** Public identity used by the header, footer, metadata, and structured data. */
export const site = {
  name: 'Muhammad Rizwan',
  shortName: 'RIZZY',
  role: 'Software engineer',
  jobTitle: 'Full-Stack Software Engineer',
  /** Short introduction under the name in the home hero. */
  intro: {
    role: 'Full-Stack Software Engineer / Applied AI',
    summary:
      'Five-plus years building web products end to end. Now building the machine learning that makes them smarter.',
  },
  description:
    "Muhammad Rizwan's software projects, architecture studies, machine learning experiments, articles, experience, and certificates.",
  email: 'xrizwanr@gmail.com',
  github: 'https://github.com/xRizwan',
  linkedin: 'https://www.linkedin.com/in/muhammad-rizwan-j/',
  resume: '/documents/muhammad-rizwan-resume.pdf',
  ogImage: '/og/default.jpg',
  language: 'en',
} as const;

export interface NavLink {
  label: string;
  href: string;
}

export const mainNav: NavLink[] = [
  { label: 'Skills', href: '/#skills' },
  { label: 'About me', href: '/experience/#about' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Experience', href: '/experience/' },
  { label: 'Certificates', href: '/#certificates' },
];
