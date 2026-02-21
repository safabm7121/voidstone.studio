import React from 'react';
import { Container, Typography, Paper, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

const About: React.FC = () => {
  const { t } = useTranslation();
  const { elementRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <div ref={elementRef} className={`fade-blur ${isVisible ? 'visible' : ''}`}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h3" gutterBottom>{t('about.title')}</Typography>
          <Typography variant="body1" paragraph>
            {t('about.paragraph1')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('about.paragraph2')}
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>{t('about.mission')}</Typography>
            <Typography variant="body1">
              {t('about.missionText')}
            </Typography>
          </Box>
        </Paper>
      </div>
    </Container>
  );
};

export default About;