import { useEffect, useState, useRef, createContext, useContext } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import {
  StyleSheet,
  View,
  Alert,
  Platform,
  TextInput,
  Text,
  ScrollView,
  Image,
} from "react-native";
import * as Notifications from "expo-notifications";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import { Button } from "@rneui/themed";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import * as handpose from "@tensorflow-models/handpose";
import { decodeJpeg, fetch as tfFetch } from "@tensorflow/tfjs-react-native";
import * as FileSystem from "expo-file-system";
import * as base64 from "base64-js";

const firebaseConfig = {
  apiKey: "AIzaSyBaMlYDay4-tQxHBklw27wIqypguxLmxZA",
  authDomain: "mobiledev-66468.firebaseapp.com",
  projectId: "mobiledev-66468",
  storageBucket: "mobiledev-66468.appspot.com",
  messagingSenderId: "979485219771",
  appId: "1:979485219771:web:6be11e61e77d9f2ea2029e",
  measurementId: "G-HTMWLDHE04",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const Stack = createNativeStackNavigator();
const ModelContext = createContext();

export function useModel() {
  return useContext(ModelContext);
}

export const ModelProvider = ({ children }) => {
  const modelRef = useRef(null);

  useEffect(() => {
    async function loadModel() {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const handpose = await import("@tensorflow-models/handpose");
      modelRef.current = await handpose.load();
      console.log("Handpose model loaded");
    }
    loadModel();
  }, []);

  return (
    <ModelContext.Provider value={modelRef}>{children}</ModelContext.Provider>
  );
};

export default function App() {
  return (
    <ModelProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: "Login" }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Welcome" }}
          />
          <Stack.Screen
            name="Results"
            component={ResultsScreen}
            options={{ title: "Results" }}
          />
          <Stack.Screen
            name="ThumbsUp"
            component={ThumbsUpScreen}
            options={{ title: "Thumbs Up" }}
          />
          <Stack.Screen
            name="ThumbsDown"
            component={ThumbsDownScreen}
            options={{ title: "Thumbs Down" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ModelProvider>
  );
}

const LoginScreen = ({ navigation, route }) => {
  const [email, onChangeEmail] = useState("Enter Email");
  const [password, onChangePass] = useState("Enter Password");
  const [text, onChangeText] = useState("");
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      height: 40,
      width: "100%",
      borderWidth: 1,
      margin: 12,
      padding: 10,
      borderRadius: 2,
    },
  });
  const signIn = async () => {
    try {
      const response = await fetch(
        "http://34.239.36.76:3010/signin",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "69420",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (data.success) {
        navigation.navigate("Home");
      } else {
        console.log("Login failed");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const signUp = async () => {
    try {
      const response = await fetch(
        "http://34.239.36.76:3010/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "69420",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onChangeText("Account created");
      } else {
        onChangeText("Creation unsuccesful");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(email) => onChangeEmail(email)}
        />
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={(password) => onChangePass(password)}
        />
      </View>
      <View>
        <Button
          buttonStyle={{
            borderWidth: 2,
            borderColor: "white",
            borderRadius: 30,
          }}
          title="Sign up"
          onPress={signUp}
        />
        <Button
          buttonStyle={{
            backgroundColor: "red",
            borderWidth: 2,
            borderColor: "white",
            borderRadius: 30,
          }}
          title="Sign in"
          onPress={signIn}
        />
      </View>
      <Text>{text}</Text>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  const modelRef = useModel();
  const [text, onChangeText] = useState("Enter Title");
  const [Result, setResult] = useState("Processing...");
  const [pickedImage, setPickedImage] = useState(null);

  const processImage = async (uri) => {
    if (!modelRef.current) {
      console.error("Model not loaded yet.");
      setResult("Model not loaded.");
      return;
    }
    try {
      // Fetch the image data as a base64-encoded string
      const imageData = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const rawImageData = base64.toByteArray(imageData);
  
      // Use TensorFlow.js decodeJpeg method to convert this into a tensor
      const imageTensor = decodeJpeg(rawImageData);
  
      // Process the image with the TensorFlow model
      const predictions = await modelRef.current.estimateHands(imageTensor);
      console.log("Image processed", predictions);
      if (predictions.length > 0) {
        const gesture = determineGesture(predictions[0].landmarks);
        console.log("Gesture detected:", gesture);
        setResult(`Gesture detected: ${gesture}`);
        if (gesture === "Thumbs Up") {
          navigation.navigate("ThumbsUp"); // Navigate if thumbs up
        }
        else if (gesture === "Thumbs Down") {
          navigation.navigate("ThumbsDown"); 
        }
      } else {
        setResult("No hands detected.");
      }
    } catch (error) {
      console.error("Failed to process image", error);
      setResult("Failed to process image.");
    }
  };
  

  function determineGesture(landmarks) {
    // Example indices: 4 - Thumb tip, 0 - Palm base, 5 - Index finger base
    const thumbTip = landmarks[4];
    const palmBase = landmarks[0];
    const indexBase = landmarks[5];
  
    // Simple heuristic:
    // Check if the thumb tip is higher than the index base for "Thumbs Up"
    // Check if the thumb tip is lower than the index base for "Thumbs Down"
    if (thumbTip[1] < indexBase[1]) {
      return "Thumbs Up";
    } else if (thumbTip[1] > palmBase[1]) {
      return "Thumbs Down";
    } else {
      return "Uncertain Gesture";
    }
  }


  const takeImageHandler = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission required",
        "You need to grant camera permissions to use this app."
      );
      return;
    }
    const image = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.5,
    });
    console.log("Image:", image);
    if (!image.cancelled && image.assets && image.assets.length > 0) {
      const { uri } = image.assets[0];
      const fileName = uri.substring(uri.lastIndexOf('/') + 1); // Extracts file name from URI
      setPickedImage(uri); // Stores the full URI to state
      processImage(uri); // Process the image using the full URI
      console.log("File Name:", fileName); // Logs the extracted file name
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Button title="Take Image" onPress={takeImageHandler} />
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={onChangeText}
      />
      <Text>{Result}</Text>
      {pickedImage ? (
        <Image source={{ uri: pickedImage }} style={styles.image} />
      ) : (
        <Text>No image picked yet.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 200,
    height: 200,
    margin: 10,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    width: "90%",
  },
});

const manageFileUpload = async (
  fileBlob,
  { onStart, onProgress, onComplete, onFail }
) => {
  console.log("Test");
  const imgName = "img-" + new Date().getTime();

  const storageRef = firebase.storage().ref(`images/${imgName}.jpg`);
  console.log("uploading file", imgName);
  newImage = imgName;

  // Create file metadata including the content type
  const metadata = {
    contentType: "image/jpeg",
  };

  // Trigger file upload start event
  onStart && onStart();
  const uploadTask = storageRef.put(fileBlob, metadata);
  // Listen for state changes, errors, and completion of the upload.
  uploadTask.on(
    "state_changed",
    (snapshot) => {
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

      // Monitor uploading progress
      onProgress && onProgress(Math.fround(progress).toFixed(2));
    },
    (error) => {
      // Something went wrong - dispatch onFail event with error  response
      onFail && onFail(error);
    },
    () => {
      // Upload completed successfully, now we can get the download URL

      uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
        // dispatch on complete event
        onComplete && onComplete(downloadURL);

        console.log("File available at", downloadURL);
      });
    }
  );
};

