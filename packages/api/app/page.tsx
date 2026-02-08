export default function Home() {
  return (
    <main>
      <h1>Tower of Baibel API</h1>
      <p>Decentralized Agent Knowledge Base API</p>
      <pre>
        {`
API Endpoints:
  GET  /api/health              - Health check
  GET  /api/collections         - List collections
  POST /api/collections         - Create collection
  GET  /api/collections/[id]    - Get collection
  GET  /api/search?q=query      - Search docs
        `}
      </pre>
    </main>
  );
}
