// === Firebase Setup ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCTXTMkG3CDZnxzNijB1bVVvD2nvb5FqSk",
  authDomain: "usercollection-22aeb.firebaseapp.com",
  projectId: "usercollection-22aeb",
  storageBucket: "usercollection-22aeb.appspot.com",
  messagingSenderId: "437650074506",
  appId: "1:437650074506:web:a0d1f6f03f22d8be84f673"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// === Sign Up ===
window.signup = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "create-profile.html";
    })
    .catch((err) => alert(err.message));
};

// === Login ===
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        window.location.href = "TravelBugHomePage.html";
      } else {
        window.location.href = "create-profile.html";
      }
    })
    .catch((err) => alert(err.message));
};

// === Save Profile ===
window.saveProfile = function () {
  const user = auth.currentUser;
  if (!user) return;

  const name = document.getElementById("name").value;
  const age = document.getElementById("age").value;
  const placesBeen = document.getElementById("places-been").value;
  const placesWantToVisit = document.getElementById("places-want").value;
  const countriesVisited = Array.from(document.getElementById("countries-select").selectedOptions).map(opt => opt.value);

  setDoc(doc(db, "users", user.uid), {
    name,
    age,
    placesBeen,
    placesWantToVisit,
    countriesVisited,
    uid: user.uid
  }, { merge: true }) // ✅ This preserves other fields like photos
    .then(() => {
      alert("Profile saved!");
      window.location.href = "TravelBugHomePage.html";
    })
    .catch((err) => alert("Failed to save profile: " + err.message));
};

// === Image Uploading ===
let currentSlotIndex = 0;
const fileInput = document.getElementById("photo-upload");
const slots = document.querySelectorAll(".photo-slot");

slots.forEach((slot, index) => {
  slot.addEventListener("click", () => {
    currentSlotIndex = index;
    fileInput.click();
  });
});

fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const user = auth.currentUser;
  if (!user) return;

  const photoPath = `profilePictures/${user.uid}/photo-${currentSlotIndex}`;
  const storageRef = ref(storage, photoPath);

  try {
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    const slot = slots[currentSlotIndex];
    slot.innerHTML = `<img src="${downloadURL}" alt="Profile photo" />`;

    // Merge photo into existing profile data
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const existingPhotos = userDocSnap.exists() && userDocSnap.data().photos ? userDocSnap.data().photos : {};

    const updatedPhotos = {
      ...existingPhotos,
      [currentSlotIndex]: downloadURL
    };

    await setDoc(userDocRef, { photos: updatedPhotos }, { merge: true }); // ✅ Preserve other profile data

    alert("Photo uploaded!");
  } catch (err) {
    alert("Error uploading photo: " + err.message);
  }
});

// === Auto Redirect if Already Logged In ===
onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const path = window.location.pathname;

  if (path.endsWith("index.html") || path.endsWith("/") || path.endsWith("login.html")) {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      window.location.href = "TravelBugHomePage.html";
    } else {
      window.location.href = "create-profile.html";
    }
  }
});