const verifyPermissions = async () => {
  try {
    const result = await ImagePicker.getCameraPermissionsAsync();
    console.log("verifyPermissions result " + JSON.stringify(result));
    if (!result.granted) {
      Alert.alert(
        "Insufficient permissions!",
        "You need to grant camera permissions to use this app.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  } catch (err) {
    console.log("verifyPermissions err " + err);
    return false;
  }
};

const getBlobFroUri = async (uri) => {
  console.log("blob");
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

  return blob;
};

const handleInsertAndNotify = async () => {
  scheduleNotificationHandlerInsert(text);
  await callnAPIpost();
  //function that gets result from DB
  navigation.navigate("Results", { image: pickedImage, Result: Result });
};

async function scheduleNotificationHandlerInsert(notificationBody) {
  Notifications.scheduleNotificationAsync({
    content: {
      title: "Item added:",
      body: notificationBody,
      data: { userName: "Max" },
    },
    trigger: {
      seconds: 5,
    },
  });
}

function sendPushNotificationHandlerInsert(notificationBody) {
  fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: "ExponentPushToken[rO5-hoAgH9AhTCMpHdpyNu]",
      title: "Item added:",
      body: notificationBody,
    }),
  });
}

const callnAPIpost = async () => {
  try {
    if (!pickedImage) {
      console.log("No image picked");
      return;
    }

    const blob = await getBlobFroUri(pickedImage);
    manageFileUpload(blob, {
      onStart: () => {
        console.log("File upload started");
      },
      onProgress: (progress) => {
        console.log("Upload progress:", progress);
      },
      onComplete: async (downloadURL) => {
        console.log("File upload completed. Download URL:", downloadURL);

        const res = await fetch(
          `http://34.239.36.76:3010/addProduct`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "69420",
            },
            body: JSON.stringify({
              title: text,
              imageUrl: downloadURL,
            }),
          }
        );

        const data = await res.text();
        console.log(data);
        console.log(JSON.stringify(data));
      },
      onFail: (error) => {
        console.log("File upload failed:", error);
      },
    });
  } catch (err) {
    console.log(err);
  }
};

