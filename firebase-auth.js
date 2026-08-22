/* Rider Hub Firebase Google authentication + per-user Firestore state sync.
   Firebase web configuration is public by design. Never place service-account
   keys, OAuth client secrets, private keys, or passwords in this file. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const CFG = window.RIDER_HUB_FIREBASE_CONFIG;
const AUTH_KEY = 'riderhub_auth_session_v1';
const DIRTY_PREFIX = 'riderhub_firebase_dirty_v1_';
const MIGRATION_KEY = 'riderhub_firebase_legacy_migrated_v1';
const REDIRECT_KEY = 'riderhub_firebase_redirect_pending_v1';
const CANONICAL_HOST = 'rider-hub-506306.firebaseapp.com';
const CANONICAL_URL = `https://${CANONICAL_HOST}/`;

/* Firebase documents that redirect auth is unaffected on a firebaseapp.com
   Hosting subdomain. The web.app alias serves the same deployment, so make
   firebaseapp.com the canonical Rider Hub origin before auth begins. */
if (location.hostname === 'rider-hub-506306.web.app') {
  location.replace(`https://${CANONICAL_HOST}${location.pathname}${location.search}${location.hash}`);
}
window.RIDER_HUB_CANONICAL_URL = CANONICAL_URL;

let auth = null;
let db = null;
let ready = false;
let current = null;
let syncTimer = null;
let syncing = false;
let entering = false;

const clone = value => {
  try { return JSON.parse(JSON.stringify(value)); } catch { return null; }
};
const validConfig = c => !!(c && c.apiKey && c.projectId && c.appId && c.authDomain);
const dirtyKey = uid => DIRTY_PREFIX + String(uid || '');
const setDirty = (uid, on = true) => {
  if (!uid) return;
  if (on) localStorage.setItem(dirtyKey(uid), '1');
  else localStorage.removeItem(dirtyKey(uid));
};
const isDirty = uid => !!(uid && localStorage.getItem(dirtyKey(uid)) === '1');
const isMobileBrowser = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
const sameOriginAuth = () => !!CFG?.authDomain && location.hostname === CFG.authDomain;

const note = (text, warn = false) => {
  const n = document.querySelector('#rhAuthNote');
  if (n) {
    n.className = 'rh-auth-note' + (warn ? ' warn' : '');
    n.textContent = text;
  }
  if (warn && typeof window.toast === 'function') window.toast(text);
};

function firebaseLoginMarkup() {
  const hosted = location.hostname === CANONICAL_HOST;
  const helper = hosted
    ? 'Google Sign-In is ready.'
    : 'This fallback build can still open Rider Hub, but mobile sign-in is most reliable on Firebase Hosting.';
  return `<div class="rh-auth-login">
    <div class="rh-slide-kicker">MY ACCOUNT</div>
    <h2>Sign in to Rider Hub</h2>
    <p>Use your Google account. App data syncs privately through Firebase and Firestore.</p>
    <div class="rh-auth-form">
      <button id="rhGoogleFirebaseLogin" class="rh-auth-button primary full">Continue with Google</button>
      <div id="rhAuthNote" class="rh-auth-note">${helper}</div>
    </div>
  </div>`;
}

function wireLoginUi() {
  const stage = document.querySelector('#rhAuthStage');
  if (!stage) return;

  if (stage.querySelector('#rhEmail') || [...stage.querySelectorAll('button')].some(b => /login with email|create account with email/i.test(b.textContent || ''))) {
    stage.innerHTML = firebaseLoginMarkup();
  }

  const google = stage.querySelector('#rhGoogleFirebaseLogin') || [...stage.querySelectorAll('button')].find(b => /continue with google/i.test(b.textContent || ''));
  if (google) {
    google.id = 'rhGoogleFirebaseLogin';
    google.onclick = () => window.rhLoginGoogle();
    google.disabled = !ready;
  }
}

function ensureLoggedOutUi() {
  localStorage.removeItem(AUTH_KEY);
  const shell = document.querySelector('#rhAuthShell');
  if (!shell) return;
  shell.classList.add('active');
  const stage = shell.querySelector('#rhAuthStage');
  if (stage) stage.innerHTML = firebaseLoginMarkup();
  wireLoginUi();
}

new MutationObserver(wireLoginUi).observe(document.documentElement, { subtree: true, childList: true });

