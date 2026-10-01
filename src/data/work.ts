/** Rows in the home page's "Blog & Work Samples" list. Each row points at a collection entry by id. */
export interface WorkRow {
  collection: 'projects' | 'articles';
  id: string;
  label: string;
  title: string;
  /** Short label shown in the custom cursor on hover. */
  cursor: string;
  preview: 'architecture' | 'vision' | 'triage';
}

export const workRows: WorkRow[] = [
  {
    collection: 'projects',
    id: 'isic-skin-cancer-detection',
    label: 'Machine learning',
    title: 'Skin Cancer Detection from 3D Total Body Photos',
    cursor: 'READ',
    preview: 'triage',
  },
  {
    collection: 'projects',
    id: 'real-time-fraud-detection',
    label: 'Architecture design',
    title: 'Real-Time Financial Fraud Detection',
    cursor: 'OPEN',
    preview: 'architecture',
  },
  {
    collection: 'projects',
    id: 'dog-breed-classification',
    label: 'Computer vision',
    title: 'Dog Breed Classification on AWS',
    cursor: 'VIEW',
    preview: 'vision',
  },
];