const signOut = async () => {
  try {
    const response = await fetch(
      "http://34.239.36.76:3010/signout",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420",
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      navigation.navigate("Login");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

const ResultsScreen = ({ navigation, route }) => {
  const styles = StyleSheet.create({
    imagePicker: {
      color: "blue",
      alignItems: "center",
      width: "50%",
      height: "50%",
    },
    imagePreview: {
      width: "100%",
      height: 540,
      marginBottom: 5,
      justifyContent: "center",
      alignItems: "center",
      borderColor: "#ccc",
      borderWidth: 1,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    button: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 40,
      elevation: 3,
      backgroundColor: "black",
    },
    input: {
      height: 30,
      width: 200,
      borderColor: "grey",
      borderWidth: 1,
      margin: 10,
      paddingHorizontal: 10,
      borderRadius: 5,
    },
  });
  const { image, Result } = route.params;
  console.log(route.params.image);
  return (
    <View style={styles.container}>
      <View style={styles.imagePreview}>
        <Image style={styles.image} source={{ uri: image }} />
      </View>

      <Text style={styles.resultText}>{Result}</Text>
    </View>
  );
};

const ThumbsUpScreen = ({ navigation }) => {
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://34.239.36.76:3010/addProduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productName,
          price: price,
          imageUrl: 'URL_to_some_image_if_needed'  // You might want to include this if it's required by your schema
        })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", "Product added successfully");
        navigation.navigate('Home');  // or any other screen as necessary
      } else {
        Alert.alert("Error", "Failed to add product");
      }
    } catch (error) {
      console.error('Failed to submit product:', error);
      Alert.alert("Error", "Failed to connect to the server");
    }
  };

  return (
    <View style={styles2.container}>
      <Text style={styles2.title}>Thumbs Up Detected!</Text>
      <TextInput
        style={styles2.input}
        placeholder="Enter Product Name"
        value={productName}
        onChangeText={setProductName}
      />
      <TextInput
        style={styles2.input}
        placeholder="Enter Price"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />
      <Button title="Add Product" onPress={handleSubmit} />
    </View>
  );
};

const ThumbsDownScreen = ({ navigation }) => {
  const [productName, setProductName] = useState('');

  const handleDeleteProduct = async () => {
    try {
      const response = await fetch('http://34.239.36.76:3010/deleteProduct', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productName
        })
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert("Success", "Product deleted successfully");
        navigation.navigate('Home');  // or any other screen as necessary
      } else {
        Alert.alert("Error", "Failed to delete product");
      }
    } catch (error) {
      console.error('Failed to submit product:', error);
      Alert.alert("Error", "Failed to connect to the server");
    }
  };

  return (
    <View style={styles2.container}>
      <Text style={styles2.title}>Thumbs Down Detected!</Text>
      <TextInput
       style={styles.input}
       placeholder="Enter Product Name"
       value={productName}
       onChangeText={setProductName}
      />
      <Button title="Delete Product" onPress={handleDeleteProduct} />
    </View>
  );
};

// Include styles for inputs
const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 10,
  }
});