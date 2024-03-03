import { deleteDoc, doc } from "firebase/firestore";
import { fireDB, fireStorage } from "./firebaseconfig";
import { deleteObject, ref } from "firebase/storage";

export const isValidEmail = (email) => {
  // Regular expression for a basic email validation
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Test the email against the regex
  return emailRegex.test(email);
};

export const deleteTutorial = async (
  folderName,
  tutName,
  vdName,
  thumbName
) => {
  try {
    await deleteObject(
      ref(fireStorage, `videos/${folderName}/${tutName}/${vdName}`)
    );
    await deleteObject(
      ref(fireStorage, `thumbnails/${folderName}/${tutName}/${thumbName}`)
    );
    await deleteDoc(doc(fireDB, "folders", folderName, "tutorials", tutName));
    console.log(`Deleted ${folderName} folder`);
  } catch (err) {
    console.log(err);
  }
};
