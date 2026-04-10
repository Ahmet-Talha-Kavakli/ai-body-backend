export interface CoachPersonaTraits {
  empathy: number; // 0-100
  strictness: number; // 0-100
  humor: number; // 0-100
  techSavviness: number; // 0-100
  motivationalStyle: "rewards" | "challenges" | "supportive" | "analytical";
}

export interface UserFeedback {
  messageId: string;
  feedback: "positive" | "negative" | "neutral";
  timestamp: Date;
  context?: string;
}

export class CoachPersonaAdapter {
  private traits: CoachPersonaTraits;

  constructor(initialTraits?: Partial<CoachPersonaTraits>) {
    this.traits = {
      empathy: initialTraits?.empathy ?? 70,
      strictness: initialTraits?.strictness ?? 50,
      humor: initialTraits?.humor ?? 60,
      techSavviness: initialTraits?.techSavviness ?? 75,
      motivationalStyle: initialTraits?.motivationalStyle ?? "supportive",
    };
  }

  /**
   * Adjust persona traits based on user feedback
   */
  processFeedback(feedback: UserFeedback): void {
    // Positive feedback reinforces current approach
    if (feedback.feedback === "positive") {
      this.traits.empathy = Math.min(100, this.traits.empathy + 2);
      if (this.traits.motivationalStyle === "supportive") {
        this.traits.empathy = Math.min(100, this.traits.empathy + 2);
      }
    }

    // Negative feedback shifts approach
    if (feedback.feedback === "negative") {
      if (this.traits.strictness > 70) {
        this.traits.strictness = Math.max(30, this.traits.strictness - 5);
      }
      if (this.traits.humor > 70) {
        this.traits.humor = Math.max(40, this.traits.humor - 5);
      }
    }

    // Neutral feedback nudges towards moderation
    if (feedback.feedback === "neutral") {
      this.traits.strictness = Math.max(
        40,
        Math.min(60, this.traits.strictness - 1)
      );
      this.traits.humor = Math.max(50, Math.min(70, this.traits.humor - 1));
    }

    this._clampTraits();
  }

  /**
   * Clamp all traits to 0-100 range
   */
  private _clampTraits(): void {
    Object.keys(this.traits).forEach((key) => {
      if (key !== "motivationalStyle") {
        const value = (this.traits as any)[key];
        (this.traits as any)[key] = Math.max(0, Math.min(100, value));
      }
    });
  }

  /**
   * Get current persona traits
   */
  getTraits(): CoachPersonaTraits {
    return { ...this.traits };
  }

  /**
   * Generate a coaching message with current persona
   */
  generateMessage(baseMessage: string): string {
    let message = baseMessage;

    if (this.traits.humor > 60) {
      const humorAddOns = [
        " (and your muscles will thank you!)",
        " No pain, no gains, right?",
        " Your future self will high-five you for this!",
      ];
      message += humorAddOns[Math.floor(Math.random() * humorAddOns.length)];
    }

    if (this.traits.empathy > 70) {
      const empathyAddOns = [
        " I know this is tough, but you've got this!",
        " Remember, progress over perfection.",
        " Every rep counts, and I'm proud of you for showing up.",
      ];
      message += " " + empathyAddOns[Math.floor(Math.random() * empathyAddOns.length)];
    }

    if (this.traits.strictness > 70) {
      message = message.toUpperCase();
    }

    return message;
  }

  /**
   * Serialize traits for storage
   */
  toJSON(): CoachPersonaTraits {
    return this.traits;
  }

  /**
   * Deserialize traits from storage
   */
  static fromJSON(data: CoachPersonaTraits): CoachPersonaAdapter {
    return new CoachPersonaAdapter(data);
  }
}

export function createCoachPersona(
  traits?: Partial<CoachPersonaTraits>
): CoachPersonaAdapter {
  return new CoachPersonaAdapter(traits);
}
