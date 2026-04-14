export const EVENT_PROMPTS = {
  fire_only: {
    name: "Chuva de Fogo",
    prompt: `Create a dramatic and vibrant promotional image for a mobile survival shooter game called "Last Stand Arena". 

Theme: FIRE STORM - Only fire bullets deal damage, extra damage bonus.

Visual requirements:
- Epic fiery battlefield with orange, red, and yellow color palette
- Fiery explosions and fire trails emanating from weapons
- Dark atmospheric background with volcanic/fire elements
- Glowing ember particles floating in the air
- Dynamic action composition showing the chaos of battle
- Bold, eye-catching design suitable for social media

Style: Digital art, high contrast, dramatic lighting, cinematic quality
Colors: Deep black background with vibrant orange (#FF4500), red (#FF0000), and gold (#FFD700) accents
Mood: Intense, powerful, action-packed

Include dramatic text overlay area for event name.`,
  },
  fast_enemies: {
    name: "Fúria Veloz",
    prompt: `Create a dynamic promotional image for a mobile survival shooter game called "Last Stand Arena".

Theme: SPEED MADNESS - Enemies move 2x faster than normal.

Visual requirements:
- Blurred motion lines showing extreme speed
- Enemy swarms rushing toward the viewer at incredible speed
- Intense, fast-paced action frozen in time
- Neon cyan and electric blue lightning effects
- Dark futuristic battlefield background
- Sense of overwhelming velocity and danger

Style: Digital art, motion blur effects, high energy, cinematic
Colors: Deep black/dark blue background with electric cyan (#00FFFF), white, and intense red (#FF0000) accents
Mood: Adrenaline-pumping, thrilling, intense

Include dramatic text overlay area for event name.`,
  },
  no_powerups: {
    name: "Sem Ajuda",
    prompt: `Create a gritty and intense promotional image for a mobile survival shooter game called "Last Stand Arena".

Theme: NO HELP - No power-ups available, pure survival skill challenge.

Visual requirements:
- Barren, desolate battlefield with empty pickup slots
- Lone warrior standing alone against waves of enemies
- Minimalist, stripped-down aesthetic
- Dramatic isolation lighting on the player character
- Empty glowing slots where power-ups should be
- Dark, oppressive atmosphere emphasizing the challenge

Style: Digital art, dramatic lighting, cinematic, slightly gritty
Colors: Deep dark blue (#0a0a20) background with stark white (#FFFFFF), muted orange (#FF6600), and cold blue (#4488FF) accents
Mood: Isolation, challenge, determination, survival

Include dramatic text overlay area for event name.`,
  },
  infinite_wave: {
    name: "Mar Infinito",
    prompt: `Create an epic and continuous promotional image for a mobile survival shooter game called "Last Stand Arena".

Theme: ENDLESS WAVE - No pause between waves, upgrade between waves disabled.

Visual requirements:
- Endless sea of enemies approaching in infinite waves
- Player in the center of a massive battlefield
- Conveyor belt or stream of enemies without breaks
- Clock/time elements showing continuous flow
- Epic scale showing the overwhelming numbers
- Dark warzone with action everywhere

Style: Digital art, epic scale, cinematic, dramatic
Colors: Deep black (#000000) background with electric blue (#0088FF), purple (#8800FF), and intense red (#FF0044) creating a warzone feel
Mood: Epic, endless, overwhelming, intense combat

Include dramatic text overlay area for event name.`,
  },
  default: {
    name: "Evento Semanal",
    prompt: `Create an exciting promotional image for a mobile survival shooter game called "Last Stand Arena".

Theme: Weekly Challenge Event.

Visual requirements:
- Action-packed battlefield with dynamic combat
- Glowing UI elements and score multipliers
- Players fighting against waves of enemies
- Vibrant, colorful arcade aesthetic
- Eye-catching composition for social media
- Epic, high-energy feel

Style: Digital art, arcade aesthetics, vibrant colors, high energy
Colors: Deep purple (#1a0a3a) background with neon pink (#FF00FF), cyan (#00FFFF), and gold (#FFD700) accents
Mood: Exciting, fun, challenging, competitive

Include space for text overlay.`,
  },
};

export function getEventPrompt(eventId: string): string {
  const event = EVENT_PROMPTS[eventId as keyof typeof EVENT_PROMPTS];
  if (!event) return EVENT_PROMPTS.default.prompt;
  return event.prompt;
}

export function getEventName(eventId: string): string {
  const event = EVENT_PROMPTS[eventId as keyof typeof EVENT_PROMPTS];
  return event?.name ?? "Evento Semanal";
}
