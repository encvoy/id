'use client';

import { Button } from '@/components/button/Button';
import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { INTERACTION_URL, NOTIFICATIONS } from '@/lib/constant';
import { getLocalizedTextValue } from '@/lib/utils';
import { IWidgetNotification } from '@/types/types';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { Chip, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { FC, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const notificationChipVariants: Record<
  NonNullable<IWidgetNotification['type']>,
  'important' | 'info' | 'neutral'
> = {
  system: 'important',
  organization: 'info',
  client: 'neutral',
};

const getUpdatedNotificationIds = (
  notificationIds: string[],
  notificationId: string,
  isChecked: boolean,
) => {
  const nextNotificationIds = notificationIds.filter((id) => id !== notificationId);

  if (isChecked) {
    nextNotificationIds.push(notificationId);
  }

  return nextNotificationIds;
};

const Page: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([]);
  const [submitNotificationIds, setSubmitNotificationIds] = useState<string[] | null>(null);
  const [isCurrentChecked, setIsCurrentChecked] = useState(true);

  const totalNotifications = NOTIFICATIONS.length;
  const currentNotification = NOTIFICATIONS[currentIndex];
  const isLastNotification = totalNotifications === 0 || currentIndex === totalNotifications - 1;
  const notificationIdsForSubmit = submitNotificationIds ?? selectedNotificationIds;

  useEffect(() => {
    if (submitNotificationIds === null) {
      return;
    }

    formRef.current?.requestSubmit();
  }, [submitNotificationIds]);

  const handleNextNotification = () => {
    const nextNotificationIds = getUpdatedNotificationIds(
      selectedNotificationIds,
      currentNotification?.id,
      isCurrentChecked,
    );

    setSelectedNotificationIds(nextNotificationIds);
    setCurrentIndex((prev) => prev + 1);
    setIsCurrentChecked(true);
  };

  const handleCompleteSignIn = () => {
    const nextNotificationIds = getUpdatedNotificationIds(
      selectedNotificationIds,
      currentNotification?.id,
      isCurrentChecked,
    );

    setSelectedNotificationIds(nextNotificationIds);
    setSubmitNotificationIds(nextNotificationIds);
  };

  return (
    <Section>
      <Container
        title={translate('notifications.totalCount', { count: totalNotifications })}
        isCancelAction
        withoutFooter
      >
        <form
          ref={formRef}
          action={`${INTERACTION_URL}/notifications/continue`}
          method="POST"
        >
          <Typography
            sx={{ textAlign: 'center', fontSize: '12px', marginBottom: '8px' }}
            color="text.secondary"
          >
            {translate('notifications.description')}
          </Typography>

          <Box
            sx={{
              marginBottom: '20px',
            }}
          >
            {currentNotification && (
              <Box
                key={currentNotification.id}
                sx={{
                  border: '1px solid var(--mui-palette-divider)',
                  borderRadius: '20px',
                  padding: '12px',
                  backgroundColor: 'var(--mui-palette-background-paper)',
                }}
              >
                <Box>
                  {currentNotification.type && (
                    <Chip
                      variant={notificationChipVariants[currentNotification.type]}
                      label={translate(`notifications.types.${currentNotification.type}`)}
                    />
                  )}
                  <Typography variant="h3" sx={{ my: '8px', fontSize: '17px' }}>
                    {getLocalizedTextValue(currentNotification.title, i18n.language)}
                  </Typography>
                  <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {getLocalizedTextValue(currentNotification.content, i18n.language)}
                  </Typography>
                </Box>
                <FormControlLabel
                  sx={{
                    margin: 0,
                    width: '100%',
                    alignItems: 'center',
                    gap: '8px',
                    mt: '8px',
                  }}
                  control={
                    <Checkbox
                      size="small"
                      checked={isCurrentChecked}
                      onChange={(event) => setIsCurrentChecked(event.target.checked)}
                      sx={{ p: 0 }}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Typography>{translate('notifications.markAsRead')}</Typography>
                      <Tooltip
                        sx={{ width: 24, height: 24 }}
                        title={translate('notifications.markAsReadHelpText')}
                      >
                        <IconButton>
                          <HelpOutlineOutlinedIcon sx={{ width: 18, height: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
              </Box>
            )}
          </Box>

          {notificationIdsForSubmit.map((notificationId) => (
            <input
              key={notificationId}
              name="notification_ids"
              hidden
              readOnly
              value={notificationId}
            />
          ))}

          <Box
            sx={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <Button
              type="button"
              onClick={isLastNotification ? handleCompleteSignIn : handleNextNotification}
              variant="contained"
              label={
                isLastNotification
                  ? translate('notifications.completeSignIn')
                  : translate('notifications.nextNotification')
              }
              data-test-id={isLastNotification ? 'btn-auth-reading' : 'btn-auth-app-continue'}
            />
          </Box>
        </form>
      </Container>
    </Section>
  );
};

export default Page;
