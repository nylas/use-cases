import React, { useEffect } from 'react';
import './styles/schedule-editor.scss';

function SchedulerApp() {
  useEffect(() => {
    // TODO: placeholder
  }, []);

  return (
    <>
      <div className="scheduler-app"></div>
      <div className="mobile-warning hidden-desktop">
        <h2>
          Scheduling sample app is currently designed for a desktop experience.
        </h2>
        <p>
          Visit Nylas dashboard for more use-cases: https://dashboard.nylas.com
        </p>
      </div>
    </>
  );
}

export default SchedulerApp;
