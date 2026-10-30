import { useUsersInvite } from '@/settings/team-member/hooks/useUsersInvite';
import { Badge, Button, Input, TextOverflowTooltip, cn } from 'erxes-ui';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

const emailSchema = z.string().email();
export const InviteTeamMemberSection = ({
  onContinue,
}: {
  onContinue: () => void;
}) => {
  const { handleInvitations } = useUsersInvite();
  const { t } = useTranslation('common', { keyPrefix: 'onboarding' });
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const onClick = () => {
    const trimmed = inputValue.trim();
    const emails = [...tags];

    if (trimmed) {
      const validation = emailSchema.safeParse(trimmed);
      if (!validation.success) {
        setError(t('invalid-email'));
        return;
      }
      if (emails.includes(trimmed)) {
        setError(t('email-already-added'));
        return;
      }
      emails.push(trimmed);
    }

    if (emails.length === 0) {
      setError(t('add-at-least-one-email'));
      return;
    }

    handleInvitations({
      variables: {
        entries: emails.map((email) => ({ email })),
      },
    });
    setInputValue('');
    setError('');
    onContinue();
  };
  const addTag = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) return;

    const validation = emailSchema.safeParse(trimmedValue);
    if (!validation.success) {
      setError(t('invalid-email'));
      return;
    }

    if (tags.includes(trimmedValue)) {
      setError(t('email-already-added'));
      return;
    }

    setTags([...tags, trimmedValue]);
    setInputValue('');
    setError('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setError('');

    if (value.endsWith(',') || value.endsWith(' ')) {
      addTag(value.slice(0, -1));
    } else {
      setInputValue(value);
    }
  };
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="grid w-sm gap-5 rounded-3xl bg-card px-6 pt-8 pb-8 shadow-lg max-sm:mx-2"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col gap-2 text-center mb-2"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('invite-team-members')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('invite-description')}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid gap-3"
        >
          <div className="flex flex-col gap-3 overflow-hidden ">
            <div className="w-full p-1">
              <Input
                name="email"
                placeholder={t('enter-email-addresses')}
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className={cn(
                  'h-8',
                  error && 'focus-visible:shadow-focus-destructive',
                )}
              />
              {error && (
                <p className="mt-1.5 text-xs text-destructive">{error}</p>
              )}
              {!error && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t('separate-emails')}
                </p>
              )}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="h-7 max-w-full rounded-full px-3"
                    onClose={() => removeTag(tag)}
                  >
                    <TextOverflowTooltip value={tag} className="truncate" />
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button onClick={onClick} className="w-full rounded-full" size="lg">
            {t('continue')}
          </Button>
        </motion.div>
      </motion.div>
      <Button
        variant="ghost"
        className="absolute bottom-1/4 rounded-full text-muted-foreground hover:text-foreground"
        onClick={() => onContinue()}
      >
        {t('do-this-later')}
      </Button>
    </>
  );
};
