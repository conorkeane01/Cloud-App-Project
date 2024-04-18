import React, { useRef, useEffect, useState } from 'react';
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import Webcam from "react-webcam"
import logo from './logo.svg';
import './App.css';
import {drawHand} from "./utilities"
import { newImage } from "./App"
 
 
function Index() {
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
 
  // Hardcoded URL of the image
  const ProccessedImageUrl = newImage; // Replace this URL with your actual image URL
 
  useEffect(() => {
    const runHandpose = async () => {
      try {
        setIsLoading(true);
        const net = await handpose.load();
        console.log('Handpose model loaded');
 
        const handImage = new Image();
        handImage.src = ProccessedImageUrl;
        handImage.crossOrigin = "anonymous"; // Needed if the image is from a different origin
        handImage.onload = async () => {
          const { naturalWidth, naturalHeight } = handImage;
          canvasRef.current.width = naturalWidth;
          canvasRef.current.height = naturalHeight;
 
          const ctx = canvasRef.current.getContext('2d');
          const predictions = await net.estimateHands(handImage);
          drawHand(handImage, predictions, ctx, naturalWidth, naturalHeight);
        };
        handImage.onerror = () => {
          setError('Failed to load image.');
        };
      } catch (err) {
        setError('Failed to load the handpose model.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
 
    runHandpose();
  }, []); // Removed imageUrl from the dependency array as it's now static
 
  return (
    <div className="App">
      <header className="App-header">
        {isLoading ? <p>Loading...</p> : <canvas ref={canvasRef} />}
        {error && <p>Error: {error}</p>}
      </header>
    </div>
  );
}
 
export default Index;
