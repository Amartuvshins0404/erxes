import { InfoCard, InfoCardContent } from '@/block/components/card';
import { PROJECT_AMENITIES } from '@/project/constants/amenities';
import { IconPlus } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Combobox,
  Command,
  Label,
  Popover,
  Separator,
} from 'erxes-ui';
import { useEffect, useState } from 'react';
import { useProjectDetail } from '../hooks/useProjectDetail';
import { useUpdateProjectGeneralInfo } from '../hooks/useUpdateProject';

export const ProjectDetailAmenities = () => {
  const { project } = useProjectDetail();
  const { updateProjectGeneralInfo } = useUpdateProjectGeneralInfo();
  const [open, setOpen] = useState(false);
  const [projectAmenities, setProjectAmenities] =
    useState<{ category: string; amenities: string[] }[]>();
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    if (project?.projectAmenities) {
      setProjectAmenities(
        project.projectAmenities.map((amenity) => {
          const amenityCategories = PROJECT_AMENITIES.filter(
            (a) => a.category_code === amenity.category,
          );

          const updatedAmenities = (amenity.amenities || []).map((item) => {
            const amenityCategory = amenityCategories.find(
              (a) => a.label_en === item,
            );

            if (amenityCategory) {
              return amenityCategory.label_mn || '';
            }

            return item;
          });

          return {
            category: amenity.category,
            amenities: updatedAmenities,
          };
        }),
      );
    }
  }, [project?.projectAmenities]);

  const handleSelectAmenity = (amenity: (typeof PROJECT_AMENITIES)[0]) => {
    let newAmenityGroups = projectAmenities || [];

    const existingCategory = projectAmenities?.find(
      (a) => a.category === amenity.category_code,
    );

    if (!existingCategory) {
      newAmenityGroups = [
        ...newAmenityGroups,
        { category: amenity.category_code, amenities: [amenity.label_mn] },
      ];
    }

    const hasAmenity = existingCategory?.amenities.includes(amenity.label_mn);

    newAmenityGroups = newAmenityGroups.map((amenityGroup) =>
      amenityGroup.category === amenity.category_code
        ? {
            ...amenityGroup,
            amenities: hasAmenity
              ? amenityGroup.amenities.filter((am) => am !== amenity.label_mn)
              : [...amenityGroup.amenities, amenity.label_mn],
          }
        : amenityGroup,
    );
    setIsChanged(true);
    setProjectAmenities(newAmenityGroups);
  };

  const isChecked = (amenity: string, category_code: string) => {
    const existingAmenityGroup = projectAmenities?.find(
      (amenityGroup) => amenityGroup.category === category_code,
    );
    return existingAmenityGroup?.amenities.includes(amenity) || false;
  };

  const amenitiesByCategory = PROJECT_AMENITIES.reduce((acc, amenity) => {
    acc[amenity.category_code] = [
      ...(acc[amenity.category_code] || []),
      amenity,
    ];
    return acc;
  }, {} as Record<string, typeof PROJECT_AMENITIES>);

  const handleRemoveAmenity = (amenity: string, category_code: string) => {
    updateProjectGeneralInfo(project?._id || '', {
      projectAmenities: projectAmenities
        ?.map((amenityGroup) => {
          if (amenityGroup.category === category_code) {
            return {
              ...amenityGroup,
              amenities: amenityGroup.amenities.filter((am) => am !== amenity),
            };
          }
          return amenityGroup;
        })
        .filter((amenityGroup) => amenityGroup.amenities.length > 0),
    });
  };

  return (
    <div className="p-8 grid-cols-2 grid gap-6">
      <InfoCard
        title="AMENITIES"
        description="Amenities"
        className="col-span-2"
      >
        <InfoCardContent>
          <div className="space-y-2">
            <Label className="block">Amenities</Label>

            <Popover
              open={open}
              onOpenChange={(open) => {
                setOpen(open);
                if (!open && isChanged) {
                  setIsChanged(false);
                  updateProjectGeneralInfo(project?._id || '', {
                    projectAmenities: projectAmenities,
                  });
                }
              }}
            >
              <Popover.Trigger asChild>
                <Button variant="outline">
                  <IconPlus />
                  Add amenity
                </Button>
              </Popover.Trigger>
              <Combobox.Content className="min-w-96">
                <Command>
                  <Command.Input />
                  <Command.List>
                    {Object.entries(amenitiesByCategory).map(
                      ([category, amenities]) => (
                        <Command.Group
                          key={category}
                          heading={amenities.at(0)?.category}
                        >
                          {amenities.map((am) => (
                            <Command.Item
                              className="h-auto"
                              key={am.label_mn}
                              value={am.label_mn}
                              onSelect={() => handleSelectAmenity(am)}
                            >
                              {am.label_mn}
                              <Combobox.Check
                                checked={isChecked(
                                  am.label_mn,
                                  am.category_code,
                                )}
                              />
                            </Command.Item>
                          ))}
                        </Command.Group>
                      ),
                    )}
                  </Command.List>
                </Command>
              </Combobox.Content>
            </Popover>

            {projectAmenities?.map((amenityGroup) => (
              <div className="pt-2 space-y-2">
                <Label className="block">
                  {amenitiesByCategory[amenityGroup.category].at(0)?.category}
                </Label>
                <div
                  key={amenityGroup.category}
                  className="flex flex-wrap gap-2 items-center "
                >
                  {amenityGroup.amenities.map((am) => (
                    <Badge
                      key={am}
                      variant="secondary"
                      onClose={() =>
                        handleRemoveAmenity(am, amenityGroup.category)
                      }
                    >
                      {am}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </InfoCardContent>
      </InfoCard>
      <Separator className="col-span-2" />
      <InfoCard title="Building Amenities" description="Amenities">
        <InfoCardContent>
          <div className="p-6 text-accent-foreground">Add buildings first!</div>
        </InfoCardContent>
      </InfoCard>
    </div>
  );
};
