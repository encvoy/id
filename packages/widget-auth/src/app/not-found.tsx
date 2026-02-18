export const dynamic = 'force-static';
export const revalidate = false;

export default function NotFound() {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'system-ui', background: '#fff', color: '#000' }}>
        <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Not Found</p>
        </div>
      </body>
    </html>
  );
}
