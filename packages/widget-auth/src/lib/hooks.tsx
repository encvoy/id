'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ALLOWED_LOGIN_FIELDS } from '@/lib/constant';
import { useTranslation } from 'react-i18next';

export function HtmlContent({ html }: { html: string }) {
  const [cleanHtml, setCleanHtml] = useState('');

  useEffect(() => {
    import('dompurify').then((DOMPurify) => {
      const allowedTargets = ['_blank', '_self', '_parent', '_top'];
      DOMPurify.default.addHook('beforeSanitizeAttributes', (node) => {
        if (node.tagName === 'A') {
          const t = node.getAttribute('target');
          if (allowedTargets.includes(t as string)) {
            node.setAttribute('data-dp-target', t as string);
          }
        }
      });
      DOMPurify.default.addHook('afterSanitizeAttributes', (node) => {
        if (node.tagName === 'A') {
          const preserved = node.getAttribute('data-dp-target');
          if (preserved) {
            node.setAttribute('target', preserved);
            node.setAttribute('rel', 'noopener noreferrer');
            node.removeAttribute('data-dp-target');
          }
        }
      });
      setCleanHtml(
        DOMPurify.default.sanitize(html, {
          ADD_ATTR: ['href', 'target', 'rel'],
        }),
      );
    });
  }, [html]);

  if (!cleanHtml) <div>Загрузка...</div>;

  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }}></div>;
}

interface HashParams {
  type?: string;
  id?: string;
}

export function useHashParams(): HashParams {
  const pathname = usePathname();
  const [hashParams, setHashParams] = useState<HashParams>({});

  useLayoutEffect(() => {
    const updateHash = () => {
      const hash = window.location.hash;
      if (!hash) {
        setHashParams({});
        return;
      }

      const segments = hash.slice(1).split('/').filter(Boolean);
      const params: HashParams = {};
      if (segments.length >= 2) {
        params.type = segments[0];
        params.id = segments[1];
      }
      setHashParams(params);
    };

    window.addEventListener('hashchange', updateHash);
    updateHash();

    return () => window.removeEventListener('hashchange', updateHash);
  }, [pathname]);

  return hashParams;
}

export function useTimer(): {
  minute: number;
  second: number;
  setTime: (time: [number, number]) => void;
} {
  const [[minute, second], setTime] = useState([0, 0]);

  useEffect(() => {
    const timerID = setInterval(() => {
      if (minute === 0 && second === 0) {
        return;
      } else if (second === 0) {
        setTime([minute - 1, 59]);
      } else {
        setTime([minute, second - 1]);
      }
    }, 1000);

    return () => clearInterval(timerID);
  }, [minute, second]);

  return { minute, second, setTime };
}

export function usePlaceholder(): string {
  const { t: translate } = useTranslation();
  let label = `${translate('helperText.enter')} `;
  let allowed_login_fields: string[] = [];
  if (ALLOWED_LOGIN_FIELDS) {
    allowed_login_fields = ALLOWED_LOGIN_FIELDS.trim().split(' ');
    for (let index = 0; index < allowed_login_fields.length; index++) {
      const element = allowed_login_fields[index];

      if (allowed_login_fields.length > 1 && index !== 0) {
        label +=
          index === allowed_login_fields.length - 1 ? ` ${translate('helperText.or')} ` : ', ';
      }

      switch (element) {
        case 'login':
          label += translate('helperText.login').toLocaleLowerCase();
          break;
        case 'email':
          label += translate('helperText.email').toLocaleLowerCase();
          break;
        case 'phone_number':
          label += translate('helperText.phone').toLocaleLowerCase();
          break;
      }
    }
  }

  return label;
}
