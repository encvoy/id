'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { MESSAGE, MESSAGE_DETAIL } from '@/lib/constant';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';

const Page: FC = () => {
  const { t: translate } = useTranslation();
  const [errorText, setErrorText] = useState('');
  const [errorDescription, setErrorDescription] = useState('');

  useEffect(() => {
    setErrorText(MESSAGE);
    setErrorDescription(MESSAGE_DETAIL);
  }, []);

  return (
    <Section>
      <Container title={translate('errors.error')} isCancelAction withoutFooter>
        <Typography sx={{ textAlign: 'center' }} color="text.secondary">
          {errorText || translate('errors.errorOccurred')}
          <Box sx={{ marginTop: '24px' }}>
            {errorDescription && (
              <Accordion
                sx={{
                  backgroundColor: '#ffffff',
                  boxShadow: 'none',
                  border: '1px solid #f0f0f0',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel2-content"
                  id="panel2-header"
                >
                  <Typography color="text.secondary" component="span">
                    Подробнее
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary">{errorDescription}</Typography>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        </Typography>
      </Container>
    </Section>
  );
};

export default Page;
