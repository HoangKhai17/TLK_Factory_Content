export default function SettingsPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure your AI Video Factory preferences</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
        {/* API Config */}
        <div className="form-section">
          <h2 className="form-title">API Configuration</h2>
          <div className="form-group">
            <label className="form-label">Gemini API Key</label>
            <input type="password" className="form-input" placeholder="••••••••••••••••" defaultValue="configured" readOnly />
            <span className="form-hint">Managed via .env file on the server</span>
          </div>
          <div className="form-group">
            <label className="form-label">Redis URL</label>
            <input type="text" className="form-input" placeholder="redis://localhost:6379" readOnly defaultValue="redis://localhost:6379" />
          </div>
        </div>

        {/* Render Defaults */}
        <div className="form-section">
          <h2 className="form-title">Render Defaults</h2>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Default Resolution</label>
              <select className="form-select">
                <option>1920×1080</option>
                <option>1280×720</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Default Duration</label>
              <input type="number" className="form-input" defaultValue={30} min={5} max={120} />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text-1)" }}>About</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "var(--text-2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Version</span><span style={{ color: "var(--text-1)", fontWeight: 600 }}>1.0.0</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Stack</span><span style={{ color: "var(--text-1)", fontWeight: 600 }}>React + Vite + Express</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>AI Model</span><span style={{ color: "var(--text-1)", fontWeight: 600 }}>Google Gemini</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
