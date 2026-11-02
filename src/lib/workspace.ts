import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth, firebaseConfig } from './firebase';

export const OAUTH_CLIENT_ID = firebaseConfig.oAuthClientId || '';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/presentations.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/contacts',
  'https://www.googleapis.com/auth/contacts.other.readonly',
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/directory.readonly',
  'https://www.googleapis.com/auth/user.addresses.read',
  'https://www.googleapis.com/auth/user.birthday.read',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/user.gender.read',
  'https://www.googleapis.com/auth/user.organization.read',
  'https://www.googleapis.com/auth/user.phonenumbers.read',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
  'https://www.googleapis.com/auth/meetings.space.settings'
];

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory cache only (never localStorage or sessionStorage)
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedIdToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        cachedIdToken = await user.getIdToken();
      } catch {
        cachedIdToken = null;
      }
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthSuccess) onAuthSuccess(user, null);
      }
    } else {
      cachedAccessToken = null;
      cachedIdToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }
    cachedAccessToken = credential.accessToken;
    cachedIdToken = await result.user.getIdToken();
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const requestGoogleLogin = async (): Promise<string> => {
  const res = await googleSignIn();
  return res.accessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getIdToken = async (): Promise<string | null> => {
  if (auth.currentUser) {
    try {
      cachedIdToken = await auth.currentUser.getIdToken();
      return cachedIdToken;
    } catch {
      return cachedIdToken;
    }
  }
  return cachedIdToken;
};

export const logoutWorkspace = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  cachedIdToken = null;
};

// Google Drive API
export const fetchDriveFiles = async (token: string) => {
  const res = await fetch(
    'https://www.googleapis.com/drive/v3/files?pageSize=30&fields=nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,thumbnailLink)',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`Drive API error: ${res.statusText}`);
  return res.json();
};

// Google Picker API
export const openNativeGooglePicker = (
  accessToken: string,
  onPicked: (doc: { id: string; name: string; mimeType: string; sizeBytes?: number }) => void
) => {
  const win = window as any;
  const buildPicker = () => {
    if (!win.google?.picker) {
      throw new Error('Google Picker library not yet loaded');
    }
    const pickerOrigin =
      window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
        ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
        : window.location.origin;

    const picker = new win.google.picker.PickerBuilder()
      .addView(win.google.picker.ViewId.DOCS)
      .setOAuthToken(accessToken)
      .setCallback((data: any) => {
        if (data.action === win.google.picker.Action.PICKED && data.docs?.[0]) {
          onPicked(data.docs[0]);
        }
      })
      .setOrigin(pickerOrigin)
      .build();
    picker.setVisible(true);
  };

  if (win.google?.picker) {
    buildPicker();
  } else if (win.gapi?.load) {
    win.gapi.load('picker', { callback: buildPicker });
  } else {
    throw new Error('Google API script not loaded');
  }
};

// Gmail API
export const fetchGmailThreads = async (token: string) => {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail API error: ${res.statusText}`);
  return res.json();
};

// Google Calendar API
export const fetchCalendarEvents = async (token: string) => {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=' +
      new Date().toISOString(),
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`Calendar API error: ${res.statusText}`);
  return res.json();
};

// Google Tasks API
export const fetchTasks = async (token: string) => {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists/@default/tasks?maxResults=15', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Tasks API error: ${res.statusText}`);
  return res.json();
};

// Google Classroom API
export const fetchClassroomCourses = async (token: string) => {
  const res = await fetch('https://classroom.googleapis.com/v1/courses?pageSize=10', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Classroom API error: ${res.statusText}`);
  return res.json();
};

// Google People / Contacts API
export const fetchGoogleContacts = async (token: string) => {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations,photos&pageSize=25',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`People API error: ${res.statusText}`);
  return res.json();
};

export const fetchUserProfile = async (token: string) => {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,phoneNumbers,organizations,addresses,birthdays',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error(`People Profile API error: ${res.statusText}`);
  return res.json();
};

// Google Meet API
export const createGoogleMeetSpace = async (token: string) => {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Meet API error: ${res.statusText}`);
  return res.json();
};

// Google Keep API (Enterprise Workspace notes endpoint)
export const fetchGoogleKeepNotes = async (token: string) => {
  const res = await fetch('https://keep.googleapis.com/v1/notes?pageSize=20', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Keep API error: ${res.statusText}`);
  return res.json();
};
