const SAMPLE_LINES = [
  "My neighbour has encroached on my property boundary and I need legal advice on sending a notice.",
  "I paid for a product online but received a defective item and the seller is refusing a refund.",
  "I was terminated from my job without proper notice and want to understand my labour law rights.",
  "There is an ongoing dispute with my landlord regarding the security deposit after vacating the flat.",
  "I need help filing a consumer complaint against a telecom provider for incorrect billing.",
  "A financial transaction through UPI was unauthorized and I want to report it under cyber laws.",
];

export function generateMockTranscript(): string {
  const base = SAMPLE_LINES[Math.floor(Math.random() * SAMPLE_LINES.length)];
  const suffix = ` Recorded on ${new Date().toLocaleString("en-IN")}.`;
  return base + suffix;
}
