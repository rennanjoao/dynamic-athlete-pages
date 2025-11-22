import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { gender, skinColor, hairColor, bodyFat, weight, customization } = await req.json();

    // Build realistic 3D avatar prompt
    const genderDesc = gender === "female" ? "woman" : "man";
    const bodyType = bodyFat < 15 ? "athletic and muscular" 
                   : bodyFat < 20 ? "fit and toned"
                   : bodyFat < 25 ? "average build"
                   : "curvy build";
    
    const skinTone = skinColor === "#f5d0b0" ? "light skin tone"
                   : skinColor === "#ddb896" ? "medium light skin tone"
                   : skinColor === "#c68562" ? "medium skin tone"
                   : skinColor === "#8d5524" ? "medium dark skin tone"
                   : "dark skin tone";

    const hairDesc = hairColor === "#000000" ? "black hair"
                   : hairColor === "#2C1810" ? "dark brown hair"
                   : hairColor === "#654321" ? "brown hair"
                   : hairColor === "#B8860B" ? "golden brown hair"
                   : hairColor === "#FFA500" ? "red hair"
                   : "blonde hair";

    const clothingDesc = gender === "female" 
      ? "wearing black athletic leggings and a sports top, holding a water bottle"
      : "wearing black athletic shorts and a tank top, holding a water bottle";

    const prompt = `Ultra-realistic 3D rendered full body portrait of a ${bodyType} ${genderDesc} with ${skinTone} and ${hairDesc}, ${clothingDesc}, standing in a confident fitness pose. Professional 3D character model with detailed textures, studio lighting, white background. Photorealistic CGI quality, highly detailed, 8K resolution. Athletic physique, modern fitness wear, professional studio photography style.`;

    console.log("Generating avatar with prompt:", prompt);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please wait a moment and try again." 
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Payment required. Please add credits to your Lovable AI workspace." 
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the base64 image from the response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: imageUrl,
        prompt: prompt 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-avatar function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
