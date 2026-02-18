'use client';

import { Button } from '@/components/button/Button';
import { Section } from '@/components/section/Section';
import { Container } from '@/components/container/Container';
import styles from './page.module.css';
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/card/Card';
import { LoginMethods } from '@/app/login/LoginMethods';
import { INTERACTION_ID, LOGGED_USERS_PARSED, WIDGET } from '@/lib/constant';
import { useTranslation } from 'react-i18next';
import { Typography } from '@mui/material';

export default function Page() {
  const { t: translate } = useTranslation();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [sessions, setSessions] = useState<any[]>([]);

  const formRefs = useRef<HTMLFormElement[]>([]);

  useEffect(() => {
    setSessions(LOGGED_USERS_PARSED);
    if (LOGGED_USERS_PARSED.length === 0) {
      setIsLogin(true);
    } else {
      setIsLogin(false);
    }
  }, []);

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(window.location.origin + '/api/interaction/session/' + sessionId, {
        method: 'DELETE',
      });
      setSessions((sessions) => sessions.filter((item) => item.sessionId !== sessionId));
    } catch (e) {
      console.error('deleteUserSession error: ', e);
    }
  };

  return (
    <div>
      <main>
        <Section>
          <Container>
            <div className={styles.toggles}>
              <Button
                label={translate('pages.login.toggleLogin')}
                className={isLogin ? '' : styles.toggleNotActive}
                onClick={() => setIsLogin(true)}
              />
              <Button
                label={translate('pages.login.toggleSessions')}
                className={isLogin ? styles.toggleNotActive : ''}
                onClick={() => setIsLogin(false)}
              />
            </div>
            {isLogin ? (
              <div key="login" className={styles.content}>
                <LoginMethods />
              </div>
            ) : (
              <div key="sessions">
                <ul className={styles.content}>
                  {!sessions?.length && (
                    <Typography color="text.secondary" className={styles.additionText}>
                      {translate('pages.login.noSessions')}
                    </Typography>
                  )}
                  {sessions?.map((item, index) => (
                    <li key={item.id}>
                      <form
                        ref={(el) => {
                          if (el) formRefs.current[index] = el;
                        }}
                        action={
                          '/api/interaction/' +
                          INTERACTION_ID +
                          '/auth?type=session&token=' +
                          item?.sessionToken
                        }
                        method="POST"
                      >
                        <Card
                          srcAvatar={item?.picture}
                          description={item?.email}
                          title={item?.nickname || item?.id}
                          onClick={() => formRefs.current[index]?.submit()}
                          onButtonClick={() => deleteSession(item?.sessionId)}
                        />
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Container>
        </Section>
      </main>
    </div>
  );
}
