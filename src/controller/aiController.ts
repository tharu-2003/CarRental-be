import { Request, Response } from "express";
import OpenAI from "openai";
import { Car } from "../models/Car"; 

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const handleCarChat = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { message }: { message: string } = req.body;

    if (!message) {
      res.status(400).json({ reply: "Message is required" });
      return;
    }

    // 🔹 Fetch available cars
    const cars = await Car.find({ isAvailable: true })
      .limit(5)
      .select(
        "brand model year category fuel_type transmission seating_capacity pricePerDay location description"
      );

    // 🔹 Build context for AI
    const carContext = cars
      .map(
        (c) => `
            Car: ${c.brand} ${c.model} (${c.year})
            Category: ${c.category}
            Fuel: ${c.fuel_type}
            Transmission: ${c.transmission}
            Seats: ${c.seating_capacity}
            Price per day: LKR ${c.pricePerDay}
            Location: ${c.location}
            Description: ${c.description}
        `
      )
      .join("\n");

    // 🔹 Call Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
            You are a smart and friendly car rental assistant.
            Help users find the best cars from our rental system.
            Only recommend cars from the list below.

            Available cars:
            ${carContext}
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error: any) {
    console.error("Groq Car Chat Error:", error);
    res.status(500).json({
      reply: "Service temporarily unavailable. Please try again shortly 🚗",
    });
  }
};
