import configData from '../../firebase-applet-config.json';

export const OAUTH_CLIENT_ID = configData.oAuthClientId || '';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/classroom.courses.readonly'
];

export interface WorkspaceUser {
  accessToken: string;
  expiresAt: number;
}

let currentToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  currentToken = token;
  if (token) {
    sessionStorage.setItem('workspace_access_token', token);
  } else {
    sessionStorage.removeItem('workspace_access_token');
  }
};

export const getAccessToken = (): string | null => {
  if (currentToken) return currentToken;
  const stored = sessionStorage.getItem('workspace_access_token');
  if (stored) {
    currentToken = stored;
    return stored;
  }
  return null;
};

export const requestGoogleLogin = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services SDK not loaded'));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: OAUTH_CLIENT_ID,
      scope: WORKSPACE_SCOPES.join(' '),
      callback: (tokenResponse: { access_token?: string; error?: string }) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error));
          return;
        }
        if (tokenResponse.access_token) {
          setAccessToken(tokenResponse.access_token);
          resolve(tokenResponse.access_token);
        } else {
          reject(new Error('No access token returned'));
        }
      },
      error_callback: (err: unknown) => {
        reject(err);
      }
    });

    client.requestAccessToken();
  });
};

export const fetchDriveFiles = async (token: string) => {
  const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=30&fields=nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink)', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Drive API error: ${res.statusText}`);
  return res.json();
};

export const fetchGmailThreads = async (token: string) => {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Gmail API error: ${res.statusText}`);
  return res.json();
};

export const fetchCalendarEvents = async (token: string) => {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=' + new Date().toISOString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Calendar API error: ${res.statusText}`);
  return res.json();
};

export const fetchTasks = async (token: string) => {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists/@default/tasks?maxResults=15', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Tasks API error: ${res.statusText}`);
  return res.json();
};

export const fetchClassroomCourses = async (token: string) => {
  const res = await fetch('https://classroom.googleapis.com/v1/courses?pageSize=10', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Classroom API error: ${res.statusText}`);
  return res.json();
};
