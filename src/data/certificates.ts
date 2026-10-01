import type { ImageMetadata } from 'astro';
import agenticAi from '../assets/certificates/agentic-ai.png';
import awsMlEngineer from '../assets/certificates/aws-ml-engineer.png';
import cs50w from '../assets/certificates/cs50w.png';
import cs50x from '../assets/certificates/cs50x.png';
import deepLearning from '../assets/certificates/deep-learning.png';
import fullStackOpen from '../assets/certificates/full-stack-open.png';
import machineLearning from '../assets/certificates/machine-learning.jpg';
import mathematicsMl from '../assets/certificates/mathematics-ml.png';
import nlpSpecialization from '../assets/certificates/nlp-specialization.png';
import rag from '../assets/certificates/rag.png';
import softwareArchitect from '../assets/certificates/software-architect.png';
import unityEssentials from '../assets/certificates/unity-essentials.png';
import unityJuniorProgrammer from '../assets/certificates/unity-junior-programmer.png';

export interface Credential {
  id: string;
  title: string;
  issuer: string;
  image: ImageMetadata;
  kind: 'certificate' | 'badge';
  /**
   * Featured certificates appear in the home page's fanned stack at this position, from -2
   * (left) to 2 (right). The Udacity certificate stays in the centre.
   */
  fan?: -2 | -1 | 0 | 1 | 2;
}

/** Gallery order. Images are the actual documents and badges (sources: LinkedIn credentials and the user's certificate files). */
export const credentials: Credential[] = [
  {
    id: 'software-architect',
    title: 'Software Architect',
    issuer: 'Udacity',
    image: softwareArchitect,
    kind: 'certificate',
    fan: 0,
  },
  {
    id: 'aws-ml-engineer',
    title: 'AWS Machine Learning Engineer Nanodegree',
    issuer: 'Udacity',
    image: awsMlEngineer,
    kind: 'certificate',
    fan: 1,
  },
  {
    id: 'agentic-ai',
    title: 'Agentic AI',
    issuer: 'DeepLearning.AI',
    image: agenticAi,
    kind: 'certificate',
    fan: -1,
  },
  {
    id: 'nlp-specialization',
    title: 'Natural Language Processing Specialization',
    issuer: 'DeepLearning.AI',
    image: nlpSpecialization,
    kind: 'certificate',
    fan: 2,
  },
  {
    id: 'deep-learning',
    title: 'Deep Learning Specialization',
    issuer: 'DeepLearning.AI',
    image: deepLearning,
    kind: 'certificate',
    fan: -2,
  },
  {
    id: 'mathematics-ml',
    title: 'Mathematics for Machine Learning and Data Science',
    issuer: 'DeepLearning.AI',
    image: mathematicsMl,
    kind: 'certificate',
  },
  {
    id: 'rag',
    title: 'Retrieval Augmented Generation (RAG)',
    issuer: 'DeepLearning.AI',
    image: rag,
    kind: 'certificate',
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning Specialization',
    issuer: 'DeepLearning.AI and Stanford Online',
    image: machineLearning,
    kind: 'certificate',
  },
  {
    id: 'full-stack-open',
    title: 'Full Stack Open',
    issuer: 'University of Helsinki',
    image: fullStackOpen,
    kind: 'certificate',
  },
  {
    id: 'cs50w',
    title: 'CS50’s Web Programming with Python and JavaScript',
    issuer: 'Harvard University',
    image: cs50w,
    kind: 'certificate',
  },
  {
    id: 'cs50x',
    title: 'CS50’s Introduction to Computer Science',
    issuer: 'Harvard University',
    image: cs50x,
    kind: 'certificate',
  },
  {
    id: 'unity-junior-programmer',
    title: 'Unity Junior Programmer',
    issuer: 'Unity Technologies',
    image: unityJuniorProgrammer,
    kind: 'badge',
  },
  {
    id: 'unity-essentials',
    title: 'Unity Essentials',
    issuer: 'Unity Technologies',
    image: unityEssentials,
    kind: 'badge',
  },
];

export const credentialAlt = (credential: Pick<Credential, 'title' | 'issuer' | 'kind'>): string =>
  `${credential.title} ${credential.kind} issued by ${credential.issuer}`;
