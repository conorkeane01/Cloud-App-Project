import { useEffect, useState } from "react";
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
import { Button } from '@rneui/themed';

const Stack = createNativeStackNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowAlert: true,
    };
  },
});

export default function App() {

  useEffect(() => {
    
    async function configurePushNotifications() {
      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;

      if (finalStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission required",
          "Push notifications need the appropriate permissions."
        );
        return;
      }

      const subscription1 = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log("NOTIFICATION RECEIVED");
          console.log(notification);
          const userName = notification.request.content.data.userName;
          console.log(userName);
        }
      );

      const subscription2 =
        Notifications.addNotificationResponseReceivedListener((response) => {
          console.log("NOTIFICATION RESPONSE RECEIVED");
          console.log(JSON.stringify(response));
          const userName = response.notification.request.content.data.userName;
          console.log(userName);
        });

      return () => {
        subscription1.remove();
        subscription2.remove();
      };
    }

    configurePushNotifications();
  }, []);

  function scheduleNotificationHandler() {
    Notifications.scheduleNotificationAsync({
      content: {
        title: "My first local notification",
        body: "This is the body of the notification.",
        data: { userName: "Max" },
      },
      trigger: {
        seconds: 5,
      },
    });
  }

  return (
    
    <NavigationContainer>
      <Stack.Navigator>
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
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
    marginBottom: 20,
  },
  scrollViewContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
resultText:{
fontSize:24,
fontWeight:'bold',
textAlign: 'center',
marginHorizontal:20,
},
input:{
  height:30,
  borderColor:'grey',
  borderWidth: 1,
  margin:10,
  paddingHorizontal: 10,
  borderRadius: 5,

},

});

const HomeScreen = ({ navigation }) => {
  const [text, onChangeText] = useState("Enter Title");
  const [Result, onChangeResult] = useState("Default Result");
  
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

  
  const styles = StyleSheet.create({
    imagePicker: {
      color:'blue',
      alignItems: "center",
      width: "100%",
      height: "100%",
    },
    imagePreview: {
      width: "100%",
      height: 600,
      marginBottom: 10,
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
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 40,
      elevation: 3,
      backgroundColor: 'black',
    },
    input:{
      height:30,
      width: 200,
      borderColor:'grey',
      borderWidth: 1,
      margin:10,
      paddingHorizontal: 10,
      borderRadius: 5,
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
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

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

  const [pickedImage, setPickedImage] = useState();

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

  const takeImageHandler = async () => {
    console.log("takeImageHandler");
    const hasPermission = await verifyPermissions();
    console.log("hasPermission: " + hasPermission);
    if (!hasPermission) {
      return;
    }
    const image = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.5,
    });
    console.log(image);

    if (!image.cancelled) {
      setPickedImage(image.assets[0].uri);
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
    navigation.navigate("Results", {Result: Result});
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
            `https://79bf-185-52-93-76.ngrok-free.app/addProduct`,
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

  return (
    <View style={styles.container}>
     
      <StatusBar style="auto" />
      <View style={styles.imagePicker}>
      <Button
        buttonStyle={{ 
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 30,}}
          title="Take Image"
          onPress={takeImageHandler}
        />
     
      <View>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={(text) => onChangeText(text)}
        />
      </View>
      <View>
      <Button   buttonStyle={{ backgroundColor: 'red',
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 30,}} title="Insert and Notify" onPress={handleInsertAndNotify} />

        </View>
        <View style={styles.imagePreview}>
          {!pickedImage ? (
            <Text>No image picked yet.</Text>
          ) : (
            <Image style={styles.image} source={{ uri: pickedImage }} />
          )}
        </View>
      </View>
    </View>
  );
};

const ResultsScreen = ({ navigation ,route}) => {
  console.log(route.params)
  return (
    <View style={styles.container}>
   <Text style={styles.resultText}>{route.params.Result}</Text>
  </View>
  )
}

