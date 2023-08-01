import React, { createContext, useState } from 'react';

function API({ serverBaseUrl }: { serverBaseUrl: string }) {
  return {
    async deleteGrant(grantId: string): Promise<void> {
      const requestURL = new URL(`${serverBaseUrl}/nylas/${grantId}/delete-grant`);
      const request = await fetch(requestURL.toString(), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (request.status !== 200) {
        throw new Error('Failed to delete grant');
      }

      return;
    },
    
    async getAuthorizationUrl(email: string): Promise<string> {
      const requestURL = new URL(`${serverBaseUrl}/nylas/generate-auth-url`);

      const request = await fetch(requestURL.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailAddress: email }),
      });

      if (request.status !== 200) {
        throw new Error('Failed to generate authorization URL');
      }

      const { auth_url } = await request.json();
      return auth_url;
    },

    async exchangeCodeForGrantId(code: string): Promise<string> {
      const requestURL = new URL(`${serverBaseUrl}/nylas/exchange-auth-code`);
      requestURL.searchParams.append('code', code);

      const request = await fetch(
        requestURL.toString(),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (request.status !== 200) {
        throw new Error('Failed to exchange code for grant ID');
      }

      const { grant_id } = await request.json();

      return grant_id;
    },

    async getCalendars(grantId: string): Promise<Array<any>> {
      const requestURL = new URL(`${serverBaseUrl}/nylas/${grantId}/read-calendars`);
      const request = await fetch(requestURL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (request.status !== 200) {
        throw new Error('Failed to get calendars');
      }

      return await request.json();
    },

    async getEvents({
        grantId,
        calendarId,
        limit,
        startsAfter,
        endsBefore
     }: { 
        grantId: string,
        calendarId: string,
        limit?: number,
        startsAfter?: number,
        endsBefore?: number
      }): Promise<Array<any>> {
      const requestURL = new URL(`${serverBaseUrl}/nylas/${grantId}/read-events`);
      requestURL.searchParams.append('calendarId', calendarId);
      if (limit) {
        requestURL.searchParams.append('limit', limit.toString());
      }
      if (startsAfter) {
        requestURL.searchParams.append('startsAfter', startsAfter.toString());
      }
      if (endsBefore) {
        requestURL.searchParams.append('endsBefore', endsBefore.toString());
      }

      const request = await fetch(requestURL.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!request.ok) {
        throw new Error(request.statusText);
      }

      if (request.status !== 200) {
        throw new Error('Failed to get calendar events');
      }

      return await request.json();
    },

    async createEvent({
      grantId,
      calendarId,
      startTime,
      endTime,
      title,
      description,
      participants,
    }: {
      grantId: string;
      calendarId: string;
      startTime: number;
      endTime: number;
      title: string;
      description: string;
      participants: string;
    }) {
      const body = {
        calendarId,
        startTime,
        endTime,
        title,
        description,
        participants
      };

      console.debug('createEvent', body)

      const requestURL = new URL(`${serverBaseUrl}/nylas/${grantId}/create-event`);
      const request = await fetch(requestURL.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (request.status !== 200) {
        throw new Error('Failed to create event');
      }

      return await request.json();
    }
  };
}

type AppContextValue = {
  emailAddress: string;
  setEmailAddress: (email: string) => void;
  grantId: string;
  setGrantId: (grantId: string) => void;
  api: ReturnType<typeof API>;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children, serverBaseUrl }) {
  const [emailAddress, setEmailAddress] = useState('');
  const [grantId, setGrantId] = useState('');

  const api = API({ serverBaseUrl });

  return (
    <AppContext.Provider
      value={{
        emailAddress,
        setEmailAddress,
        setGrantId,
        grantId,
        api,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppContext;