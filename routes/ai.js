// routes/ai.js

const express = require("express");
const axios = require("axios");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

require("dotenv").config();

// Middleware to ensure user is logged in
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/auth/github");
}

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

// Helper function to recursively collect file URLs
async function collectFileUrls(owner, repo, path = "", token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const response = await axios.get(url, {
    headers: { Authorization: `token ${token}` },
  });
  let urls = [];
  for (const item of response.data) {
    if (item.type === "file") {
      urls.push(item.html_url);
    } else if (item.type === "dir") {
      const subUrls = await collectFileUrls(owner, repo, item.path, token);
      urls = urls.concat(subUrls);
    }
  }
  return urls;
}

// AI README Generation Route
router.get("/generate", ensureAuthenticated, async (req, res) => {
  
  const { repoId, name, owner } = req.query;

  try {
    // Fetch repo content using GitHub API
    const repoData = await axios.get(
      `https://api.github.com/repos/${owner}/${name}`,
      {
        headers: {
          Authorization: `token ${req.user.token}`,
        },
      }
    );

    const filesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${name}/contents`,
      {
        headers: {
          Authorization: `token ${req.user.token}`,
        },
      }
    );

    const file_urls = await collectFileUrls(owner, name, "", req.user.token);

    // console.log(repoData.data.description, repoData.data.topics.join(", ") || "None");
    // console.log(filesResponse);

    const repoUrl = `https://github.com/${owner}/${name}`;

    // Prepare AI prompt
    const prompt = `
You are a professional open-source assistant.
Based on the following GitHub repository information, generate a high-quality, structured, markdown README.md file.

Repo Name: ${repoData.data.name}
Repo URL: ${repoUrl}

Description: ${repoData.data.description}
Topics: ${repoData.data.topics.join(", ") || "None"}

files links: ${file_urls.join(", ")}

File Structure:
${filesResponse.data.map((file) => `- ${file.name}`).join("\n")}

README should include:
- Project title
- shields or badges
- Description
- Directory (or) Repo Structure (must)
- Dependency graph i.e. A mind map using mermaid.js showcasing the dependencies between the files.
- Features (if any)
- Installation instructions
- Usage
- License
- Contribution guidelines
- Screenshots/Examples (if applicable)

Visit all the code in the file links provided. Ensure markdown formatting. Keep the README technically accurate. If some sections lack context (like screenshots), skip them or add a TODO note. Analyze the structure present in the link more carefully and include the key features. The readme should be long enough that it can help understand complete content of the repo. Also provide links of possible sources
wherever possible. Ensure all the sections of the structure within the single readme file and not as your own text.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    // console.log(response.text);
    // fs.writeFile('readme.md', response.text, (err) => {
    //   if (err) {
    //     console.log("Some Error occured");
    //   } else {
    //     console.log("Successfull");
    //   }
    // })
    readmeContent = response.text;

    if (!req.session.readmeMap) req.session.readmeMap = {};
    req.session.readmeMap[repoId] = readmeContent;

    res.redirect(`/preview?q=${repoId}&name=${name}&owner=${owner}`);
  } catch (error) {
    console.error(
      "AI generation error:",
      error.message || error.response?.data || error
    );
    if (!req.session.readmeMap) req.session.readmeMap = {};
    req.session.readmeMap[repoId] = "README generation failed. Please try again later.";
    res.redirect(`/preview?q=${repoId}&name=${name}&owner=${owner}`);
  }
});

module.exports = router;
