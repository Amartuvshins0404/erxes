import { LocalSkillSource, Workspace } from '@mastra/core/workspace';
import { resolve } from 'node:path';

const RUNTIME_SKILLS = [
  {
    name: 'document-creation',
    tools: ['generatePdf', 'generateDocx', 'generateXlsx', 'generatePptx'],
  },
  {
    name: 'website-creation',
    tools: ['workspaceWrite', 'publishWebsite'],
  },
  {
    name: 'product-image-cleanup',
    tools: ['removeImageBackground'],
  },
] as const;

const skillsPath = resolve(__dirname, '../../skills');
const skillSource = new LocalSkillSource({ basePath: skillsPath });

export const getRuntimeSkillsWorkspace = (toolNames: Iterable<string>) => {
  const tools = new Set(toolNames);
  const skills = RUNTIME_SKILLS.filter((skill) =>
    skill.tools.some((tool) => tools.has(tool)),
  ).map((skill) => skill.name);

  return skills.length
    ? new Workspace({
        id: `erxes-agent-runtime-skills-${skills.join('-')}`,
        skillSource,
        skills,
      })
    : undefined;
};
