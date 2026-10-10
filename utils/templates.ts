import { todayTitle } from './noteUtils';

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  title: () => string;
  content: () => string;
  tags: string[];
}

const longDate = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

export const TEMPLATES: NoteTemplate[] = [
  {
    id: 'daily',
    name: 'Daily note',
    description: 'Plan the day, log what happened',
    title: () => todayTitle(),
    tags: ['daily'],
    content: () => `## ${longDate()}\n### Top 3 today\n- …\n- …\n- …\n### Notes\n\n### Wins\n- …`,
  },
  {
    id: 'meeting',
    name: 'Meeting notes',
    description: 'Attendees, agenda, decisions, actions',
    title: () => `Meeting ${todayTitle()}`,
    tags: ['meeting'],
    content: () =>
      `## Attendees\n- …\n## Agenda\n1. …\n## Notes\n\n## Decisions\n- …\n## Action items\n- …`,
  },
  {
    id: 'project',
    name: 'Project brief',
    description: 'Goal, scope, milestones, risks',
    title: () => 'New project',
    tags: ['project'],
    content: () =>
      `## Goal\nWhat does success look like?\n## Scope\n- In: \n- Out: \n## Milestones\n1. …\n## Risks\n- …\n## Related\n- …`,
  },
  {
    id: 'zettel',
    name: 'Zettel (atomic note)',
    description: 'One idea, in your own words, linked',
    title: () => 'New idea',
    tags: ['zettel'],
    content: () =>
      `> One idea per note, in your own words.\n## Idea\n\n## Why it matters\n\n## Connects to\n- …\n## Source\n- …`,
  },
  {
    id: 'journal',
    name: 'Journal',
    description: 'Reflect: what, so what, now what',
    title: () => `Journal ${todayTitle()}`,
    tags: ['journal'],
    content: () => `## What happened\n\n## How I feel about it\n\n## What I learned\n\n## Tomorrow\n- …`,
  },
  {
    id: 'reading',
    name: 'Book / article notes',
    description: 'Key ideas, quotes, takeaways',
    title: () => 'Reading: ',
    tags: ['reading'],
    content: () => `**Author:** \n**Link:** \n## Key ideas\n- …\n## Quotes\n> …\n## My takeaways\n- …`,
  },
];
