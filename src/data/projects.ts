import type { Project } from '../types/project';
import titleImage from '../assets/figma/project-title.svg';
import axeImage from '../assets/figma/practice-axe.png';

export const projects: readonly Project[] = [
  {
    id: 'practice-axe',
    title: 'practice_axe.fbx',
    titleImageSrc: titleImage,
    imageSrc: axeImage,
    imageAlt: '3D render of a weathered axe with a rusted metal blade and wooden handle',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
];
