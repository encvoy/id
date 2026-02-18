import { FC, ReactNode, useEffect, useState } from 'react';
import { ListItem as MuiListItem, Box, List } from '@mui/material';
import Typography from '@mui/material/Typography';
import { IFieldEnv } from '@/types/types';
import { FIELD } from '@/lib/constant';
import { useTranslation } from 'react-i18next';

interface ISectionProps {
  children?: ReactNode;
}

export const ListItem: FC<ISectionProps> = ({ children }) => {
  return (
    <MuiListItem
      sx={{
        backgroundColor: 'var(--mui-palette-background-paper)',
        borderRadius: '24px',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {children}
      </Box>
    </MuiListItem>
  );
};

export const ValidationRuleList: FC = () => {
  const { t: translate } = useTranslation();
  const [currentField, setCurrentField] = useState<IFieldEnv>();

  useEffect(() => {
    setCurrentField(FIELD);
  }, []);

  return (
    <>
      {!!currentField?.validations.length && (
        <Typography color={'text.secondary'}>{translate('helperText.rulesValidation')}</Typography>
      )}
      <List sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {currentField?.validations.map((item) => (
          <ListItem key={item.title}>
            <Typography color="text.secondary">{item.title}</Typography>
          </ListItem>
        ))}
      </List>
    </>
  );
};