function captureMigratableState() {
  if (typeof window.riderHubExportState !== 'function') return null;
  const s = clone(window.riderHubExportState());
  if (!s || typeof s !== 'object') return null;
  const account = s.profile?.account || {};
  if (!s.profile?.publicUser || account.provider !== 'firebase') return s;
  return null;
}

let migratableState = captureMigratableState();

function migrateStateForUser(source, user) {
  const migrated = clone(source);
  if (!migrated) return null;
  migrated.profile = {
    ...(migrated.profile || {}),
    publicUser: true,
    version: 1,
    bikeConfigured: migrated.profile?.bikeConfigured !== false,
    account: {
      ...(migrated.profile?.account || {}),
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || user.email || 'Rider',
      provider: 'firebase'
    }
  };
  return migrated;
}

async function pullUserState(user) {
  if (!db || !user) return false;
  try {
    const ref = doc(db, 'users', user.uid, 'riderhub', 'state');
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data()?.state && typeof window.riderHubImportState === 'function') {
      window.riderHubImportState(snap.data().state);
      setDirty(user.uid, false);
      return true;
    }
  } catch (e) {
    console.warn('Rider Hub Firestore pull unavailable', e);
  }
  return false;
}

async function pushUserState() {
  if (!db || !current || syncing || typeof window.riderHubExportState !== 'function') return false;
  syncing = true;
  const uid = current.uid;
  try {
    const ref = doc(db, 'users', uid, 'riderhub', 'state');
    await setDoc(ref, {
      schema: 2,
      state: window.riderHubExportState(),
      clientUpdatedAt: Date.now(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    setDirty(uid, false);
    return true;
  } catch (e) {
    setDirty(uid, true);
    console.warn('Rider Hub Firestore sync unavailable', e);
    return false;
  } finally {
    syncing = false;
  }
}

window.riderHubFirebaseQueueSync = function () {
  if (!current) return;
  setDirty(current.uid, true);
  clearTimeout(syncTimer);
  if (!db) return;
  syncTimer = setTimeout(pushUserState, 1200);
};

window.riderHubFirebaseSyncNow = async function () {
  if (!current) {
    if (typeof window.toast === 'function') window.toast('Sign in to sync Rider Hub');
    return false;
  }
  const ok = await pushUserState();
  if (typeof window.toast === 'function') window.toast(ok ? 'Rider Hub app data synced' : 'Sync pending · will retry when online');
  return ok;
};

async function enterUser(user) {
  if (!user || entering) return;
  if (current?.uid === user.uid && localStorage.getItem(AUTH_KEY)?.includes('firebase')) return;
  entering = true;
  current = user;
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    at: new Date().toISOString(),
    provider: 'firebase',
    uid: user.uid,
    email: user.email || ''
  }));

  try {
    if (typeof window.riderHubActivatePublicUser === 'function') {
      window.riderHubActivatePublicUser({
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email || 'Rider',
        provider: 'firebase'
      });
    }

    let hasCloudState = false;
    if (!isDirty(user.uid)) hasCloudState = await pullUserState(user);

    if (!hasCloudState) {
      const canMigrate = migratableState && !localStorage.getItem(MIGRATION_KEY);
      if (canMigrate && typeof window.riderHubImportState === 'function') {
        const migrated = migrateStateForUser(migratableState, user);
        if (migrated) {
          window.riderHubImportState(migrated);
          localStorage.setItem(MIGRATION_KEY, user.uid);
          migratableState = null;
          setDirty(user.uid, true);
        }
      }
      await pushUserState();
    }

    document.querySelector('#rhAuthShell')?.classList.remove('active');
    if (typeof window.renderMore === 'function') window.renderMore();
    if (typeof window.toast === 'function') window.toast(`Signed in${user.displayName ? ' as ' + user.displayName : ''}`);
  } finally {
    entering = false;
  }
}

