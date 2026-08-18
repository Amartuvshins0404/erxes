import { InfoCard, InfoCardContent } from '@/block/components/card';
import {
  Badge,
  Button,
  Combobox,
  Command,
  Label,
  Popover,
  Textarea,
} from 'erxes-ui';
import { useEffect, useState } from 'react';
import { useProjectDetail } from '../hooks/useProjectDetail';

import { useDeveloperInfo } from '@/block/hooks/useDeveloperInfo';
import { ProjectAddress } from '@/project/components/ProjectAddress';
import { IconArrowUpRight } from '@tabler/icons-react';
import { Link } from 'react-router';
import { PROJECT_TYPES } from '../constants/project';
import { useUpdateProjectGeneralInfo } from '../hooks/useUpdateProject';

export const ProjectDetailGeneral = () => {
  const { loading } = useProjectDetail();

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard title="Project Information" description="Project information">
        <InfoCardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 flex flex-col gap-3">
              <ProjectDeveloper />
              <ProjectTypes />
              <ProjectShortDescription />
            </div>
            <div className="col-span-2 h-full">
              <ProjectDescription />
            </div>
          </div>
        </InfoCardContent>
      </InfoCard>
      <ProjectAddress />
    </div>
  );
};

export const ProjectDeveloper = () => {
  const { developerInfo } = useDeveloperInfo();

  return (
    <div className="space-y-2">
      <Label>Developer</Label>
      <Button
        variant="outline"
        className="flex w-full justify-start h-8 shadow-xs"
        asChild
      >
        <Link to="/block/developer-info">
          {developerInfo?.name}
          <IconArrowUpRight className="ml-auto" />
        </Link>
      </Button>
    </div>
  );
};

export const ProjectShortDescription = () => {
  const { project } = useProjectDetail();
  const [descriptionValue, setDescriptionValue] = useState(
    project?.shortDescription,
  );
  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

  useEffect(() => {
    if (project?.shortDescription) {
      setDescriptionValue(project?.shortDescription);
    }
  }, [project?.shortDescription]);

  const onBlur = () => {
    if (descriptionValue !== project?.shortDescription) {
      updateProjectGeneralInfo(project?._id || '', {
        shortDescription: descriptionValue,
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label>Short Description</Label>

      <Textarea
        placeholder="Товч танилцуулга бичнэ үү"
        value={descriptionValue}
        onChange={(e) => setDescriptionValue(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
};

export const ProjectDescription = () => {
  const { project } = useProjectDetail();
  const [descriptionValue, setDescriptionValue] = useState(
    project?.description,
  );
  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

  useEffect(() => {
    if (project?.description) {
      setDescriptionValue(project?.description);
    }
  }, [project?.description]);

  const onBlur = () => {
    if (descriptionValue !== project?.description) {
      updateProjectGeneralInfo(project?._id || '', {
        description: descriptionValue,
      });
    }
  };

  return (
    <div className="space-y-2 h-full flex flex-col">
      <Label>Description</Label>

      <Textarea
        placeholder="Дэлгэрэнгүй мэдээлэл бичнэ үү"
        className="flex-1"
        value={descriptionValue}
        onChange={(e) => setDescriptionValue(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
};

export const ProjectTypes = () => {
  const { project } = useProjectDetail();

  const [projectTypes, setProjectTypes] = useState<string[]>(
    project?.types || [],
  );

  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();

  return (
    <div className="space-y-2">
      <Label>Types</Label>
      <Popover>
        <Combobox.TriggerBase className="justify-start h-auto min-h-8 flex-wrap text-accent-foreground">
          {projectTypes?.length ? (
            projectTypes.map((type) => (
              <Badge key={type} variant="secondary">
                {PROJECT_TYPES.find((t) => t.value === type)?.label?.mn}
              </Badge>
            ))
          ) : (
            <span>Төрөл сонгоно уу</span>
          )}
        </Combobox.TriggerBase>

        <Combobox.Content>
          <Command>
            <Command.Input placeholder="Төрөл сонгоно уу" />
            <Command.List>
              {PROJECT_TYPES.map((type) => (
                <Command.Item
                  value={type.value}
                  key={type.value}
                  onSelect={() => {
                    const newTypes = projectTypes.includes(type.value)
                      ? projectTypes.filter((t) => t !== type.value)
                      : [...projectTypes, type.value];

                    setProjectTypes(newTypes);

                    updateProjectGeneralInfo(project?._id || '', {
                      types: newTypes,
                    });
                  }}
                >
                  {type.label?.mn}
                  <Combobox.Check checked={projectTypes.includes(type.value)} />
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Combobox.Content>
      </Popover>
    </div>
  );
};
