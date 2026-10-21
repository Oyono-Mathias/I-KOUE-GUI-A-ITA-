const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const app = initializeApp();
// L'application utilise une base Firestore nommée, pas la base (default).
const db = getFirestore(app, "ai-studio-associationikoue-fd6a3bd0-f950-4d83-a060-f13ee4c4c3a5");

const APPROVER_ROLES = new Set([
  "super_admin",
  "president",
  "president_fondateur",
  "admin",
  "secretaire",
  "vice_president",
]);

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

async function requireApprover(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Connexion requise.");
  }

  const profileSnap = await db.collection("users").doc(request.auth.uid).get();
  if (!profileSnap.exists) {
    throw new HttpsError("permission-denied", "Profil utilisateur introuvable.");
  }

  const profile = profileSnap.data();
  if ((profile.statut || profile.status) === "suspendu" || !APPROVER_ROLES.has(profile.role)) {
    throw new HttpsError("permission-denied", "Vous n'êtes pas autorisé à traiter les adhésions.");
  }

  return profile;
}

async function findApprovedRequest(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  for (const collectionName of ["membership_requests", "adhesions"]) {
    // Les demandes historiques ne normalisaient pas forcément l'e-mail en écriture.
    const snapshot = await db.collection(collectionName).get();
    const approved = snapshot.docs.find((doc) => {
      const data = doc.data();
      return normalizeEmail(data.email) === normalized
        && (data.statut === "acceptee" || data.statut === "accepte");
    });
    if (approved) return { collectionName, ref: approved.ref, data: approved.data() };
  }

  return null;
}

async function activateExistingAuthUser(email, requestData) {
  try {
    const authUser = await getAuth().getUserByEmail(email);
    const profileRef = db.collection("users").doc(authUser.uid);
    const profileSnap = await profileRef.get();

    if (profileSnap.exists) {
      const existing = profileSnap.data();
      if (!["membre", "member"].includes(existing.role || "membre")) return;
      if (["suspendu", "radie"].includes(existing.statut || existing.status)) return;
    }

    await profileRef.set({
      uid: authUser.uid,
      email,
      displayName: profileSnap.exists
        ? (profileSnap.data().displayName || requestData.nom)
        : requestData.nom,
      role: "membre",
      statut: "actif",
      membershipApprovedAt: FieldValue.serverTimestamp(),
      membershipApprovedBy: requestData.reviewedBy,
    }, { merge: true });
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    // L'inscription Google pourra être finalisée à la prochaine connexion.
  }
}

exports.decideMembershipRequest = onCall(async (request) => {
  const profile = await requireApprover(request);
  const { requestId, sourceCollection, decision } = request.data || {};

  if (typeof requestId !== "string" || requestId.length < 1 || requestId.length > 200) {
    throw new HttpsError("invalid-argument", "Identifiant de demande invalide.");
  }
  if (!["membership_requests", "adhesions"].includes(sourceCollection)) {
    throw new HttpsError("invalid-argument", "Source de demande invalide.");
  }
  if (!["acceptee", "refusee"].includes(decision)) {
    throw new HttpsError("invalid-argument", "Décision invalide.");
  }

  const requestRef = db.collection(sourceCollection).doc(requestId);
  const requestSnap = await requestRef.get();
  if (!requestSnap.exists) {
    throw new HttpsError("not-found", "Cette demande n'existe plus.");
  }

  const data = requestSnap.data();
  if (data.statut !== "en_attente") {
    throw new HttpsError("failed-precondition", "Cette demande a déjà été traitée.");
  }

  const email = normalizeEmail(data.email);
  if (!email || !email.includes("@")) {
    throw new HttpsError("failed-precondition", "L'adresse e-mail de la demande est invalide.");
  }

  const reviewedBy = request.auth.uid;
  await requestRef.update({
    statut: decision,
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy,
    reviewerRole: profile.role,
  });

  if (decision === "acceptee") {
    try {
      await activateExistingAuthUser(email, { ...data, reviewedBy });
    } catch (error) {
      // La décision est enregistrée. La synchronisation côté connexion pourra réessayer.
      console.error("La demande est acceptée, mais l'activation immédiate du profil a échoué.", error);
    }
  }

  return { ok: true, decision };
});

exports.syncApprovedMembership = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Connexion requise.");
  }

  const authUser = await getAuth().getUser(request.auth.uid);
  const email = normalizeEmail(authUser.email);
  if (!email || !authUser.emailVerified) {
    throw new HttpsError("failed-precondition", "Un compte avec une adresse e-mail vérifiée est requis.");
  }

  const approved = await findApprovedRequest(email);
  if (!approved) return { ok: false, status: "en_attente" };

  const profileRef = db.collection("users").doc(request.auth.uid);
  const profileSnap = await profileRef.get();
  if (profileSnap.exists) {
    const existing = profileSnap.data();
    if (!["membre", "member"].includes(existing.role || "membre")) {
      return { ok: false, status: "profil_existant" };
    }
    if (["suspendu", "radie"].includes(existing.statut || existing.status)) {
      return { ok: false, status: "bloque" };
    }
  }

  await profileRef.set({
    uid: request.auth.uid,
    email,
    displayName: profileSnap.exists
      ? (profileSnap.data().displayName || approved.data.nom)
      : approved.data.nom,
    role: "membre",
    statut: "actif",
    membershipApprovedAt: FieldValue.serverTimestamp(),
    membershipApprovedBy: approved.data.reviewedBy || null,
  }, { merge: true });

  await approved.ref.update({ linkedUid: request.auth.uid });
  return { ok: true, status: "actif" };
});