window.rhLoginGoogle = async function () {
  if (!ready || !auth) return note('Google Sign-In is still loading. Try again in a moment.', true);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    /* On Android/iOS use redirect only when the app and Firebase auth helper are
       the same firebaseapp.com origin. This avoids the blank mobile popup seen
       on GitHub Pages and avoids modern third-party-storage redirect failures. */
    if (isMobileBrowser() && sameOriginAuth()) {
      note('Opening Google Sign-In…');
      sessionStorage.setItem(REDIRECT_KEY, '1');
      await signInWithRedirect(auth, provider);
      return;
    }

    note('Opening Google Sign-In…');
    await signInWithPopup(auth, provider);
    note('Signed in. Loading your Rider Hub…');
  } catch (e) {
    const code = String(e?.code || '');
    if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
      note('Google Sign-In was cancelled.');
    } else if (code.includes('popup-blocked')) {
      note('Your browser blocked the Google sign-in window. Allow pop-ups and try again.', true);
    } else if (code.includes('unauthorized-domain')) {
      note('This Rider Hub domain is not authorized in Firebase Authentication.', true);
    } else {
      console.error('Rider Hub Google Sign-In failed', e);
      const fallbackHint = isMobileBrowser() && !sameOriginAuth()
        ? ' Mobile sign-in will use redirect on the Firebase-hosted Rider Hub.'
        : '';
      note('Could not sign in with Google.' + fallbackHint, true);
    }
  }
};

function installAccountModal() {
  window.openMyAccount = function () {
    const u = current || auth?.currentUser;
    if (!u) {
      ensureLoggedOutUi();
      return;
    }
    const driveLabel = typeof window.cloudSyncLabel === 'function' ? window.cloudSyncLabel() : 'Not connected';
    const driveConnected = typeof window.cloudSyncConnected === 'function' && window.cloudSyncConnected();
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    if (typeof window.openModal !== 'function') return;
    window.openModal(`<div class="modalhead"><div><div class="kicker">MY ACCOUNT</div><h3>${esc(u.displayName || 'Rider Hub')}</h3><p class="caption">${esc(u.email || '')}</p></div><button class="round" onclick="closeModal()">×</button></div>
      <div class="routecard"><strong>Rider Hub app data</strong><p>Firebase account connected · private Firestore workspace active.</p></div>
      <div class="routecard"><strong>Private file backup</strong><p>Google Drive: ${esc(driveLabel)}</p></div>
      <div class="grid2"><button class="secondary" onclick="riderHubFirebaseSyncNow()">Sync app data</button><button class="primary" onclick="requestDriveAccess(true)">${driveConnected ? 'Refresh Drive' : 'Connect Drive'}</button></div>
      <button class="secondary full rh-logout" style="margin-top:8px" onclick="logoutRiderHub()">Log out</button>`);
  };
}

const previousLogout = window.logoutRiderHub;
window.logoutRiderHub = async function () {
  try {
    if (typeof window.riderHubPublicBeforeLogout === 'function') window.riderHubPublicBeforeLogout();
    if (auth?.currentUser) await signOut(auth);
  } catch (e) {
    console.warn('Firebase logout warning', e);
  }
  current = null;
  localStorage.removeItem(AUTH_KEY);
  if (typeof previousLogout === 'function') previousLogout();
  setTimeout(ensureLoggedOutUi, 50);
};

window.addEventListener('online', () => {
  if (current && isDirty(current.uid)) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(pushUserState, 500);
  }
});

async function init() {
  if (!validConfig(CFG)) {
    ready = false;
    wireLoginUi();
    note('Firebase configuration is missing.', true);
    return;
  }

  try {
    const app = initializeApp(CFG);
    auth = getAuth(app);
    db = getFirestore(app);
    await setPersistence(auth, browserLocalPersistence);
    ready = true;
    installAccountModal();
    wireLoginUi();

    if (sessionStorage.getItem(REDIRECT_KEY)) {
      try {
        note('Finishing Google Sign-In…');
        const result = await getRedirectResult(auth);
        if (result?.user) await enterUser(result.user);
      } catch (e) {
        console.error('Rider Hub redirect sign-in failed', e);
        note('Google Sign-In did not complete. Try again.', true);
      } finally {
        sessionStorage.removeItem(REDIRECT_KEY);
      }
    }

    onAuthStateChanged(auth, async user => {
      if (user) {
        await enterUser(user);
      } else {
        current = null;
        localStorage.removeItem(AUTH_KEY);
        setTimeout(ensureLoggedOutUi, 250);
      }
    });
  } catch (e) {
    console.error('Rider Hub Firebase initialization failed', e);
    ready = false;
    wireLoginUi();
    note('Firebase could not start. Check your connection and reload Rider Hub.', true);
  }
}

window.riderHubFirebaseReady = () => ready;
window.riderHubFirebaseUser = () => current || auth?.currentUser || null;

init();
