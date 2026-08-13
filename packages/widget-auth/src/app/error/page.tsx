'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Container } from '@/components/container/Container';
import { Section } from '@/components/section/Section';
import { MESSAGE, MESSAGE_DETAIL } from '@/lib/constant';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import { getLocalizedTextValue } from '@/lib/utils';

const Page: FC = () => {
  const { t: translate, i18n } = useTranslation();
  const errorText = getLocalizedTextValue(MESSAGE, i18n.language);
  const errorDescription = MESSAGE_DETAIL;

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
                    Details
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
