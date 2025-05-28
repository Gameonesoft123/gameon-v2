import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
//import { IndexFacesCommand as NewIndexFacesCommand, SearchFacesByImageCommand as NewSearchFacesByImageCommand, ListCollectionsCommand, CreateCollectionCommand, RekognitionClient as NewRekognitionClient } from "https://deno.land/x/aws_sdk@v3.32.0-1/client-rekognition/mod.ts";
// import { RekognitionClient as NewRekognitionClient } from "npm:@aws-sdk/client-rekognition@3.511.0";
// import {
//   IndexFacesCommand as NewIndexFacesCommand,
//   SearchFacesByImageCommand as NewSearchFacesByImageCommand,
// } from "npm:@aws-sdk/client-rekognition@3.511.0";
import {
  RekognitionClient as NewRekognitionClient,
  ListCollectionsCommand,
  CreateCollectionCommand,
  IndexFacesCommand as NewIndexFacesCommand,
  SearchFacesByImageCommand as NewSearchFacesByImageCommand,
} from "npm:@aws-sdk/client-rekognition@3.511.0";
// Update CORS headers to explicitly allow localhost
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://thegameon.net",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Credentials": "true",
};
const accessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
const secretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
if (!accessKeyId || !secretAccessKey) {
  throw new Error("AWS credentials not found in environment variables");
}
// Helper function to validate and decode base64
const getImageBytes = (base64Image) => {
  try {
    console.log("Starting image processing...");
    // Log the first 50 characters of the input to check format
    console.log("Image data prefix:", base64Image.substring(0, 50) + "...");
    // Remove any potential data URL prefix
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    console.log("Prefix removed, data length:", base64Data.length);
    // Validate base64 format
    if (!/^[A-Za-z0-9+/]+[=]{0,2}$/.test(base64Data)) {
      console.error("Base64 validation failed");
      throw new Error("Invalid base64 format");
    }
    try {
      // Decode base64 to binary string
      const binaryString = atob(base64Data);
      console.log(
        "Successfully decoded base64, binary length:",
        binaryString.length
      );
      // Convert to Uint8Array
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log("Successfully created Uint8Array, length:", bytes.length);
      return bytes;
    } catch (e) {
      console.error("Error in base64 decoding:", e);
      throw new Error("Failed to decode base64 data");
    }
  } catch (error) {
    console.error("Error in getImageBytes:", error);
    throw error;
  }
};
console.log(
  "face-recognition-v3: Edge function script loaded. Version 1.1 (added header logging)."
);
const COLLECTION_ID = "gameon-face-collection";
// Add this before trying to use the collection
async function verifyCollection(client) {
  try {
    const command = new ListCollectionsCommand({});
    const response = await client.send(command);
    console.log("Available collections:", response.CollectionIds);
    if (!response.CollectionIds?.includes(COLLECTION_ID)) {
      // Collection doesn't exist, create it
      const createCommand = new CreateCollectionCommand({
        CollectionId: COLLECTION_ID,
      });
      await client.send(createCommand);
      console.log(`Collection ${COLLECTION_ID} created successfully`);
    }
  } catch (error) {
    console.error("Error checking/creating collection:", error);
    throw error;
  }
}
serve(async (req) => {
  // Log the request method and URL
  console.log(`Request: ${req.method} ${req.url}`);
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  try {
    // Log request headers
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    // Parse request body
    const body = await req.json();
    console.log("Request body received:", {
      action: body.action,
      hasImage: !!body.image,
      hasCustomerId: !!body.customerId,
    });
    const { image, action, customerId } = body;
    // Validate inputs
    if (!image) {
      throw new Error("No image data provided");
    }
    if (!action) {
      throw new Error("No action specified");
    }
    // Log AWS credentials presence
    console.log("AWS Credentials check:", {
      hasAccessKey: !!Deno.env.get("AWS_ACCESS_KEY_ID"),
      hasSecretKey: !!Deno.env.get("AWS_SECRET_ACCESS_KEY"),
    });
    // Initialize AWS client with minimal config
    const client = new NewRekognitionClient({
      region: "us-east-2",
      credentials: {
        accessKeyId: Deno.env.get("AWS_ACCESS_KEY_ID"),
        secretAccessKey: Deno.env.get("AWS_SECRET_ACCESS_KEY"),
      },
      // Disable file system operations
      tls: true,
    });
    // Verify collection exists before using it
    await verifyCollection(client);
    // Process image
    const base64Data = image.includes("base64,") ? image.split(",")[1] : image;
    const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0)
    );
    let response;
    if (action === "register") {
      console.log("Starting registration...");
      const command = new NewIndexFacesCommand({
        CollectionId: COLLECTION_ID,
        Image: {
          Bytes: imageBytes,
        },
        ExternalImageId: customerId,
        MaxFaces: 1,
        QualityFilter: "AUTO",
      });
      try {
        const response = await client.send(command);
        console.log("Registration successful:", response);
        return new Response(
          JSON.stringify({
            success: true,
            faceId: response.FaceRecords?.[0]?.Face?.FaceId,
            confidence: response.FaceRecords?.[0]?.Face?.Confidence,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (awsError) {
        console.error("AWS Error:", awsError);
        throw new Error(`AWS Registration failed: ${awsError.message}`);
      }
    }
    if (action === "identify") {
      response = await client.send(
        new NewSearchFacesByImageCommand({
          CollectionId: COLLECTION_ID,
          Image: {
            Bytes: imageBytes,
          },
          MaxFaces: 1,
          FaceMatchThreshold: 90,
        })
      );
      return new Response(
        JSON.stringify({
          success: true,
          matches: response.FaceMatches,
          bestMatch: response.FaceMatches?.[0],
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    throw new Error(`Invalid action: ${action}`);
  } catch (error) {
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
