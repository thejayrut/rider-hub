/* Rider Hub Firebase Google authentication + conflict-safe per-user Firestore sync.
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
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const CFG = window.RIDER_HUB_FIREBASE_CONFIG;
const AUTH_KEY = 'riderhub_auth_session_v1';
const DIRTY_PREFIX = 'riderhub_firebase_dirty_v1_';
const META_PREFIX = 'riderhub_firebase_meta_v1_';
const CONFLICT_PREFIX = 'riderhub_firebase_conflict_v1_';
const MIGRATION_KEY = 'riderhub_firebase_legacy_migrated_v1';
const MIGRATION_REPORT_PREFIX = 'riderhub_firebase_migration_report_v1_';
const REDIRECT_KEY = 'riderhub_firebase_redirect_pending_v1';
const CLIENT_ID_KEY = 'riderhub_firebase_client_id_v1';
const CANONICAL_HOST = 'rider-hub-506306.firebaseapp.com';
const CANONICAL_URL = `https://${CANONICAL_HOST}/`;
const STATE_SCHEMA = 3;
const MAX_STATE_BYTES = 850 * 1024;

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
let cloudLoadedForUid = '';
let syncStatus = { kind: 'loading', label: 'Starting', detail: '', revision: 0, lastSyncAt: '' };

const clone = value => {
  try { return JSON.parse(JSON.stringify(value)); } catch { return null; }
};
const validConfig = c => !!(c && c.apiKey && c.projectId && c.appId && c.authDomain);
const uidKey = (prefix, uid) => prefix + String(uid || '');
const dirtyKey = uid => uidKey(DIRTY_PREFIX, uid);
const metaKey = uid => uidKey(META_PREFIX, uid);
const conflictKey = uid => uidKey(CONFLICT_PREFIX, uid);
const migrationReportKey = uid => uidKey(MIGRATION_REPORT_PREFIX, uid);
const isMobileBrowser = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
const sameOriginAuth = () => !!CFG?.authDomain && location.hostname === CFG.authDomain;
const localPreviewActive = () => typeof window.RIDER_HUB_LOCAL_PREVIEW_ACTIVE === 'function' && window.RIDER_HUB_LOCAL_PREVIEW_ACTIVE();

function getOrCreateClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY) || '';
  if (!id) {
    id = (crypto?.randomUUID?.() || `rh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`).slice(0, 96);
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}
const CLIENT_ID = getOrCreateClientId();

function readJson(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
function setDirty(uid, on = true) {
  if (!uid) return;
  if (on) localStorage.setItem(dirtyKey(uid), '1');
  else localStorage.removeItem(dirtyKey(uid));
}
const isDirty = uid => !!(uid && localStorage.getItem(dirtyKey(uid)) === '1');
const getMeta = uid => readJson(metaKey(uid), { revision: 0, lastSyncAt: '', lastClientId: '' }) || { revision: 0, lastSyncAt: '', lastClientId: '' };
function setMeta(uid, patch = {}) {
  const next = { ...getMeta(uid), ...patch };
  writeJson(metaKey(uid), next);
  return next;
}
function cloudRevision(data, exists = true) {
  const r = Number(data?.revision || 0);
  return Number.isInteger(r) && r >= 1 ? r : (exists ? 1 : 0);
}
function stateBytes(value) {
  try { return new Blob([JSON.stringify(value)]).size; } catch { return Number.MAX_SAFE_INTEGER; }
}
function sanitizeState(value) {
  const out = clone(value);
  if (!out || typeof out !== 'object') return null;
  if (out.ride && typeof out.ride === 'object') {
    delete out.ride.weather;
    delete out.ride.weatherUpdated;
  }
  return out;
}
function saveSafetyCopy(uid, reason, cloudRev = 0) {
  if (!uid || typeof window.riderHubExportState !== 'function') return false;
  const state = clone(window.riderHubExportState());
  if (!state) return false;
  return writeJson(conflictKey(uid), {
    savedAt: new Date().toISOString(),
    reason,
    cloudRevision: Number(cloudRev || 0),
    state
  });
}
function clearSafetyCopy(uid) {
  if (uid) localStorage.removeItem(conflictKey(uid));
}

function statusLabel(kind) {
  return ({
    loading: 'STARTING',
    signedout: 'SIGNED OUT',
    local: 'LOCAL',
    synced: 'SYNCED',
    syncing: 'SYNCING',
    pending: 'PENDING',
    offline: 'OFFLINE',
    conflict: 'CONFLICT',
    error: 'ERROR'
  })[kind] || String(kind || '').toUpperCase();
}
function setSyncStatus(kind, detail = '', extra = {}) {
  const meta = current ? getMeta(current.uid) : { revision: 0, lastSyncAt: '' };
  syncStatus = {
    kind,
    label: statusLabel(kind),
    detail: detail || '',
    revision: Number(extra.revision ?? meta.revision ?? 0),
    lastSyncAt: extra.lastSyncAt ?? meta.lastSyncAt ?? ''
  };
  const chip = document.querySelector('#rhSyncChip');
  if (chip) {
    const visible = kind !== 'signedout' && kind !== 'loading';
    chip.hidden = !visible;
    chip.dataset.state = kind;
    chip.textContent = syncStatus.label;
    chip.title = syncStatus.detail || syncStatus.label;
  }
  try { window.dispatchEvent(new CustomEvent('riderhub-sync-status', { detail: clone(syncStatus) })); } catch {}
}
window.riderHubFirebaseSyncStatus = () => clone(syncStatus);
window.riderHubFirebaseSafetyCopy = () => current ? readJson(conflictKey(current.uid), null) : null;
window.riderHubFirebaseMigrationReport = () => current ? readJson(migrationReportKey(current.uid), null) : null;

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
  const helper = !navigator.onLine
    ? 'You are offline. Reconnect to sign in.'
    : hosted
      ? 'Google Sign-In is ready.'
      : 'This fallback build works locally. Mobile cloud sign-in is intended for Firebase Hosting.';
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
    google.disabled = !ready || !navigator.onLine;
  }
}

function ensureLoggedOutUi() {
  localStorage.removeItem(AUTH_KEY);
  if (localPreviewActive()) {
    document.querySelector('#rhAuthShell')?.classList.remove('active');
    setSyncStatus('local', 'Local preview · cloud sync is off');
    return;
  }
  setSyncStatus(navigator.onLine ? 'signedout' : 'offline', navigator.onLine ? 'Sign in to sync Rider Hub' : 'Offline · sign-in unavailable');
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
    version: Math.max(1, Number(migrated.profile?.version || 1)),
    bikeConfigured: migrated.profile?.bikeConfigured !== false,
    account: {
      ...(migrated.profile?.account || {}),
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || user.email || 'Rider',
      photoURL: user.photoURL || '',
      provider: 'firebase'
    }
  };
  return migrated;
}

async function writeUserProfile(user) {
  if (!db || !user) return;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('Rider Hub profile update unavailable', e);
  }
}

async function readCloudEnvelope(user) {
  if (!db || !user) throw new Error('Firestore is not ready');
  const ref = doc(db, 'users', user.uid, 'riderhub', 'state');
  const snap = await getDoc(ref);
  if (!snap.exists() || !snap.data()?.state) return { exists: false, revision: 0, data: null, state: null };
  const data = snap.data();
  return { exists: true, revision: cloudRevision(data, true), data, state: data.state };
}

function applyCloudEnvelope(user, envelope, { clearSafety = true } = {}) {
  if (!envelope?.exists || !envelope.state || typeof window.riderHubImportState !== 'function') return false;
  window.riderHubImportState(envelope.state);
  const now = new Date().toISOString();
  setMeta(user.uid, { revision: envelope.revision, lastSyncAt: now, lastClientId: envelope.data?.clientId || '' });
  setDirty(user.uid, false);
  if (clearSafety) clearSafetyCopy(user.uid);
  setSyncStatus('synced', 'Cloud data loaded', { revision: envelope.revision, lastSyncAt: now });
  return true;
}

async function pushUserState({ force = false } = {}) {
  if (!db || !current || syncing || typeof window.riderHubExportState !== 'function') return false;
  const uid = current.uid;
  if (!navigator.onLine) {
    setDirty(uid, true);
    setSyncStatus('offline', 'Changes are saved on this device and will sync when online');
    return false;
  }

  const state = sanitizeState(window.riderHubExportState());
  if (!state) return false;
  const bytes = stateBytes(state);
  if (bytes > MAX_STATE_BYTES) {
    setDirty(uid, true);
    setSyncStatus('error', `Rider Hub app data is too large to sync safely (${Math.ceil(bytes / 1024)} KB)`);
    if (typeof window.toast === 'function') window.toast('App data is too large for Firestore sync · export a backup');
    return false;
  }

  syncing = true;
  setSyncStatus('syncing', 'Saving Rider Hub to Firestore');
  const ref = doc(db, 'users', uid, 'riderhub', 'state');
  const expectedRevision = Number(getMeta(uid).revision || 0);
  let committedRevision = expectedRevision;

  try {
    await runTransaction(db, async tx => {
      const snap = await tx.get(ref);
      const remoteData = snap.exists() ? snap.data() : null;
      const remoteRevision = cloudRevision(remoteData, snap.exists());
      if (!force && remoteRevision !== expectedRevision) {
        const err = new Error('A newer Rider Hub copy exists in Firestore');
        err.code = 'riderhub/revision-conflict';
        err.remoteRevision = remoteRevision;
        throw err;
      }
      committedRevision = remoteRevision + 1;
      tx.set(ref, {
        schema: STATE_SCHEMA,
        revision: committedRevision,
        clientId: CLIENT_ID,
        state,
        clientUpdatedAt: Date.now(),
        updatedAt: serverTimestamp()
      });
    });

    const now = new Date().toISOString();
    setMeta(uid, { revision: committedRevision, lastSyncAt: now, lastClientId: CLIENT_ID });
    setDirty(uid, false);
    clearSafetyCopy(uid);
    cloudLoadedForUid = uid;
    setSyncStatus('synced', 'Rider Hub is synced', { revision: committedRevision, lastSyncAt: now });
    return true;
  } catch (e) {
    setDirty(uid, true);
    if (e?.code === 'riderhub/revision-conflict') {
      saveSafetyCopy(uid, 'Newer cloud revision detected before upload', Number(e.remoteRevision || 0));
      setSyncStatus('conflict', 'A newer cloud copy exists. Choose which copy to keep from My Account.', { revision: Number(e.remoteRevision || 0) });
      if (typeof window.toast === 'function') window.toast('Sync conflict · no data was overwritten');
    } else {
      console.warn('Rider Hub Firestore sync unavailable', e);
      setSyncStatus(navigator.onLine ? 'pending' : 'offline', navigator.onLine ? 'Sync failed · your changes remain on this device' : 'Offline · changes remain on this device');
    }
    return false;
  } finally {
    syncing = false;
  }
}

async function reconcileUser(user) {
  if (!user || !db) return false;
  const uid = user.uid;
  try {
    const envelope = await readCloudEnvelope(user);
    if (envelope.exists) {
      const dirty = isDirty(uid);
      const knownRevision = Number(getMeta(uid).revision || 0);
      if (!dirty) {
        applyCloudEnvelope(user, envelope);
      } else if (knownRevision === envelope.revision) {
        await pushUserState();
      } else {
        saveSafetyCopy(uid, 'Local unsynced changes and newer cloud data both exist', envelope.revision);
        setSyncStatus('conflict', 'Local changes and a newer cloud copy both exist. Nothing was overwritten.', { revision: envelope.revision });
      }
      cloudLoadedForUid = uid;
      return true;
    }

    setMeta(uid, { revision: 0 });
    const canMigrate = migratableState && !localStorage.getItem(MIGRATION_KEY);
    if (canMigrate && typeof window.riderHubImportState === 'function') {
      const migrated = migrateStateForUser(migratableState, user);
      if (migrated) {
        window.riderHubImportState(migrated);
        localStorage.setItem(MIGRATION_KEY, uid);
        writeJson(migrationReportKey(uid), {
          migratedAt: new Date().toISOString(),
          source: location.hostname === 'thejayrut.github.io' ? 'GitHub Pages local state' : 'Rider Hub local starter state',
          targetUid: uid
        });
        migratableState = null;
        setDirty(uid, true);
      }
    }
    if (!isDirty(uid)) setDirty(uid, true);
    await pushUserState();
    cloudLoadedForUid = uid;
    return true;
  } catch (e) {
    console.warn('Rider Hub cloud reconciliation unavailable', e);
    setSyncStatus(navigator.onLine ? 'pending' : 'offline', navigator.onLine ? 'Cloud check unavailable · local data is safe' : 'Offline · local data is safe');
    return false;
  }
}

window.riderHubFirebaseQueueSync = function () {
  if (!current) return;
  setDirty(current.uid, true);
  clearTimeout(syncTimer);
  if (syncStatus.kind !== 'conflict') setSyncStatus(navigator.onLine ? 'pending' : 'offline', navigator.onLine ? 'Changes waiting to sync' : 'Offline · changes waiting to sync');
  if (!db || !navigator.onLine || syncStatus.kind === 'conflict') return;
  syncTimer = setTimeout(() => pushUserState(), 1200);
};

window.riderHubFirebaseSyncNow = async function () {
  if (!current) {
    if (localPreviewActive()) {
      if (typeof window.toast === 'function') window.toast('Local preview · cloud sync is off');
      return false;
    }
    if (typeof window.toast === 'function') window.toast('Sign in to sync Rider Hub');
    return false;
  }
  if (syncStatus.kind === 'conflict') {
    if (typeof window.openMyAccount === 'function') window.openMyAccount();
    return false;
  }
  const ok = await pushUserState();
  if (typeof window.toast === 'function') window.toast(ok ? 'Rider Hub app data synced' : (navigator.onLine ? 'Sync pending · local data is safe' : 'Offline · local data is safe'));
  return ok;
};

window.riderHubFirebaseUseCloudCopy = async function () {
  if (!current) return false;
  saveSafetyCopy(current.uid, 'Safety copy before choosing cloud version', getMeta(current.uid).revision || 0);
  try {
    const envelope = await readCloudEnvelope(current);
    if (!envelope.exists) throw new Error('Cloud copy not found');
    const ok = applyCloudEnvelope(current, envelope, { clearSafety: false });
    if (ok && typeof window.toast === 'function') window.toast('Cloud copy restored · local safety copy kept');
    if (typeof window.openMyAccount === 'function') setTimeout(window.openMyAccount, 50);
    return ok;
  } catch (e) {
    setSyncStatus('error', 'Could not load the cloud copy');
    if (typeof window.toast === 'function') window.toast('Could not load cloud copy');
    return false;
  }
};

window.riderHubFirebaseKeepThisDevice = async function () {
  if (!current) return false;
  const ok = await pushUserState({ force: true });
  if (ok && typeof window.toast === 'function') window.toast('This device copy is now the cloud copy');
  if (typeof window.openMyAccount === 'function') setTimeout(window.openMyAccount, 50);
  return ok;
};

window.riderHubFirebaseRestoreSafetyCopy = function () {
  if (!current || typeof window.riderHubImportState !== 'function') return false;
  const backup = readJson(conflictKey(current.uid), null);
  if (!backup?.state) return false;
  window.riderHubImportState(backup.state);
  setDirty(current.uid, true);
  setSyncStatus(navigator.onLine ? 'pending' : 'offline', 'Safety copy restored on this device · sync when ready');
  if (typeof window.toast === 'function') window.toast('Local safety copy restored');
  return true;
};

async function enterUser(user) {
  if (!user || entering) return;
  if (current?.uid === user.uid && cloudLoadedForUid === user.uid) return;
  entering = true;
  current = user;
  localStorage.setItem(AUTH_KEY, JSON.stringify({
    at: new Date().toISOString(),
    provider: 'firebase',
    uid: user.uid,
    email: user.email || ''
  }));

  try {
    setSyncStatus(navigator.onLine ? 'syncing' : 'offline', navigator.onLine ? 'Opening your Rider Hub workspace' : 'Offline · opening local workspace');
    if (typeof window.riderHubActivatePublicUser === 'function') {
      window.riderHubActivatePublicUser({
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email || 'Rider',
        photoURL: user.photoURL || '',
        provider: 'firebase'
      });
    }
    await writeUserProfile(user);
    await reconcileUser(user);
    document.querySelector('#rhAuthShell')?.classList.remove('active');
    if (typeof window.renderMore === 'function') window.renderMore();
    if (typeof window.toast === 'function' && syncStatus.kind !== 'conflict') window.toast(`Signed in${user.displayName ? ' as ' + user.displayName : ''}`);
  } finally {
    entering = false;
  }
}

window.rhLoginGoogle = async function () {
  if (localPreviewActive() && typeof window.RIDER_HUB_EXIT_LOCAL_PREVIEW === 'function') window.RIDER_HUB_EXIT_LOCAL_PREVIEW(false);
  if (!navigator.onLine) return note('You are offline. Reconnect to sign in.', true);
  if (!ready || !auth) return note('Google Sign-In is still loading. Try again in a moment.', true);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
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
      const fallbackHint = isMobileBrowser() && !sameOriginAuth() ? ' Use the local preview here, or sign in from the Firebase-hosted Rider Hub.' : '';
      note('Could not sign in with Google.' + fallbackHint, true);
    }
  }
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function installAccountModal() {
  window.openMyAccount = function () {
    if (localPreviewActive() && !current) {
      if (typeof window.openModal !== 'function') return;
      window.openModal(`<div class="modalhead"><div><div class="kicker">MY ACCOUNT</div><h3>Local preview</h3><p class="caption">This GitHub Pages copy stays on this device.</p></div><button class="round" onclick="closeModal()">×</button></div>
        <div class="routecard"><strong>App data</strong><p>Local storage only · Firebase cloud sync is off in preview mode.</p></div>
        <div class="grid2"><button class="secondary" onclick="openTransfer()">Backup / Import</button><button class="primary" onclick="RIDER_HUB_EXIT_LOCAL_PREVIEW(true)">Sign in instead</button></div>`);
      return;
    }

    const u = current || auth?.currentUser;
    if (!u) {
      ensureLoggedOutUi();
      return;
    }
    const driveLabel = typeof window.cloudSyncLabel === 'function' ? window.cloudSyncLabel() : 'Not connected';
    const driveConnected = typeof window.cloudSyncConnected === 'function' && window.cloudSyncConnected();
    const status = window.riderHubFirebaseSyncStatus();
    const safety = readJson(conflictKey(u.uid), null);
    const migration = readJson(migrationReportKey(u.uid), null);
    const avatar = u.photoURL ? `<img class="rh-account-avatar" src="${esc(u.photoURL)}" alt="">` : `<div class="rh-account-avatar fallback">RH</div>`;
    const last = status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Not synced yet';
    const conflict = status.kind === 'conflict' ? `<div class="alert red"><strong>Sync conflict</strong><br>${esc(status.detail)} A local safety copy was saved before any overwrite.</div><div class="grid2" style="margin-top:10px"><button class="secondary" onclick="riderHubFirebaseUseCloudCopy()">Use cloud copy</button><button class="primary" onclick="riderHubFirebaseKeepThisDevice()">Keep this device</button></div>` : '';
    const recovery = safety && status.kind !== 'conflict' ? `<button class="secondary full" style="margin-top:8px" onclick="riderHubFirebaseRestoreSafetyCopy()">Restore local safety copy</button>` : '';
    const migrationNote = migration ? `<div class="caption" style="margin-top:8px">Local data migration completed ${esc(new Date(migration.migratedAt).toLocaleString())}.</div>` : '';
    if (typeof window.openModal !== 'function') return;
    window.openModal(`<div class="modalhead"><div class="rh-account-profile">${avatar}<div><div class="kicker">MY ACCOUNT</div><h3>${esc(u.displayName || 'Rider Hub')}</h3><p class="caption">${esc(u.email || '')}</p></div></div><button class="round" onclick="closeModal()">×</button></div>
      <div class="routecard"><strong>Rider Hub app data · ${esc(status.label)}</strong><p>${esc(status.detail || 'Firebase account connected')} · Revision ${Number(status.revision || 0)} · ${esc(last)}</p></div>
      ${conflict}
      <div class="routecard"><strong>Private file backup</strong><p>Google Drive: ${esc(driveLabel)}</p></div>
      <div class="grid2"><button class="secondary" onclick="riderHubFirebaseSyncNow()">Sync app data</button><button class="primary" onclick="requestDriveAccess(true)">${driveConnected ? 'Refresh Drive' : 'Connect Drive'}</button></div>
      ${recovery}${migrationNote}
      <button class="secondary full rh-logout" style="margin-top:8px" onclick="logoutRiderHub()">Log out</button>`);
  };
}

const previousLogout = window.logoutRiderHub;
window.logoutRiderHub = async function () {
  try {
    if (current && isDirty(current.uid) && syncStatus.kind !== 'conflict' && navigator.onLine) await pushUserState();
    if (typeof window.riderHubPublicBeforeLogout === 'function') window.riderHubPublicBeforeLogout();
    if (auth?.currentUser) await signOut(auth);
  } catch (e) {
    console.warn('Firebase logout warning', e);
  }
  current = null;
  cloudLoadedForUid = '';
  localStorage.removeItem(AUTH_KEY);
  if (typeof previousLogout === 'function') previousLogout();
  setTimeout(ensureLoggedOutUi, 50);
};

window.addEventListener('online', () => {
  wireLoginUi();
  if (!current) {
    ensureLoggedOutUi();
    return;
  }
  clearTimeout(syncTimer);
  if (syncStatus.kind === 'conflict') return;
  syncTimer = setTimeout(() => {
    if (cloudLoadedForUid !== current.uid) reconcileUser(current);
    else if (isDirty(current.uid)) pushUserState();
    else setSyncStatus('synced', 'Rider Hub is synced');
  }, 500);
});
window.addEventListener('offline', () => {
  wireLoginUi();
  if (current) setSyncStatus('offline', isDirty(current.uid) ? 'Offline · changes waiting to sync' : 'Offline · local copy available');
  else if (localPreviewActive()) setSyncStatus('local', 'Local preview · cloud sync is off');
  else setSyncStatus('offline', 'Offline · sign-in unavailable');
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && current && isDirty(current.uid) && navigator.onLine && syncStatus.kind !== 'conflict') {
    clearTimeout(syncTimer);
    pushUserState();
  }
});

async function init() {
  if (!validConfig(CFG)) {
    ready = false;
    wireLoginUi();
    note('Firebase configuration is missing.', true);
    setSyncStatus('error', 'Firebase configuration is missing');
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

    try {
      if (sessionStorage.getItem(REDIRECT_KEY)) note('Finishing Google Sign-In…');
      const result = await getRedirectResult(auth);
      if (result?.user) await enterUser(result.user);
    } catch (e) {
      console.error('Rider Hub redirect sign-in failed', e);
      note('Google Sign-In did not complete. Try again.', true);
    } finally {
      sessionStorage.removeItem(REDIRECT_KEY);
    }

    onAuthStateChanged(auth, async user => {
      if (user) {
        await enterUser(user);
      } else {
        current = null;
        cloudLoadedForUid = '';
        localStorage.removeItem(AUTH_KEY);
        setTimeout(ensureLoggedOutUi, 150);
      }
    });
  } catch (e) {
    console.error('Rider Hub Firebase initialization failed', e);
    ready = false;
    wireLoginUi();
    note('Firebase could not start. Check your connection and reload Rider Hub.', true);
    setSyncStatus('error', 'Firebase could not start');
  }
}

window.riderHubFirebaseReady = () => ready;
window.riderHubFirebaseUser = () => current || auth?.currentUser || null;
window.riderHubFirebaseClientId = () => CLIENT_ID;
window.riderHubFirebaseStateSize = () => typeof window.riderHubExportState === 'function' ? stateBytes(sanitizeState(window.riderHubExportState())) : 0;

if (localPreviewActive()) setSyncStatus('local', 'Local preview · cloud sync is off');
else setSyncStatus(navigator.onLine ? 'loading' : 'offline', navigator.onLine ? 'Starting Firebase' : 'Offline');
init();
