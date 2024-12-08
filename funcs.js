import { deleteDoc, doc } from "firebase/firestore";
import { fireDB, fireStorage } from "./firebaseconfig";
import { deleteObject, ref } from "firebase/storage";

export const isValidEmail = (email) => {
  // Regular expression for a basic email validation
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Test the email against the regex
  return emailRegex.test(email);
};

export const deleteTutorial = async (folderName, title, video, thumbnail) => {
  try {
    // Delete thumbnail from storage if it exists
    if (thumbnail) {
      const thumbnailRef = ref(
        fireStorage,
        `thumbnails/${folderName}/${title}/${thumbnail}`
      );
      try {
        await deleteObject(thumbnailRef);
      } catch (error) {
        console.log("Thumbnail might not exist:", error);
        // Continue with deletion even if thumbnail doesn't exist
      }
    }

    // Delete the document from Firestore
    const tutorialRef = doc(fireDB, "folders", folderName, "tutorials", title);
    await deleteDoc(tutorialRef);

    return true;
  } catch (err) {
    console.error("Error in deleteTutorial:", err);
    throw err;
  }
};
