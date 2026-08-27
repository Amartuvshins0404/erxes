import { zodResolver } from '@hookform/resolvers/zod';
import { Form, ScrollArea, useQueryState } from 'erxes-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  PROFILE_OVERVIEW_TABS,
  PROFILE_PUBLIC_TABS,
  PROFILE_TABS,
  ProfileTab,
} from '../constants/profileTabs';
import {
  profileFormSchema,
  ProfileFormValues,
} from '../constants/profileFormSchema';
import { useProfileUpdate } from '../hooks/useProfileInfo';
import { IProfile } from '../types/profile';
import {
  toProfileFormValues,
  toProfileInput,
} from '../utils/profileFormValues';
import { ProfileActivitySection } from './form/ProfileActivitySection';
import { ProfileBasicSection } from './form/ProfileBasicSection';
import { ProfileBiographySection } from './form/ProfileBiographySection';
import { ProfileContactSection } from './form/ProfileContactSection';
import { ProfileFinanceSection } from './form/ProfileFinanceSection';
import { ProfileInformationSection } from './form/ProfileInformationSection';
import { ProfileHeader } from './ProfileHeader';
import { ProfileSaveStatus, SaveStatus } from './ProfileSaveStatus';
import { ProfileSidebar } from './ProfileSidebar';

const ALL_TABS = [...PROFILE_OVERVIEW_TABS, ...PROFILE_PUBLIC_TABS];

const AUTOSAVE_DELAY = 900;

export const ProfileEditor = ({ profile }: { profile: IProfile }) => {
  const { updateProfile } = useProfileUpdate();
  const [activeTab] = useQueryState<ProfileTab>('tab', {
    defaultValue: PROFILE_TABS.BASIC,
  });

  const [status, setStatus] = useState<SaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onBlur',
    defaultValues: toProfileFormValues(profile),
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const save = useCallback(async () => {
    if (savingRef.current || !form.formState.isDirty) {
      return;
    }

    const values = form.getValues();

    if (!profileFormSchema.safeParse(values).success) {
      setStatus('invalid');
      return;
    }

    savingRef.current = true;
    setStatus('saving');

    const succeeded = await updateProfile(toProfileInput(values));

    savingRef.current = false;

    if (succeeded) {
      form.reset(values, { keepDirtyValues: true });
      setSavedAt(new Date());
      setStatus('saved');
      return;
    }

    setStatus('idle');
  }, [form, updateProfile]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setStatus('pending');
    timerRef.current = setTimeout(() => void save(), AUTOSAVE_DELAY);
  }, [save]);

  useEffect(() => {
    const subscription = form.watch((_values, { type }) => {
      if (type) {
        scheduleSave();
      }
    });

    return () => subscription.unsubscribe();
  }, [form, scheduleSave]);

  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        void saveRef.current();
      }
    },
    [],
  );

  const currentTab = ALL_TABS.find((tab) => tab.value === activeTab);

  return (
    <Form {...form}>
      <div className="flex flex-auto flex-col overflow-hidden">
        <ProfileHeader profile={profile} form={form} />

        <div className="flex flex-auto overflow-hidden">
          <ProfileSidebar />

          <ScrollArea className="flex-auto bg-sidebar">
            <div className="mx-auto w-full max-w-3xl p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">
                  {currentTab?.label ?? 'Үндсэн мэдээлэл'}
                </h2>
                <ProfileSaveStatus status={status} savedAt={savedAt} />
              </div>

              <div className="rounded-lg border bg-background p-6">
                {activeTab === PROFILE_TABS.BASIC && (
                  <ProfileBasicSection form={form} />
                )}
                {activeTab === PROFILE_TABS.BIOGRAPHY && (
                  <ProfileBiographySection form={form} />
                )}
                {activeTab === PROFILE_TABS.ACTIVITY && (
                  <ProfileActivitySection form={form} />
                )}
                {activeTab === PROFILE_TABS.INFORMATION && (
                  <ProfileInformationSection form={form} />
                )}
                {activeTab === PROFILE_TABS.FINANCE && (
                  <ProfileFinanceSection form={form} />
                )}
                {activeTab === PROFILE_TABS.CONTACT && (
                  <ProfileContactSection form={form} />
                )}
              </div>
            </div>
            <ScrollArea.Bar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    </Form>
  );
};
