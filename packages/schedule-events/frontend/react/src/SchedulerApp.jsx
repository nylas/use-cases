import React, { useEffect } from 'react';
import './styles/schedule-editor.scss';
import nylas from './utils/schedule-editor.js';

function SchedulerApp() {
  useEffect(() => {
    if (!document.querySelector('iframe')) {
      nylas.scheduler.show({
        auth: {
          accessToken: sessionStorage.getItem('accessToken'),
        },
        style: {
          tintColor: '#32325d',
          backgroundColor: 'white',
        },
        defaults: {
          event: {
            title: '30-min Coffee Meeting',
            duration: 30,
          },
        },
      });
    }
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
