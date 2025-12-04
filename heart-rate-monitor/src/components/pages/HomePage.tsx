import React from "react";
import "./Pages.css";

export function HomePage() {
  return (
    <main className="page-container">
      <h1 className="page-title">Team Intro & Overview</h1>

      <div className="card">
        <h2>Who we are</h2>
        <p className="muted">
          Placeholder for team bios and project mission. Add short blurbs for each teammate and the problem we&apos;re solving.
        </p>
      </div>

      <div className="simple-grid">
        <div className="card">
          <h2>Project overview</h2>
          <p className="muted">
            High-level description of the heart-rate monitor system and goals. Replace this with your summary text.
          </p>
        </div>
        <div className="card">
          <h2>Quick links</h2>
          <p className="muted">Navigation to key areas of the app.</p>
          <div className="inline-actions">
            <a className="outline-button" href="/dashboard">Dashboard</a>
            <a className="outline-button" href="/reference">References</a>
            <a className="outline-button" href="/account">Account</a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default HomePage;
