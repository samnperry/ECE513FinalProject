import React from "react";
import "./Pages.css";

export function AccountPage() {
  return (
    <main className="page-container">
      <h1 className="page-title">Account</h1>

      <div className="simple-grid">
        <div className="card">
          <h2>Profile</h2>
          <p className="muted">Placeholder form for updating name, email, and contact info.</p>
          <div className="inline-actions">
            <button className="outline-button" type="button">Edit info</button>
            <button className="outline-button" type="button">Save changes</button>
          </div>
        </div>

        <div className="card">
          <h2>Devices</h2>
          <p className="muted">Add/remove linked devices and set nicknames.</p>
          <div className="inline-actions">
            <button className="outline-button" type="button">Add device</button>
            <button className="outline-button" type="button">Remove device</button>
          </div>
        </div>

        <div className="card">
          <h2>Physician</h2>
          <p className="muted">Placeholder for physician selection and contact preferences.</p>
          <div className="inline-actions">
            <button className="outline-button" type="button">Choose physician</button>
            <button className="outline-button" type="button">Update preferences</button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AccountPage;
