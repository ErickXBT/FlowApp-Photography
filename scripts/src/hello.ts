import fs from "fs";

const openapiPath = "d:/FlowApp Photography/FlowApp-Photography/lib/api-spec/openapi.yaml";
const content = fs.readFileSync(openapiPath, "utf-8");
const lines = content.split("\n");
lines.forEach((line, index) => {
  if (line.includes("profile") || line.includes("tenant") || line.includes("me")) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
