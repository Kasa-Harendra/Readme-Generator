const express = require("express");
const axios = require("axios");
const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/auth/github");
}

router.get("/home", ensureAuthenticated, async (req, res) => {
  try {
    const response = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `token ${req.user.token}`,
      },
    });

    res.render("home", {
      user: req.user,
      repos: response.data,
    });
  } catch (error) {
    console.error("Error fetching repos:", error.message);
    res.send("Failed to fetch repositories.");
  }
});

router.get("/preview", ensureAuthenticated, (req, res) => {
  const { q: repoId, name, owner } = req.query;
  const readmeContent = req.session.readmeMap ? req.session.readmeMap[repoId] : '';
  res.render('preview', { repoId, repoName: name, owner, readmeContent });
});

router.get("/edit", ensureAuthenticated, (req, res) => {
  const { q: repoId, name } = req.query;
  const readmeContent = req.session.readmeMap ? req.session.readmeMap[repoId] : '';
  res.render('edit', { repoId, repoName: name, readmeContent });
});

router.post("/edit", ensureAuthenticated, (req, res) => {
  const { repoId, name } = req.query;
  const { readmeContent } = req.body;

  if (!req.session.readmeMap) req.session.readmeMap = {};
  req.session.readmeMap[repoId] = readmeContent;

  res.redirect(`/preview?q=${repoId}&name=${name}`);

});

router.get("/download", ensureAuthenticated, (req, res) => {
  const { repoId, name } = req.query;
  let content = "No README content available.";
  if (req.session.readmeMap && req.session.readmeMap[repoId]) {
    content = req.session.readmeMap[repoId];
  }
  
  res.setHeader("Content-Disposition", `attachment; filename=README_${name}.md`);
  res.setHeader("Content-Type", "text/markdown");
  res.send(content);
});

router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { 
      return next(err); 
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error: Failed to destroy the session during logout.', err);
        return next(err);
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

module.exports = router;
