import { FC, useEffect, useMemo, useRef, useState } from "react";
import styles from "./ViewEmailTemplate.module.css";

interface ViewEmailTemplateProps {
  content: string;
}

const EMPTY_PREVIEW = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;font-family:Inter,Segoe UI,Helvetica Neue,Helvetica,Arial,sans-serif;color:#666;background:#fff;">
    <p style="margin:0;">HTML preview will appear here.</p>
  </body>
</html>`;

const DEFAULT_FRAME_WIDTH = 600;
const DEFAULT_FRAME_HEIGHT = 720;
const PREVIEW_PADDING = 16;

export const ViewEmailTemplate: FC<ViewEmailTemplateProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [scale, setScale] = useState(1);
  const [frameSize, setFrameSize] = useState({
    width: DEFAULT_FRAME_WIDTH,
    height: DEFAULT_FRAME_HEIGHT,
  });

  const srcDoc = useMemo(
    () => (content?.trim() ? content : EMPTY_PREVIEW),
    [content]
  );

  useEffect(() => {
    const container = containerRef.current;
    const frame = frameRef.current;

    if (!container || !frame) {
      return;
    }

    setScale(1);
    setFrameSize({
      width: DEFAULT_FRAME_WIDTH,
      height: DEFAULT_FRAME_HEIGHT,
    });

    const updatePreviewSize = () => {
      const nextContainer = containerRef.current;
      const nextFrame = frameRef.current;
      const document = nextFrame?.contentDocument;

      if (!nextContainer || !nextFrame || !document) {
        return;
      }

      const body = document.body;
      const root = document.documentElement;
      const height = Math.max(
        body?.scrollHeight || 0,
        body?.offsetHeight || 0,
        root?.scrollHeight || 0,
        root?.offsetHeight || 0,
        DEFAULT_FRAME_HEIGHT
      );
      const availableWidth = Math.max(
        nextContainer.clientWidth - PREVIEW_PADDING * 2,
        1
      );
      const nextScale = Math.min(availableWidth / DEFAULT_FRAME_WIDTH, 1);

      setFrameSize({ width: DEFAULT_FRAME_WIDTH, height });
      setScale(nextScale);
    };

    const attachContentObserver = () => {
      const document = frame.contentDocument;
      if (!document) {
        return;
      }

      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = new ResizeObserver(() => {
        updatePreviewSize();
      });

      if (document.body) {
        resizeObserverRef.current.observe(document.body);
      }
      resizeObserverRef.current.observe(document.documentElement);
      updatePreviewSize();
    };

    const handleLoad = () => {
      attachContentObserver();
      window.requestAnimationFrame(updatePreviewSize);
    };

    const containerObserver = new ResizeObserver(() => {
      updatePreviewSize();
    });

    containerObserver.observe(container);
    frame.addEventListener("load", handleLoad);
    handleLoad();

    return () => {
      frame.removeEventListener("load", handleLoad);
      containerObserver.disconnect();
      resizeObserverRef.current?.disconnect();
    };
  }, [srcDoc]);

  return (
    <div className={styles.email}>
      <div ref={containerRef} className={styles.viewport}>
        <div
          className={styles.canvas}
          style={{
            width: `${frameSize.width * scale}px`,
            height: `${frameSize.height * scale}px`,
          }}
        >
          <iframe
            ref={frameRef}
            title="email-template-preview"
            className={styles.frame}
            srcDoc={srcDoc}
            sandbox="allow-same-origin"
            style={{
              width: `${frameSize.width}px`,
              height: `${frameSize.height}px`,
              transform: `scale(${scale})`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
