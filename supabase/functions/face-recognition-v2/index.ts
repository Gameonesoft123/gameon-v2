import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  ListCollectionsCommand,
} from "https://deno.land/x/aws_sdk@v3.32.0-1/client-rekognition/mod.ts";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

// Helper function to parse base64 image data
function getImageBytes(base64ImageData: string): Uint8Array {
  const parts = base64ImageData.split(",");
  if (parts.length !== 2 || !parts[1]) {
    throw new Error(
      "Invalid base64 image data format. Expected 'data:<mime_type>;base64,<data>'."
    );
  }
  const base64String = parts[1];
  return decode(base64String);
}

console.log("face-recognition-v2: Edge function script loaded. Version 1.");

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const url = new URL(req.url);
  const isHealthCheckViaQuery =
    url.searchParams.get("action") === "health_check";

  console.log(
    `face-recognition-v2: Request received: ${req.method} ${req.url}, Origin: ${
      requestOrigin || "N/A"
    }`
  );

  if (req.method === "OPTIONS") {
    console.log("face-recognition-v2: Handling OPTIONS preflight request.");
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  const responseHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
  };

  try {
    console.log(
      "face-recognition-v2: Step: Checking environment variables for AWS configuration."
    );
    const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
    const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    const awsRegion = Deno.env.get("AWS_REGION");
    const collectionId = Deno.env.get("AWS_REKOGNITION_COLLECTION_ID");

    if (!awsAccessKeyId || !awsSecretAccessKey || !awsRegion || !collectionId) {
      const missingVars = [
        !awsAccessKeyId && "AWS_ACCESS_KEY_ID",
        !awsSecretAccessKey && "AWS_SECRET_ACCESS_KEY",
        !awsRegion && "AWS_REGION",
        !collectionId && "AWS_REKOGNITION_COLLECTION_ID",
      ]
        .filter(Boolean)
        .join(", ");

      console.error(
        `face-recognition-v2: FATAL: Missing AWS configuration: ${missingVars}.`
      );
      return new Response(
        JSON.stringify({
          error: `Server configuration error: Missing AWS environment variables (${missingVars}).`,
          success: false,
        }),
        {
          headers: responseHeaders,
          status: 500,
        }
      );
    }
    console.log(
      `face-recognition-v2: Step: AWS Config Check OK. Region: ${awsRegion}, Collection ID: ${collectionId}`
    );

    let rekognitionClient: RekognitionClient;
    try {
      console.log(
        "face-recognition-v2: Step: Initializing AWS RekognitionClient..."
      );
      rekognitionClient = new RekognitionClient({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId,
          secretAccessKey: awsSecretAccessKey,
        },
        customUserAgent: "no-shared-config", // Optional: Just for debugging
      });
      console.log(
        "face-recognition-v2: Step: AWS RekognitionClient initialized successfully."
      );
    } catch (sdkError: any) {
      console.error(
        "face-recognition-v2: FATAL: Error initializing RekognitionClient:",
        sdkError.message
      );
      return new Response(
        JSON.stringify({
          error: "AWS SDK client initialization failed.",
          details: sdkError.message,
          success: false,
        }),
        {
          headers: responseHeaders,
          status: 500,
        }
      );
    }

    if (req.method === "GET" && isHealthCheckViaQuery) {
      console.log(
        "face-recognition-v2: Step: Performing health check (GET)..."
      );
      try {
        const command = new ListCollectionsCommand({ MaxResults: 1 });
        const response = await rekognitionClient.send(command);
        console.log(
          "face-recognition-v2: Health Check: ListCollectionsCommand successful."
        );
        return new Response(
          JSON.stringify({
            success: true,
            message: "AWS Rekognition connection healthy.",
            collectionCount: response.CollectionIds?.length || 0,
            httpStatusCode: response.$metadata?.httpStatusCode,
          }),
          {
            headers: responseHeaders,
            status: 200,
          }
        );
      } catch (healthError: any) {
        console.error(
          "face-recognition-v2: Health Check FAILED:",
          healthError.message
        );
        return new Response(
          JSON.stringify({
            error: "AWS Rekognition health check failed.",
            details: healthError.message,
            success: false,
          }),
          {
            headers: responseHeaders,
            status: 500,
          }
        );
      }
    }

    if (req.method === "POST") {
      console.log("face-recognition-v2: Step: Processing POST request.");
      let body;
      try {
        body = await req.json();
      } catch (jsonError: any) {
        console.error(
          "face-recognition-v2: Error parsing request JSON:",
          jsonError.message
        );
        return new Response(
          JSON.stringify({
            error: "Invalid request body: Malformed JSON.",
            details: jsonError.message,
            success: false,
          }),
          {
            headers: responseHeaders,
            status: 400,
          }
        );
      }

      const { action, image, customerId } = body; // 'customerId' here is used as ExternalImageId for registration
      console.log(
        `face-recognition-v2: Step: Action: ${action}, CustomerID (ExternalImageId for register): ${
          customerId || "N/A"
        }`
      );

      if (action === "health_check") {
        // ... (similar health check logic as GET for POST)
        return new Response(
          JSON.stringify({ success: true, message: "Health check POST OK" }),
          { headers: responseHeaders, status: 200 }
        );
      }

      if (!action || (action !== "register" && action !== "identify")) {
        console.warn("face-recognition-v2: Invalid 'action':", action);
        return new Response(
          JSON.stringify({
            error: "Invalid 'action'. Must be 'register' or 'identify'.",
            success: false,
          }),
          {
            headers: responseHeaders,
            status: 400,
          }
        );
      }

      if (!image) {
        console.warn(
          "face-recognition-v2: Missing 'image' for action:",
          action
        );
        return new Response(
          JSON.stringify({
            error: "Missing 'image' in request body.",
            success: false,
          }),
          {
            headers: responseHeaders,
            status: 400,
          }
        );
      }

      let imageBytes!: Uint8Array;
      try {
        console.log("face-recognition-v2: Step: Processing image data...");
        imageBytes = getImageBytes(image);
        console.log(
          `face-recognition-v2: Step: Image data processed, ${imageBytes.length} bytes.`
        );
      } catch (e: any) {
        console.error(
          "face-recognition-v2: Error processing image data:",
          e.message
        );
        return new Response(
          JSON.stringify({
            error: `Invalid image data: ${e.message}`,
            success: false,
          }),
          {
            headers: responseHeaders,
            status: 400,
          }
        );
      }

      if (action === "register") {
        console.log(
          `face-recognition-v2: Step: Register action. CustomerId (ExternalImageId): ${customerId}`
        );
        if (!customerId) {
          console.warn(
            "face-recognition-v2: Missing 'customerId' for 'register'."
          );
          return new Response(
            JSON.stringify({
              error:
                "Missing 'customerId' (ExternalImageId) for 'register' action.",
              success: false,
            }),
            {
              headers: responseHeaders,
              status: 400,
            }
          );
        }

        const indexFacesParams = {
          CollectionId: collectionId,
          Image: { Bytes: imageBytes },
          ExternalImageId: customerId,
          MaxFaces: 1,
          QualityFilter: "AUTO",
          DetectionAttributes: ["DEFAULT"],
        };
        console.log(
          "face-recognition-v2: Step: IndexFaces - Sending command..."
        );
        try {
          const command = new IndexFacesCommand(indexFacesParams);
          const response = await rekognitionClient.send(command);
          console.log(
            "face-recognition-v2: Step: IndexFaces - Response received."
          );

          if (response.FaceRecords && response.FaceRecords.length > 0) {
            const faceRecord = response.FaceRecords[0];
            console.log(
              "face-recognition-v2: IndexFaces: Success. FaceId:",
              faceRecord.Face?.FaceId
            );
            return new Response(
              JSON.stringify({
                success: true,
                externalImageId: faceRecord.Face?.ExternalImageId,
                rekognitionFaceId: faceRecord.Face?.FaceId,
                confidence: faceRecord.Face?.Confidence,
              }),
              { headers: responseHeaders, status: 200 }
            );
          } else {
            // ... (error handling for no face detected or low quality)
            let errorMessage =
              "No face detected or face is of too low quality for registration.";
            if (response.UnindexedFaces && response.UnindexedFaces.length > 0) {
              const unindexedReason =
                response.UnindexedFaces[0].Reasons?.join(", ");
              if (unindexedReason)
                errorMessage += ` Reason: ${unindexedReason}`;
            }
            console.warn(
              "face-recognition-v2: IndexFaces: Registration issue:",
              errorMessage
            );
            return new Response(
              JSON.stringify({
                error: errorMessage,
                success: false,
                details: response.UnindexedFaces,
              }),
              {
                headers: responseHeaders,
                status: 400,
              }
            );
          }
        } catch (rekError: any) {
          console.error(
            "face-recognition-v2: IndexFaces: ERROR:",
            rekError.message
          );
          return new Response(
            JSON.stringify({
              error: "AWS Rekognition registration failed.",
              details: rekError.message,
              success: false,
            }),
            {
              headers: responseHeaders,
              status: 500,
            }
          );
        }
      } else if (action === "identify") {
        console.log("face-recognition-v2: Step: Identify action.");
        const searchFacesParams = {
          CollectionId: collectionId,
          Image: { Bytes: imageBytes },
          MaxFaces: 1,
          FaceMatchThreshold: 90,
        };
        console.log(
          "face-recognition-v2: Step: SearchFacesByImage - Sending command..."
        );
        try {
          const command = new SearchFacesByImageCommand(searchFacesParams);
          const response = await rekognitionClient.send(command);
          console.log(
            "face-recognition-v2: Step: SearchFacesByImage - Response received."
          );

          if (response.FaceMatches && response.FaceMatches.length > 0) {
            const bestMatch = response.FaceMatches[0];
            console.log(
              "face-recognition-v2: SearchFacesByImage: Success. ExternalImageId:",
              bestMatch.Face?.ExternalImageId
            );
            return new Response(
              JSON.stringify({
                success: true,
                customerId: bestMatch.Face?.ExternalImageId, // This is the ExternalImageId
                rekognitionFaceId: bestMatch.Face?.FaceId,
                confidence: bestMatch.Similarity,
              }),
              { headers: responseHeaders, status: 200 }
            );
          } else {
            console.log(
              "face-recognition-v2: SearchFacesByImage: No matching face found."
            );
            return new Response(
              JSON.stringify({
                error: "Face not recognized.",
                success: false,
                customerId: null,
              }),
              {
                headers: responseHeaders,
                status: 200, // Success false, but 200 OK as operation completed.
              }
            );
          }
        } catch (rekError: any) {
          console.error(
            "face-recognition-v2: SearchFacesByImage: ERROR:",
            rekError.message
          );
          return new Response(
            JSON.stringify({
              error: "AWS Rekognition identification failed.",
              details: rekError.message,
              success: false,
            }),
            {
              headers: responseHeaders,
              status: 500,
            }
          );
        }
      }
    }

    console.warn(
      "face-recognition-v2: Request did not match any processing logic."
    );
    return new Response(
      JSON.stringify({ error: "Unsupported request.", success: false }),
      {
        headers: responseHeaders,
        status: 405,
      }
    );
  } catch (error: any) {
    console.error(
      "face-recognition-v2: FATAL: Unhandled top-level error:",
      error.message,
      error.stack
    );
    return new Response(
      JSON.stringify({
        error: "Unexpected server error.",
        details: error.message,
        success: false,
      }),
      {
        headers: responseHeaders,
        status: 500,
      }
    );
  }
});
