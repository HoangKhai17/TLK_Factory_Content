export default function AccountPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Account</h1>
        <p className="page-subtitle">Your profile and account settings</p>
      </div>

      <div style={{ maxWidth: 560 }}>
        {/* Profile card */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "var(--gradient-btn)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 22, fontWeight: 800,
              boxShadow: "var(--shadow-primary)",
            }}>
              K
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>Nguyen Hoang Khai</h2>
              <p style={{ fontSize: 13, color: "var(--text-2)" }}>nguyenhoangkhai.010103@gmail.com</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" defaultValue="Nguyen Hoang Khai" />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" defaultValue="nguyenhoangkhai.010103@gmail.com" readOnly />
            <span className="form-hint">Email cannot be changed</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
